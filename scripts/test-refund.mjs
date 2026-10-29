/**
 * 退款审批 + 对账任务 测试
 * 用法：node scripts/test-refund.mjs [http://127.0.0.1:8787]
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
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
};

const merchants = (await api("/api/entities/MerchantStore/list", { method: "POST", body: { limit: 5 } })).data;
const merchant = merchants.find((m) => m.is_verified) || merchants[0];
const stamp = Date.now().toString(36);

const makePayment = async (amount, tag) => {
  const r = await api("/api/pay", {
    method: "POST",
    body: {
      merchantId: merchant.id,
      amount,
      method: "nms",
      orderNo: `NMS${tag}${stamp}`.slice(0, 14),
      idempotencyKey: `pay_${tag}_${stamp}`,
    },
  });
  return r.data;
};

console.log("\n=== 退款审批 + 对账任务 ===\n");

console.log("1) 小额（≤500）自动通过");
const p1 = await makePayment(200, "a");
const r1 = await api("/api/pay/refund/request", { method: "POST", body: { paymentId: p1.paymentId, reason: "商品质量问题" } });
ok("申请提交成功", r1.status === 200 && r1.data.ok);
ok("自动通过（auto_approved）", r1.data.autoApproved === true && r1.data.request?.status === "auto_approved", `风险 ${r1.data.request?.risk_level}`);
ok("支付单已退款", r1.data.result?.refunded === true);

console.log("\n2) 中额（500-5000）进入审批");
const p2 = await makePayment(2000, "b");
const r2 = await api("/api/pay/refund/request", { method: "POST", body: { paymentId: p2.paymentId, reason: "重复下单" } });
ok("进入待审批", r2.data.pending === true && r2.data.request?.status === "pending", `风险 ${r2.data.request?.risk_level}`);

const dup = await api("/api/pay/refund/request", { method: "POST", body: { paymentId: p2.paymentId, reason: "重复提交" } });
ok("重复申请被去重", dup.data.duplicate === true);

const approve = await api(`/api/admin/refunds/${r2.data.request.id}/approve`, { method: "POST", body: { note: "客服确认" } });
ok("审批通过并退款", approve.status === 200 && approve.data.approved === true && approve.data.result?.refunded === true);

const approveAgain = await api(`/api/admin/refunds/${r2.data.request.id}/approve`, { method: "POST", body: {} });
ok("重复审批幂等", approveAgain.data.idempotent === true, approveAgain.data.status);

console.log("\n3) 大额（>5000）高风险审批");
const p3 = await makePayment(6000, "c");
const r3 = await api("/api/pay/refund/request", { method: "POST", body: { paymentId: p3.paymentId, reason: "大额纠纷" } });
ok("标记高风险", r3.data.request?.risk_level === "high" && r3.data.request?.status === "pending");

const reject = await api(`/api/admin/refunds/${r3.data.request.id}/reject`, { method: "POST", body: { note: "证据不足" } });
ok("驳回成功", reject.data.rejected === true && reject.data.request?.status === "rejected");

const payCheck = await api(`/api/pay/${p3.paymentId}`);
ok("驳回后支付单仍为 settled", payCheck.data?.status === "settled", payCheck.data?.status);

console.log("\n4) 退款列表");
const list = await api("/api/admin/refunds?limit=10");
ok("列表可查", list.status === 200 && Array.isArray(list.data.items), `${list.data.items?.length} 条`);
ok("风控阈值随接口返回", list.data.rules?.autoApproveLimit === 500, JSON.stringify(list.data.rules));

console.log("\n5) 对账任务");
const run = await api("/api/admin/reconcile/run", { method: "POST", body: {} });
ok("手动对账落库", run.status === 200 && run.data.id?.startsWith("rc_"), `runId ${run.data.id}`);

const runs = await api("/api/admin/reconcile/runs?limit=5");
ok("历史可查", Array.isArray(runs.data.runs) && runs.data.runs.length > 0, `${runs.data.runs?.length} 条`);
ok("定时任务已排程", !!runs.data.scheduler?.nextRunAt, `下次 ${runs.data.scheduler?.nextRunAt}`);
ok("每日 00:00 执行", runs.data.scheduler?.hour === 0, `hour=${runs.data.scheduler?.hour}`);

console.log("\n6) 告警");
const alerts = await api("/api/admin/alerts?limit=5");
ok("告警接口可用", alerts.status === 200 && Array.isArray(alerts.data), `${alerts.data.length} 条`);
const badAlerts = (alerts.data || []).filter((a) => a.level === "error" && a.source === "reconcile");
ok("对账平衡时无 error 告警", badAlerts.length === 0, `error 告警 ${badAlerts.length} 条`);

console.log(`\n=== 结果：${pass} 通过 / ${fail} 失败 ===\n`);
process.exit(fail === 0 ? 0 : 1);
