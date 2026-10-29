/**
 * 支付通道（服务端权威实现）
 *
 * 流程：校验 → 锁定（可用→冻结）→ 记账（订单 + 链上交易 + 分红）→ 结算（解冻）→ 链式存证
 * 全程单事务，任一步失败整体回滚；幂等键保证重复请求不会重复扣款。
 *
 * 业务口径与前端 src/lib/engine.js 的 calcPaymentSplit 完全一致（SPLIT 常量同源抄录）。
 */
import crypto from "node:crypto";
import db from "./db.mjs";

/* 与 src/lib/engine.js SPLIT_RULES 保持一致 */
export const SPLIT = {
  userReward: 1.0, // 消费者 1:1 返利
  vipRatio: 0.2, // VIP 推荐人 20%
  levelDiffRatio: 0.729, // M1-M9 级差 72.9%
  contributorRatio: 0.071, // 杰出贡献 7.1%
  merchantReturnMultiple: 2,
  physicalShare: 0.5,
  storeShare: 0.5,
};

export function splitPayment(amount = 0, tipRatio = 10) {
  const safeAmount = Math.max(0, Number(amount) || 0);
  const safeTip = Math.min(30, Math.max(5, Number(tipRatio) || 10));
  const merchantConsumed = (safeAmount * safeTip) / 100;
  return {
    amount: round2(safeAmount),
    tipRatio: safeTip,
    userReward: round2(safeAmount * SPLIT.userReward),
    merchantConsumed: round2(merchantConsumed),
    merchantReturn: round2(merchantConsumed * SPLIT.merchantReturnMultiple),
    vipReward: round2(safeAmount * SPLIT.vipRatio),
    levelDiffReward: round2(safeAmount * SPLIT.levelDiffRatio),
    contributorReward: round2(safeAmount * SPLIT.contributorRatio),
    physicalPoolAdd: round2(merchantConsumed * SPLIT.physicalShare),
    storePoolAdd: round2(merchantConsumed * SPLIT.storeShare),
  };
}

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const nowISO = () => new Date().toISOString();
const newId = (prefix) => `${prefix}_${Date.now().toString(36)}${crypto.randomBytes(3).toString("hex")}`;

/* ------------------------------ 建表 ------------------------------ */
db.exec(`
  CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    idempotency_key TEXT UNIQUE NOT NULL,
    order_id TEXT,
    order_no TEXT,
    tx_hash TEXT,
    user_email TEXT,
    merchant_id TEXT,
    merchant_name TEXT,
    amount REAL,
    tip_ratio REAL,
    method TEXT,
    status TEXT,
    request_json TEXT,
    response_json TEXT,
    created_date TEXT,
    settled_date TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_email);
  CREATE INDEX IF NOT EXISTS idx_payments_created ON payments(created_date);

  CREATE TABLE IF NOT EXISTS chain_ledger (
    seq INTEGER PRIMARY KEY AUTOINCREMENT,
    hash TEXT UNIQUE,
    prev_hash TEXT,
    type TEXT,
    ref_id TEXT,
    payload TEXT,
    created_date TEXT
  );
`);

/* ---------------------------- 链式存证 ---------------------------- */
const hashOf = (s) => crypto.createHash("sha256").update(String(s)).digest("hex").slice(0, 32);

function appendChain(type, refId, payload) {
  const last = db.prepare("SELECT hash FROM chain_ledger ORDER BY seq DESC LIMIT 1").get();
  const prevHash = last?.hash || "genesis";
  const body = { type, refId, payload, ts: nowISO(), prevHash };
  const hash = hashOf(JSON.stringify(body));
  db.prepare(
    "INSERT INTO chain_ledger (hash, prev_hash, type, ref_id, payload, created_date) VALUES (?,?,?,?,?,?)"
  ).run(hash, prevHash, type, refId, JSON.stringify(payload), body.ts);
  return hash;
}

export function verifyChain(limit = 500) {
  const rows = db.prepare("SELECT * FROM chain_ledger ORDER BY seq ASC LIMIT ?").all(limit);
  let prev = "genesis";
  for (const row of rows) {
    if (row.prev_hash !== prev) return { ok: false, brokenAt: row.seq, expected: prev, actual: row.prev_hash };
    prev = row.hash;
  }
  return { ok: true, length: rows.length, head: prev };
}

