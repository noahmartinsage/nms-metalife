/**
 * NMS MetaLife 本地服务端（Node 原生 http + node:sqlite，零第三方依赖）
 *
 * 启动：npm run server          → http://127.0.0.1:8787
 * 健康检查：GET /api/health
 *
 * 与前端 base44Client 契约保持一致，切换方式：
 *   VITE_API_BASE=http://127.0.0.1:8787 npm run dev
 */
import http from "node:http";
import { URL } from "node:url";
import db, {
  ENTITY_ORDER,
  SCHEMAS,
  SERVER_BOOT,
  list,
  filter,
  get,
  create,
  update,
  remove,
  counts,
  bulkSeed,
  resetAll,
  findUserByToken,
  findUserByEmail,
  dbInfo,
} from "./db.mjs";
import {
  pay,
  refund,
  getPayment,
  listPayments,
  reconcile,
  verifyChain,
  splitPayment,
  requestRefund,
  listRefunds,
  approveRefund,
  rejectRefund,
  runReconcile,
  listReconcileRuns,
  listAlerts,
  REFUND_RULES,
  compensate,
} from "./payments.mjs";
import { audit, listAudit, auditStats } from "./audit.mjs";
import {
  issueToken,
  verifyToken,
  revokeToken,
  sendOtp,
  loginWithOtp,
  resolveIdentity,
  requireAuth,
  requireRole,
  AUTH_META,
  STRICT,
} from "./auth.mjs";
import { startScheduler, schedulerStatus, runReconcileNow } from "./scheduler.mjs";
import { signMerchantPayload, verifyMerchantPayload, QR_META } from "./qr.mjs";
import kms from "./kms.mjs";

const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || "127.0.0.1";
const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN || "http://127.0.0.1:3000,http://localhost:3000,http://127.0.0.1:5173,http://localhost:5173").split(",");

/* --------------------------- 简易速率限制 --------------------------- */
const hits = new Map();
const RATE_WINDOW = 60_000;
const RATE_MAX = 600;

function rateLimited(ip) {
  const now = Date.now();
  const rec = hits.get(ip) || { count: 0, start: now };
  if (now - rec.start > RATE_WINDOW) {
    rec.count = 0;
    rec.start = now;
  }
  rec.count += 1;
  hits.set(ip, rec);
  return rec.count > RATE_MAX;
}

/* ------------------------------ 工具 ------------------------------ */
const json = (res, status, body) => {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(payload),
    "cache-control": "no-store",
  });
  res.end(payload);
};

const readBody = (req) =>
  new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > 4 * 1024 * 1024) {
        reject(Object.assign(new Error("payload too large"), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => {
      if (!chunks.length) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch (e) {
        reject(Object.assign(new Error("invalid json"), { status: 400 }));
      }
    });
    req.on("error", reject);
  });

const securityHeaders = (res) => {
  res.setHeader("x-content-type-options", "nosniff");
  res.setHeader("x-frame-options", "SAMEORIGIN");
  res.setHeader("referrer-policy", "no-referrer");
  res.setHeader("permissions-policy", "camera=(self), microphone=()");
};

const cors = (req, res) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("access-control-allow-origin", origin);
    res.setHeader("vary", "origin");
  } else if (ALLOWED_ORIGINS.includes("*")) {
    res.setHeader("access-control-allow-origin", "*");
  }
  res.setHeader("access-control-allow-methods", "GET,POST,PATCH,PUT,DELETE,OPTIONS");
  res.setHeader("access-control-allow-headers", "content-type,authorization,x-user-email");
  res.setHeader("access-control-max-age", "600");
};

/** 当前身份（严格模式下可能为 null，写操作请用 requireAuth/requireRole） */
const authOf = (req) => resolveIdentity(req) || { id: "anonymous", email: "anonymous", full_name: "未登录", role: "guest" };

/**
 * 交易签名载荷：只包含**不可变**的链上字段，顺序由 canonical 保证。
 * 注意不要包含 status —— 退款会把 status 改成 failed，若参与签名会导致验签必然失败。
 * 客户端提交的签名一律丢弃，服务端重签后才落库。
 */
