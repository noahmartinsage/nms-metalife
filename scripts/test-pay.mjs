/**
 * 支付通道端到端测试
 * 用法：node scripts/test-pay.mjs [http://127.0.0.1:8787]
 */
const BASE = process.argv[2] || "http://127.0.0.1:8787";
let pass = 0;
let fail = 0;

const ok = (name, cond, detail = "") => {
  if (cond) {
    pass += 1;
    console.log(`  ✅ ${name}${detail ? " — " + detail : ""}`);
  } else {
    fail += 1;
    console.log(`  ❌ ${name}${detail ? " — " + detail : ""}`);
  }
};

const api = async (path, { method = "GET", body, token = "nms-demo-token" } = {}) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    data = text;
  }
  return { status: res.status, data };
};

const getBalance = async () => {
  const { data } = await api("/api/entities/UserBalance/filter", {
    method: "POST",
    body: { query: { user_email: "demo@nms.ai" }, limit: 1 },
  });
  return data[0];
};

console.log("\n=== NMS 支付通道 E2E ===\n");
console.log("1) 健康检查");
const health = await api("/api/health");
ok("服务在线", health.status === 200 && health.data.ok);
ok("支付通道路由已注册", !!health.data.channel?.pay, health.data.channel?.pay);

console.log("\n2) 收款码签名 / 验签");
const merchants = (await api("/api/entities/MerchantStore/list", { method: "POST", body: { limit: 5 } })).data;
const merchant = merchants.find((m) => m.is_verified) || merchants[0];
const signed = await api("/api/qr/sign", { method: "POST", body: { merchantId: merchant.id, ttlMs: 3600000 } });
ok("签名成功", signed.status === 200 && signed.data.token?.startsWith("NMS1."), signed.data.token?.slice(0, 24) + "…");

const verified = await api("/api/qr/verify", { method: "POST", body: { token: signed.data.token } });
ok("验签通过", verified.status === 200 && verified.data.valid === true);
ok("返回商家信息", verified.data.merchant?.id === merchant.id, verified.data.merchant?.name);

const tampered = signed.data.token.slice(0, -4) + "AAAA";
const bad = await api("/api/qr/verify", { method: "POST", body: { token: tampered } });
ok("篡改签名被拒绝", bad.status === 400 && bad.data.valid === false, bad.data.reason);

console.log("\n3) 原子扣款 + 幂等");
const before = await getBalance();
const idem = `test_${Date.now()}`;
const pay1 = await api("/api/pay", {
  method: "POST",
  body: { merchantId: merchant.id, amount: 100, method: "nms", tipRatio: 10, idempotencyKey: idem },
});
ok("首次支付成功", pay1.status === 201 && pay1.data.ok, `订单 ${pay1.data.orderNo}`);

const pay2 = await api("/api/pay", {
  method: "POST",
  body: { merchantId: merchant.id, amount: 100, method: "nms", tipRatio: 10, idempotencyKey: idem },
});
ok("重复幂等键不重复扣款", pay2.status === 200 && pay2.data.idempotent === true, `同一 paymentId ${pay2.data.paymentId === pay1.data.paymentId}`);

const after = await getBalance();
// NMS 支付：-100 本金 +100 返利 = 余额不变；锁定应回到原值
ok(
  "余额守恒（-100 本金 +100 返利）",
  Math.abs((after.available_nms ?? 0) - (before.available_nms ?? 0)) < 0.01,
  `${before.available_nms} → ${after.available_nms}`
);
ok("冻结资金已释放", Math.abs((after.locked_nms ?? 0) - (before.locked_nms ?? 0)) < 0.01, `locked ${after.locked_nms}`);
ok("消费额累加 100", Math.abs((after.total_consumption ?? 0) - (before.total_consumption ?? 0) - 100) < 0.01);

console.log("\n4) 分账口径（¥100 · 打赏 10%）");
const s = pay1.data.split;
ok("消费者 1:1 = 100", s.userReward === 100, String(s.userReward));
ok("商家成本 = 10", s.merchantConsumed === 10, String(s.merchantConsumed));
ok("商家双倍返还 = 20", s.merchantReturn === 20, String(s.merchantReturn));
ok("VIP 推荐 = 20", s.vipReward === 20, String(s.vipReward));
ok("级差 72.9", s.levelDiffReward === 72.9, String(s.levelDiffReward));
ok("杰出贡献 7.1", s.contributorReward === 7.1, String(s.contributorReward));

console.log("\n5) 余额不足拦截");
const tooMuch = await api("/api/pay", {
  method: "POST",
  body: { merchantId: merchant.id, amount: 99999999, method: "nms", idempotencyKey: `big_${Date.now()}` },
});
ok("超额度被拒绝 402", tooMuch.status === 402 && tooMuch.data.error === "insufficient_nms", tooMuch.data.error);

console.log("\n6) 退款（幂等）");
const refund1 = await api("/api/pay/refund", { method: "POST", body: { paymentId: pay1.data.paymentId } });
ok("退款成功", refund1.status === 200 && refund1.data.refunded === true);
const refund2 = await api("/api/pay/refund", { method: "POST", body: { paymentId: pay1.data.paymentId } });
ok("重复退款幂等", refund2.status === 200 && refund2.data.idempotent === true);
const afterRefund = await getBalance();
ok("退款后消费额回滚", Math.abs((afterRefund.total_consumption ?? 0) - (before.total_consumption ?? 0)) < 0.01);

console.log("\n7) 对账 + 链式存证");
const rec = await api("/api/admin/reconcile");
ok("对账接口可用", rec.status === 200, `订单 ${rec.data.orders?.count} 笔 / 交易 ${rec.data.transactions?.count} 笔 / 通道 ${rec.data.channel?.count} 笔`);
ok("通道与订单逐笔对齐", Math.abs(rec.data.channelDiff ?? 1) < 0.01, `channelDiff=${rec.data.channelDiff}`);
ok("差额已计算", typeof rec.data.diff === "number", `diff=${rec.data.diff}`);
const chain = await api("/api/chain/verify");
ok("账本哈希链完整", chain.status === 200 && chain.data.ok === true, `长度 ${chain.data.length}，head ${String(chain.data.head).slice(0, 12)}…`);

console.log(`\n=== 结果：${pass} 通过 / ${fail} 失败 ===\n`);
process.exit(fail === 0 ? 0 : 1);