/* ---------------------------- 支付主流程 ---------------------------- */
export function pay({
  userEmail = "demo@nms.ai",
  merchantCode,
  merchantId,
  amount,
  method = "nms",
  tipRatio,
  idempotencyKey,
  qrToken,
} = {}) {
  if (!idempotencyKey) {
    const err = new Error("idempotency_key_required");
    err.status = 400;
    throw err;
  }

  /* 1. 幂等：同一 key 直接返回首次结果 */
  const existing = db.prepare("SELECT * FROM payments WHERE idempotency_key = ?").get(idempotencyKey);
  if (existing) {
    return { ...JSON.parse(existing.response_json), idempotent: true, paymentId: existing.id };
  }

  /* 2. 校验金额 */
  const amt = round2(amount);
  if (!(amt > 0)) {
    const err = new Error("invalid_amount");
    err.status = 400;
    throw err;
  }

  /* 3. 定位商家 */
  const merchant = merchantId
    ? db.prepare('SELECT * FROM "MerchantStore" WHERE id = ?').get(merchantId)
    : db.prepare('SELECT * FROM "MerchantStore" WHERE qr_code = ? OR store_name = ?').get(merchantCode, merchantCode);

  if (!merchant) {
    const err = new Error("merchant_not_found");
    err.status = 404;
    throw err;
  }
  if (!merchant.is_verified) {
    const err = new Error("merchant_not_verified");
    err.status = 403;
    throw err;
  }

  const balance = db.prepare('SELECT * FROM "UserBalance" WHERE user_email = ?').get(userEmail);
  if (!balance) {
    const err = new Error("balance_not_found");
    err.status = 404;
    throw err;
  }

  const split = splitPayment(amt, tipRatio ?? merchant.tip_ratio ?? 10);
  const orderNo = `NMS${Date.now().toString().slice(-9)}`;
  const orderId = newId("ord");
  const txHash = `0x${crypto.randomBytes(20).toString("hex")}`;
  const paymentId = newId("pay");
  const ts = nowISO();

  /* 4. 资金校验（按支付方式） */
  if (method === "nms" && (balance.available_nms || 0) < amt) {
    const err = new Error("insufficient_nms");
    err.status = 402;
    err.detail = { required: amt, available: balance.available_nms };
    throw err;
  }
  if (method === "acs" && (balance.acs_balance || 0) < amt) {
    const err = new Error("insufficient_acs");
    err.status = 402;
    err.detail = { required: amt, available: balance.acs_balance };
    throw err;
  }

  /* 5. 单事务：锁定 → 记账 → 结算 */
  db.exec("BEGIN IMMEDIATE");
  try {
    /* 5.1 锁定：可用 → 冻结 */
    if (method === "nms") {
      db.prepare('UPDATE "UserBalance" SET available_nms = available_nms - ?, locked_nms = locked_nms + ? WHERE id = ?').run(
        amt,
        amt,
        balance.id
      );
    } else if (method === "acs") {
      db.prepare('UPDATE "UserBalance" SET acs_balance = acs_balance - ?, locked_nms = locked_nms + ? WHERE id = ?').run(
        amt,
        amt,
        balance.id
      );
    }

    /* 5.2 订单 */
    db.prepare(
      `INSERT INTO "PaymentOrder" (
        id, order_no, merchant_id, merchant_email, merchant_name, user_email, amount, payment_method,
        tip_ratio, merchant_consumed, user_reward, merchant_return, vip_reward, level_diff_reward,
        contributor_reward, physical_nft_pool_add, nft_minted, burned_amount, status, quantum_signature,
        created_date, updated_date
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).run(
      orderId,
      orderNo,
      merchant.id,
      merchant.owner_email,
      merchant.store_name,
      userEmail,
      amt,
      method,
      split.tipRatio,
      split.merchantConsumed,
      split.userReward,
      split.merchantReturn,
      split.vipReward,
      split.levelDiffReward,
      split.contributorReward,
      split.physicalPoolAdd,
      1,
      round2(amt * 0.35),
      "completed",
      `KYBER768-${crypto.randomBytes(12).toString("hex").toUpperCase()}`,
      ts,
      ts
    );

    /* 5.3 链上交易 */
    db.prepare(
      `INSERT INTO "Transaction" (
        id, tx_hash, block_number, from_address, to_address, amount, token_type, status, gas_fee,
        quantum_signature, signature_time_ms, created_date, updated_date
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).run(
      newId("tx"),
      txHash,
      18492000 + Math.floor(Math.random() * 90000),
      userEmail,
      merchant.id,
      amt,
      method === "acs" ? "ACS" : "NMS",
      "confirmed",
      0,
      `KYBER768-${crypto.randomBytes(12).toString("hex").toUpperCase()}`,
      Date.now(),
      ts,
      ts
    );

    /* 5.3b 消费即铸造：实物 RWA 凭证 NFT */
    const nftId = newId("nft");
    const nftName = `${merchant.store_name} · 消费凭证 #${orderNo.slice(-4)}`;
    const nftToken = `#${orderNo.slice(-6)}`;
    db.prepare(
      `INSERT INTO "NFTItem" (
        id, name, description, nft_type, category, price, original_value, royalty_percent,
        owner_email, creator_email, merchant_id, merchant_name, token_id, rarity, is_for_sale,
        trade_count, total_royalty_earned, dividend_earned, synthesis_level, created_date, updated_date
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).run(
      nftId,
      nftName,
      `消费 ¥${amt} 铸造的 RWA 实物凭证，享永久 10% 版税四方分成。`,
      "physical",
      merchant.category || "零售",
      amt,
      amt,
      10,
      userEmail,
      merchant.owner_email,
      merchant.id,
      merchant.store_name,
      nftToken,
      amt > 1000 ? "epic" : "common",
      0,
      0,
      0,
      0,
      0,
      ts,
      ts
    );

    /* 5.4 结算：解冻 + 返利 + 商家池 */
    if (method === "nms") {
      db.prepare(
        'UPDATE "UserBalance" SET locked_nms = locked_nms - ?, available_nms = available_nms + ?, total_consumption = total_consumption + ?, total_rewards = total_rewards + ?, nft_physical_count = nft_physical_count + 1 WHERE id = ?'
      ).run(amt, split.userReward, amt, split.userReward, balance.id);
    } else if (method === "acs") {
      db.prepare(
        'UPDATE "UserBalance" SET locked_nms = locked_nms - ?, available_nms = available_nms + ?, total_consumption = total_consumption + ?, total_rewards = total_rewards + ?, nft_physical_count = nft_physical_count + 1 WHERE id = ?'
      ).run(amt, split.userReward, amt, split.userReward, balance.id);
    } else {
      db.prepare(
        'UPDATE "UserBalance" SET available_nms = available_nms + ?, total_consumption = total_consumption + ?, total_rewards = total_rewards + ?, nft_physical_count = nft_physical_count + 1 WHERE id = ?'
      ).run(split.userReward, amt, split.userReward, balance.id);
    }

    db.prepare(
      `UPDATE "MerchantStore" SET
        tip_wallet_balance = tip_wallet_balance + ?,
        dividend_pool = dividend_pool + ?,
        physical_nft_pool = physical_nft_pool + ?,
        store_nft_pool = store_nft_pool + ?,
        total_sales = total_sales + ?,
        total_transactions = total_transactions + 1,
        updated_date = ?
      WHERE id = ?`
    ).run(
      split.merchantConsumed,
      split.merchantReturn,
      split.physicalPoolAdd,
      split.storePoolAdd,
      amt,
      ts,
      merchant.id
    );

    /* 5.5 通道记录 + 链式存证 */
    const response = {
      ok: true,
      paymentId,
      orderId,
      orderNo,
      txHash,
      amount: amt,
      method,
      merchant: { id: merchant.id, name: merchant.store_name },
      nft: { id: nftId, name: nftName, token_id: nftToken },
      split,
      balanceAfter: {
        available_nms: round2((balance.available_nms || 0) - (method === "nms" ? amt : 0) + split.userReward),
        locked_nms: round2((balance.locked_nms || 0) + (method === "cash" ? 0 : 0)),
      },
      settledAt: ts,
    };

    db.prepare(
      `INSERT INTO payments (
        id, idempotency_key, order_id, order_no, tx_hash, user_email, merchant_id, merchant_name,
        amount, tip_ratio, method, status, request_json, response_json, created_date, settled_date
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).run(
      paymentId,
      idempotencyKey,
      orderId,
      orderNo,
      txHash,
      userEmail,
      merchant.id,
      merchant.store_name,
      amt,
      split.tipRatio,
      method,
      "settled",
      JSON.stringify({ userEmail, merchantCode, amount: amt, method, tipRatio }),
      JSON.stringify(response),
      ts,
      ts
    );

    const chainHash = appendChain("payment.settled", paymentId, {
      orderNo,
      txHash,
      amount: amt,
      method,
      merchantId: merchant.id,
    });

    db.exec("COMMIT");
    return { ...response, chainHash, idempotent: false };
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

/* ------------------------------ 退款 ------------------------------ */
export function refund({ paymentId, idempotencyKey = `refund_${paymentId}` } = {}) {
  const payment = db.prepare("SELECT * FROM payments WHERE id = ?").get(paymentId);
  if (!payment) {
    const err = new Error("payment_not_found");
    err.status = 404;
    throw err;
  }
  // 幂等：已退款直接返回（以支付单状态为准，而不是退款键）
  if (payment.status === "refunded") {
    return { ok: true, refunded: true, idempotent: true, paymentId: payment.id };
  }
  if (payment.status !== "settled") {
    const err = new Error("payment_not_refundable");
    err.status = 409;
    throw err;
  }

  const response = JSON.parse(payment.response_json);
  const balance = db.prepare('SELECT * FROM "UserBalance" WHERE user_email = ?').get(payment.user_email);
  const merchant = db.prepare('SELECT * FROM "MerchantStore" WHERE id = ?').get(payment.merchant_id);
  const ts = nowISO();

  db.exec("BEGIN IMMEDIATE");
  try {
    db.prepare('UPDATE "UserBalance" SET available_nms = available_nms - ?, total_rewards = total_rewards - ?, total_consumption = total_consumption - ? WHERE id = ?').run(
      response.split.userReward,
      response.split.userReward,
      payment.amount,
      balance.id
    );

    if (merchant) {
      db.prepare(
        `UPDATE "MerchantStore" SET
          tip_wallet_balance = tip_wallet_balance - ?,
          dividend_pool = dividend_pool - ?,
          physical_nft_pool = physical_nft_pool - ?,
          store_nft_pool = store_nft_pool - ?,
          total_sales = total_sales - ?,
          total_transactions = MAX(0, total_transactions - 1),
          updated_date = ?
        WHERE id = ?`
      ).run(
        response.split.merchantConsumed,
        response.split.merchantReturn,
        response.split.physicalPoolAdd,
        response.split.storePoolAdd,
        payment.amount,
        ts,
        merchant.id
      );
    }

    db.prepare('UPDATE "PaymentOrder" SET status = ?, updated_date = ? WHERE id = ?').run("refunded", ts, payment.order_id);
    db.prepare('UPDATE "Transaction" SET status = ?, updated_date = ? WHERE tx_hash = ?').run("failed", ts, payment.tx_hash);
    db.prepare("UPDATE payments SET status = ?, settled_date = ? WHERE id = ?").run("refunded", ts, paymentId);

    const chainHash = appendChain("payment.refunded", paymentId, { amount: payment.amount, orderNo: payment.order_no });

    db.exec("COMMIT");
    return { ok: true, refunded: true, paymentId, chainHash, amount: payment.amount, idempotent: false };
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

/* ------------------------------ 查询 ------------------------------ */
export function getPayment(id) {
  const row = db.prepare("SELECT * FROM payments WHERE id = ? OR idempotency_key = ?").get(id, id);
  if (!row) return null;
  return { ...row, response: row.response_json ? JSON.parse(row.response_json) : null };
}

export function listPayments({ limit = 20, userEmail } = {}) {
  const rows = userEmail
    ? db.prepare("SELECT * FROM payments WHERE user_email = ? ORDER BY created_date DESC LIMIT ?").all(userEmail, limit)
    : db.prepare("SELECT * FROM payments ORDER BY created_date DESC LIMIT ?").all(limit);
  return rows.map((r) => ({
    id: r.id,
    orderNo: r.order_no,
    amount: r.amount,
    method: r.method,
    status: r.status,
    merchant: r.merchant_name,
    user: r.user_email,
    created: r.created_date,
  }));
}

/* ------------------------------ 对账 ------------------------------ */
export function reconcile({ date } = {}) {
  const day = date || new Date().toISOString().slice(0, 10);
  const like = `${day}%`;

  const orders = db
    .prepare(
      `SELECT COUNT(*) AS c, COALESCE(SUM(amount),0) AS sum FROM "PaymentOrder"
       WHERE status = 'completed' AND created_date LIKE ?`
    )
    .get(like);

  const txs = db
    .prepare(
      `SELECT COUNT(*) AS c, COALESCE(SUM(amount),0) AS sum FROM "Transaction"
       WHERE status = 'confirmed' AND created_date LIKE ? AND to_address NOT LIKE 'NMS-%'`
    )
    .get(like);

  const channel = db
    .prepare(
      `SELECT COUNT(*) AS c, COALESCE(SUM(amount),0) AS sum FROM payments
       WHERE status = 'settled' AND created_date LIKE ?`
    )
    .get(like);

  /* 订单无对应链上交易（按金额+时间近似匹配，严格场景应加 order_id 外键） */
  const orphanOrders = db
    .prepare(
      `SELECT o.order_no, o.amount, o.created_date FROM "PaymentOrder" o
       WHERE o.status='completed' AND o.created_date LIKE ?
         AND NOT EXISTS (
           SELECT 1 FROM "Transaction" t
           WHERE t.amount = o.amount AND t.to_address = o.merchant_id
             AND substr(t.created_date,1,10) = substr(o.created_date,1,10)
         )
       LIMIT 20`
    )
    .all(like);

  /* 通道记录缺订单 */
  const orphanPayments = db
    .prepare(
      `SELECT p.id, p.order_no, p.amount FROM payments p
       WHERE p.status='settled' AND p.created_date LIKE ?
         AND NOT EXISTS (SELECT 1 FROM "PaymentOrder" o WHERE o.id = p.order_id)
       LIMIT 20`
    )
    .all(like);

  const diff = round2((orders.sum || 0) - (txs.sum || 0));

  /* 通道维度对账：payments(settled) 与 PaymentOrder(completed) 必须逐笔对齐 */
  const channelVsOrders = db
    .prepare(
      `SELECT
         COALESCE(SUM(p.amount),0) AS channel_sum,
         COALESCE(SUM(o.amount),0) AS order_sum,
         COUNT(*) AS pairs
       FROM payments p
       LEFT JOIN "PaymentOrder" o ON o.id = p.order_id
       WHERE p.status='settled' AND p.created_date LIKE ?`
    )
    .get(like);

  const channelDiff = round2((channelVsOrders.channel_sum || 0) - (channelVsOrders.order_sum || 0));

  /**
   * 通道口径的「账平」：通道记录与订单必须逐笔对齐、且无孤立通道单。
   * 历史种子订单（非通道产生）单独记为 legacyOrphans，不影响通道结论。
   */
  const balanced = Math.abs(channelDiff) < 0.01 && orphanPayments.length === 0;

  return {
    date: day,
    balanced,
    orders: { count: orders.c, sum: round2(orders.sum) },
    transactions: { count: txs.c, sum: round2(txs.sum) },
    channel: { count: channel.c, sum: round2(channel.sum) },
    diff,
    channelDiff,
    pairs: channelVsOrders.pairs,
    orphanOrders,
    orphanPayments,
    legacyOrphans: orphanOrders.length,
    chain: verifyChain(),
    checkedAt: nowISO(),
  };
}