const txPayload = (body) =>
  kms.canonical({
    tx_hash: body.tx_hash,
    block_number: body.block_number ?? null,
    from: body.from_address,
    to: body.to_address,
    amount: Number(body.amount),
    token: body.token_type || "NMS",
  });

/** 为交易行生成真实后量子签名 */
async function signTransactionRow(body, actor) {
  const signed = await kms.sign(txPayload(body), {
    context: "transaction",
    actor: actor?.email || "client",
  });
  return {
    ...body,
    quantum_signature: signed.signature,
    signature_time_ms: Date.now(),
    signature_algorithm: signed.algorithm,
    signing_key_id: signed.keyId,
    signing_key_fingerprint: signed.fingerprint,
    payload_hash: signed.payloadHash,
  };
}

/* ------------------------------ 路由 ------------------------------ */
const server = http.createServer(async (req, res) => {
  const started = Date.now();
  securityHeaders(res);
  cors(req, res);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  const ip = req.socket.remoteAddress || "local";
  if (rateLimited(ip)) return json(res, 429, { error: "rate_limited" });

  const url = new URL(req.url, `http://${req.headers.host}`);
  const seg = url.pathname.replace(/^\/+|\/+$/g, "").split("/"); // api/entities/Name/:id
  const method = req.method.toUpperCase();

  try {
    /* 健康检查 */
    if (method === "GET" && url.pathname === "/api/health") {
      return json(res, 200, {
        ok: true,
        service: "nms-metalife-api",
        version: "1.0.0",
        time: new Date().toISOString(),
        uptime: Math.round(process.uptime()),
        audit: auditStats(),
        boot: SERVER_BOOT,
        db: dbInfo(),
        channel: { pay: "POST /api/pay", refund: "POST /api/pay/refund/request", reconcile: "GET /api/admin/reconcile", qr: QR_META },
        refundRules: REFUND_RULES,
        auth: AUTH_META,
        kms: kms.health(),
        scheduler: schedulerStatus(),
      });
    }

    /* Schema 元数据 */
    if (method === "GET" && url.pathname === "/api/schemas") {
      return json(res, 200, { order: ENTITY_ORDER, schemas: SCHEMAS });
    }

    /* 认证 */
    if (method === "POST" && url.pathname === "/api/auth/me") {
      return json(res, 200, authOf(req));
    }
    if (method === "POST" && url.pathname === "/api/auth/otp") {
      const body = await readBody(req);
      return json(res, 200, sendOtp({ email: body.email }));
    }

    if (method === "POST" && url.pathname === "/api/auth/login") {
      const body = await readBody(req);

      /* 严格模式必须带验证码；宽松模式允许仅凭邮箱登录（本地自测） */
      if (STRICT || body.code) {
        return json(res, 200, loginWithOtp({ email: body.email, code: body.code }));
      }

      const user = findUserByEmail(String(body.email || "")) || findUserByEmail("demo@nms.ai");
      if (!user) return json(res, 401, { error: "user_not_found" });
      const issued = issueToken({
        id: user.id,
        email: user.email,
        role: user.role || "user",
        full_name: user.full_name || "",
      });
      return json(res, 200, {
        token: issued.token,
        expiresIn: issued.expiresIn,
        user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
      });
    }

    if (method === "POST" && url.pathname === "/api/auth/logout") {
      const raw = req.headers.authorization || "";
      const token = raw.startsWith("Bearer ") ? raw.slice(7).trim() : null;
      return json(res, 200, token ? revokeToken(token) : { ok: true });
    }

    if (method === "POST" && url.pathname === "/api/auth/session") {
      const user = resolveIdentity(req);
      return json(res, 200, { authenticated: !!user, user, auth: AUTH_META });
    }

    /* 管理接口：仅 admin / owner */
    if (url.pathname.startsWith("/api/admin/")) {
      requireRole(req, ["admin", "owner"]);
    }

    /* 支付与收款码：必须登录 */
    if (url.pathname === "/api/pay" || url.pathname.startsWith("/api/pay/") || url.pathname.startsWith("/api/qr/")) {
      requireAuth(req);
    }

    /* 实体写操作：必须登录（list/filter 虽用 POST 但属读操作，放行） */
    const isEntityRead =
      url.pathname.endsWith("/list") ||
      url.pathname.endsWith("/filter") ||
      method === "GET";
    if (
      url.pathname.startsWith("/api/entities/") &&
      !isEntityRead &&
      ["POST", "PATCH", "PUT", "DELETE"].includes(method)
    ) {
      requireAuth(req);
    }

    /* 实体集合 */
    if (seg[0] === "api" && seg[1] === "entities" && seg[2]) {
      const name = decodeURIComponent(seg[2]);
      const action = seg[3] ? decodeURIComponent(seg[3]) : null;
      const isCollectionAction = action === "list" || action === "filter";
      const id = action && !isCollectionAction ? action : null;

      if (isCollectionAction && method === "POST") {
        const body = await readBody(req);
        if (action === "list") return json(res, 200, list(name, body.sort, body.limit));
        return json(res, 200, filter(name, body.query, body.sort, body.limit));
      }
      if (!action && method === "POST") {
        const body = await readBody(req);
        /* 交易签名由服务端强制生成：客户端提交的 quantum_signature 一律丢弃，防伪造 */
        const row = name === "Transaction" ? await signTransactionRow(body, authOf(req)) : body;
        return json(res, 201, create(name, row));
      }
      if (id && method === "GET") return json(res, 200, get(name, id));
      if (id && (method === "PATCH" || method === "PUT")) {
        const body = await readBody(req);
        return json(res, 200, update(name, id, body));
      }
      if (id && method === "DELETE") return json(res, 200, remove(name, id));
    }

    /* 管理操作 */
    if (method === "POST" && url.pathname === "/api/admin/seed") {
      const body = await readBody(req);
      const inserted = bulkSeed(body.entities || body);
      audit({ actor: authOf(req).email, action: "admin.seed", target: "entities", payload: { inserted } });
      return json(res, 200, { inserted, counts: counts() });
    }
    if (method === "POST" && url.pathname === "/api/admin/reset") {
      const ok = resetAll();
      audit({ actor: authOf(req).email, action: "admin.reset", target: "entities", payload: { seeded: ok } });
      return json(res, 200, { reset: true, seeded: ok, counts: counts() });
    }

    /* AI 集成（可接真实 LLM；未配置时返回确定性应答） */
    if (method === "POST" && url.pathname === "/api/integrations/llm") {
      const body = await readBody(req);
      const prompt = String(body.prompt || "").slice(0, 2000);
      if (process.env.LLM_API_KEY && process.env.LLM_ENDPOINT) {
        const r = await fetch(process.env.LLM_ENDPOINT, {
          method: "POST",
          headers: { "content-type": "application/json", authorization: `Bearer ${process.env.LLM_API_KEY}` },
          body: JSON.stringify({ model: process.env.LLM_MODEL || "gpt-4o-mini", messages: [{ role: "user", content: prompt }] }),
        });
        const data = await r.json();
        const text = data?.choices?.[0]?.message?.content || data?.content || "";
        return json(res, 200, text || "（模型未返回内容）");
      }
      return json(res, 200, `【本地推理】已收到：${prompt}\n\n当前为离线应答模式；配置 LLM_ENDPOINT 与 LLM_API_KEY 后将转发至真实模型。`);
    }

    /* ---------------- 支付通道 ---------------- */
    if (method === "POST" && url.pathname === "/api/pay") {
      const body = await readBody(req);
      const user = authOf(req);
      const result = await pay({ ...body, userEmail: body.userEmail || user.email });
      return json(res, result.idempotent ? 200 : 201, result);
    }

    if (method === "POST" && url.pathname === "/api/pay/refund") {
      const body = await readBody(req);
      return json(res, 200, await refund(body));
    }

    /* 退款申请（小额自动通过，大额进入审批） */
    if (method === "POST" && url.pathname === "/api/pay/refund/request") {
      const body = await readBody(req);
      const user = authOf(req);
      return json(res, 200, await requestRefund({ ...body, requester: body.requester || user.email }));
    }

    if (method === "GET" && url.pathname === "/api/admin/refunds") {
      return json(res, 200, {
        rules: REFUND_RULES,
        items: listRefunds({ status: url.searchParams.get("status") || undefined, limit: Number(url.searchParams.get("limit") || 20) }),
      });
    }

    if (method === "POST" && seg[0] === "api" && seg[1] === "admin" && seg[2] === "refunds" && seg[3] && seg[4]) {
      const body = await readBody(req);
      const requestId = decodeURIComponent(seg[3]);
      if (seg[4] === "approve") return json(res, 200, await approveRefund({ ...body, requestId }));
      if (seg[4] === "reject") return json(res, 200, rejectRefund({ ...body, requestId }));
    }

    if (method === "POST" && url.pathname === "/api/admin/reconcile/compensate") {
      const body = await readBody(req).catch(() => ({}));
      const user = authOf(req);
      return json(res, 200, await compensate({ date: body.date, actor: user.email }));
    }

    if (method === "GET" && url.pathname === "/api/admin/audit") {
      return json(res, 200, {
        stats: auditStats(),
        items: listAudit({
          limit: Number(url.searchParams.get("limit") || 30),
          action: url.searchParams.get("action") || undefined,
          actor: url.searchParams.get("actor") || undefined,
        }),
      });
    }

    if (method === "GET" && url.pathname === "/api/admin/reconcile/runs") {
      return json(res, 200, { scheduler: schedulerStatus(), runs: listReconcileRuns({ limit: Number(url.searchParams.get("limit") || 10) }) });
    }

    if (method === "POST" && url.pathname === "/api/admin/reconcile/run") {
      const body = await readBody(req).catch(() => ({}));
      return json(res, 200, body?.viaCron ? await runReconcileNow("manual") : runReconcile({ trigger: "manual" }));
    }

    if (method === "GET" && url.pathname === "/api/admin/alerts") {
      return json(res, 200, listAlerts({ limit: Number(url.searchParams.get("limit") || 20), onlyUnacked: url.searchParams.get("unacked") === "1" }));
    }

    if (method === "GET" && seg[0] === "api" && seg[1] === "pay" && seg[2]) {
      const row = getPayment(decodeURIComponent(seg[2]));
      if (!row) return json(res, 404, { error: "payment_not_found" });
      return json(res, 200, row);
    }

    if (method === "GET" && url.pathname === "/api/admin/payments") {
      const limit = Number(url.searchParams.get("limit") || 20);
      return json(res, 200, listPayments({ limit, userEmail: url.searchParams.get("user") || undefined }));
    }

    if (method === "GET" && url.pathname === "/api/admin/reconcile") {
      return json(res, 200, reconcile({ date: url.searchParams.get("date") || undefined }));
    }

    /* ---------------- 收款码签名 ---------------- */
    if (method === "POST" && url.pathname === "/api/qr/sign") {
      const body = await readBody(req);
      const merchant = body.merchantId
        ? db.prepare('SELECT * FROM "MerchantStore" WHERE id = ?').get(body.merchantId)
        : db.prepare('SELECT * FROM "MerchantStore" WHERE qr_code = ?').get(body.qrCode);
      if (!merchant) return json(res, 404, { error: "merchant_not_found" });
      const signed = signMerchantPayload(merchant, { ttlMs: body.ttlMs });
      return json(res, 200, { ...signed, merchant: { id: merchant.id, name: merchant.store_name, qr_code: merchant.qr_code } });
    }

    if (method === "POST" && url.pathname === "/api/qr/verify") {
      const body = await readBody(req);
      const result = verifyMerchantPayload(body.token);
      if (!result.valid) return json(res, 400, result);
      const merchant = db.prepare('SELECT * FROM "MerchantStore" WHERE id = ?').get(result.payload.mid);
      return json(res, 200, {
        ...result,
        merchant: merchant
          ? {
              id: merchant.id,
              name: merchant.store_name,
              category: merchant.category,
              qr_code: merchant.qr_code,
              tip_ratio: merchant.tip_ratio,
              is_verified: !!merchant.is_verified,
            }
          : null,
      });
    }

    /* ---------------------------- KMS / HSM ---------------------------- */
    if (method === "GET" && url.pathname === "/api/kms/health") {
      return json(res, 200, kms.health());
    }

    if (method === "GET" && url.pathname === "/api/kms/keys") {
      requireRole(req, ["admin", "owner"]);
      return json(res, 200, {
        keys: kms.listKeys({ alias: url.searchParams.get("alias") || undefined }),
        provider: kms.health().provider,
        activeAlgorithm: kms.health().activeAlgorithm,
      });
    }

    if (method === "POST" && url.pathname === "/api/kms/rotate") {
      const user = requireRole(req, ["admin", "owner"]);
      const body = await readBody(req).catch(() => ({}));
      const res2 = kms.rotateKey(body.alias || "nms-chain-tx", user.email);
      audit({ actor: user.email, action: "kms.rotate", target: "kms", payload: res2 });
      return json(res, 200, res2);
    }

    if (method === "POST" && url.pathname === "/api/kms/sign") {
      const user = requireAuth(req);
      const body = await readBody(req);
      if (body.payload === undefined) return json(res, 400, { error: "payload_required" });
      const signed = await kms.sign(body.payload, {
        context: body.context || "api",
        actor: user.email,
      });
      return json(res, 200, signed);
    }

    if (method === "POST" && url.pathname === "/api/kms/verify") {
      const body = await readBody(req);
      const result = await kms.verify({
        payload: body.payload,
        signature: body.signature,
        keyId: body.keyId,
        alias: body.alias,
      });
      return json(res, result.valid ? 200 : 400, result);
    }

    if (method === "GET" && url.pathname === "/api/kms/audit") {
      requireRole(req, ["admin", "owner"]);
      return json(res, 200, {
        stats: kms.stats(),
        items: kms.auditTrail({
          limit: Number(url.searchParams.get("limit") || 20),
          op: url.searchParams.get("op") || undefined,
        }),
      });
    }

    if (method === "POST" && url.pathname === "/api/chain/checkpoint") {
      const user = requireRole(req, ["admin", "owner"]);
      const cp = await kms.checkpoint({ actor: user.email });
      audit({ actor: user.email, action: "chain.checkpoint", target: "chain", payload: { height: cp.height, root: cp.rootHash } });
      return json(res, 201, cp);
    }

    if (method === "GET" && url.pathname === "/api/chain/checkpoints") {
      return json(res, 200, {
        items: kms.listCheckpoints({ limit: Number(url.searchParams.get("limit") || 10) }),
        latest: kms.listCheckpoints({ limit: 1 })[0] || null,
      });
    }

    if (method === "POST" && url.pathname === "/api/chain/checkpoint/verify") {
      const body = await readBody(req).catch(() => ({}));
      return json(res, 200, await kms.verifyCheckpoint(body.id || "latest"));
    }

    /* 逐笔校验链上交易签名（真实验签，不只是哈希串联） */
    if (method === "GET" && url.pathname === "/api/chain/verify") {
      const limit = Math.min(Number(url.searchParams.get("limit") || 50), 200);
      const rows = db
        .prepare('SELECT * FROM "Transaction" WHERE quantum_signature IS NOT NULL AND quantum_signature != \'\' ORDER BY created_date DESC LIMIT ?')
        .all(limit);

      const results = [];
      let okCount = 0;
      let failCount = 0;
      let unsigned = 0;

      for (const tx of rows) {
        if (!tx.signature_algorithm || !tx.signing_key_id) {
          unsigned += 1;
          results.push({ txHash: tx.tx_hash, valid: null, reason: "legacy_unsigned" });
          continue;
        }
        const v = await kms.verify({
          payload: txPayload(tx),
          signature: tx.quantum_signature,
          keyId: tx.signing_key_id,
        });
        v.valid ? (okCount += 1) : (failCount += 1);
        results.push({
          txHash: tx.tx_hash,
          valid: v.valid,
          reason: v.reason || null,
          algorithm: v.algorithm,
          keyVersion: v.keyVersion,
        });
      }

      return json(res, 200, {
        checked: rows.length,
        valid: okCount,
        invalid: failCount,
        legacyUnsigned: unsigned,
        ok: failCount === 0,
        chain: verifyChain(),
        details: results.slice(0, 20),
      });
    }

    return json(res, 404, { error: "not_found", path: url.pathname });
  } catch (e) {
    const status = e.status || 500;
    if (status >= 500) console.error("[api]", e);
    return json(res, status, {
      error: e.code || e.message || "internal_error",
      detail: e.detail || undefined,
      message: e.message,
    });
  } finally {
    if (process.env.LOG !== "off") {
      console.log(`${method} ${url.pathname} ${res.statusCode} ${Date.now() - started}ms`);
    }
  }
});

/* --------------------------- 优雅关闭 --------------------------- */
let closing = false;
const shutdown = (signal) => {
  if (closing) return;
  closing = true;
  console.log(`\n[shutdown] 收到 ${signal}，停止接收新请求…`);
  server.close(() => {
    try {
      db.close();
    } catch (e) {
      /* 已关闭 */
    }
    console.log("[shutdown] 数据库已关闭，进程退出");
    process.exit(0);
  });
  setTimeout(() => {
    console.warn("[shutdown] 超时强制退出");
    process.exit(1);
  }, 8000).unref();
};
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("unhandledRejection", (err) => {
  console.error("[unhandledRejection]", err);
});

/* KMS 初始化必须在监听前完成：云托管根密钥需要异步解密 */
const KMS_BOOT = await kms.init();
const KMS_HEALTH = kms.health();

const KEYSTORE_LABEL = {
  env: "环境变量 NMS_KMS_MASTER_KEY",
  file: "本地主密钥文件（生产请改用 NMS_KMS_MASTER_KEY 或阿里云 KMS）",
  "aliyun-kms": "阿里云 KMS（云托管根密钥）",
};

server.listen(PORT, HOST, () => {
  const info = dbInfo();
  console.log(`\n  NMS MetaLife API  →  http://${HOST}:${PORT}`);
  console.log(`  数据库            →  ${SERVER_BOOT.dbFile}`);
  console.log(`  实体              →  ${info.entities} 个 ${SERVER_BOOT.seeded ? "(已导入演示数据)" : ""}`);
  console.log(`  实体行数          →  ${Object.entries(info.counts).map(([k, v]) => `${k}:${v}`).join(" ")}`);
  console.log(`  退款风控          →  ≤${REFUND_RULES.autoApproveLimit} 自动通过 / ≤${REFUND_RULES.merchantLimit} 需确认 / 以上需管理员`);
  console.log(`  KMS / HSM         →  ${KMS_BOOT.provider.toUpperCase()} · key v${KMS_BOOT.version} · ${KMS_BOOT.fingerprint}`);
  console.log(`  后量子可用        →  ${KMS_HEALTH.pqcAlgorithms.length ? KMS_HEALTH.pqcAlgorithms.join(", ") : "无（降级 Ed25519）"}`);
  console.log(`  密钥托管          →  ${KEYSTORE_LABEL[KMS_HEALTH.keystore] || KMS_HEALTH.keystore}`);
  if (KMS_HEALTH.aliyun?.configured) {
    console.log(`  阿里云 KMS        →  ${KMS_HEALTH.aliyun.region} · 云根密钥 ${KMS_HEALTH.aliyun.cloudKek ? "已启用" : "未启用"} · 云签名 ${KMS_HEALTH.aliyun.cloudSigner ? "已启用" : "未启用"}`);
  }
  startScheduler();
  console.log("");
});
