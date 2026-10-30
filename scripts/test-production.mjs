const BASE = process.argv[2] || "http://127.0.0.1:8787";
let pass = 0, fail = 0;
const ok = (n, c, d = "") => { c ? (pass++, console.log(`  ✅ ${n}${d ? " — " + d : ""}`)) : (fail++, console.log(`  ❌ ${n}${d ? " — " + d : ""}`)); };
const api = async (p, { method = "GET", body, token = "nms-demo-token" } = {}) => {
  const res = await fetch(BASE + p, { method, headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await res.text(); let data; try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data, headers: res.headers };
};

console.log("\n=== 生产级加固验证 ===\n");
console.log("1) 安全响应头");
const h = await api("/api/health");
ok("x-content-type-options", h.headers.get("x-content-type-options") === "nosniff");
ok("x-frame-options", h.headers.get("x-frame-options") === "SAMEORIGIN");
ok("referrer-policy", h.headers.get("referrer-policy") === "no-referrer");
ok("uptime 上报", typeof h.data.uptime === "number", `uptime=${h.data.uptime}s`);
ok("审计统计", !!h.data.audit, JSON.stringify(h.data.audit));

console.log("\n2) 大额退款双人复核（4-eyes）");
// 测试夹具：确保余额足够跑大额用例
const balRows = (await api("/api/entities/UserBalance/filter", { method: "POST", body: { query: { user_email: "demo@nms.ai" }, limit: 1 } })).data;
const bal = balRows[0];
if (bal && bal.available_nms < 20000) {
  await api(`/api/entities/UserBalance/${bal.id}`, { method: "PATCH", body: { available_nms: 50000 } });
}
const m = (await api("/api/entities/MerchantStore/list", { method: "POST", body: { limit: 5 } })).data.find((x) => x.is_verified);
const stamp = Date.now().toString(36);
const pay = await api("/api/pay", { method: "POST", body: { merchantId: m.id, amount: 6000, method: "nms", orderNo: `NMS4E${stamp}`.slice(0, 14), idempotencyKey: `pay_4e_${stamp}` } });
ok("大额支付成功", pay.status === 201, pay.data.orderNo);
const req = await api("/api/pay/refund/request", { method: "POST", body: { paymentId: pay.data.paymentId, reason: "大额纠纷需复核" } });
ok("申请进入待审", req.data.request?.status === "pending" && req.data.request?.risk_level === "high", `required=${req.data.request?.required_approvals ?? "?"}`);

const a1 = await api(`/api/admin/refunds/${req.data.request.id}/approve`, { method: "POST", body: { approver: "admin", note: "一审通过" } });
ok("第一人审批 → 待第二人", a1.data.partial === true && a1.data.approvals === 1 && a1.data.request?.status === "pending_second", `${a1.data.approvals}/${a1.data.required}`);

const dup = await api(`/api/admin/refunds/${req.data.request.id}/approve`, { method: "POST", body: { approver: "admin" } });
ok("同一人重复签被拒 409", dup.status === 409 && dup.data.error === "duplicate_approver");

const a2 = await api(`/api/admin/refunds/${req.data.request.id}/approve`, { method: "POST", body: { approver: "owner", note: "二审通过" } });
ok("第二人审批 → 通过并退款", a2.data.approved === true && a2.data.result?.refunded === true, `${a2.data.approvals}/${a2.data.required}`);

console.log("\n3) 对账差异自动补偿");
const pay2 = await api("/api/pay", { method: "POST", body: { merchantId: m.id, amount: 320, method: "nms", orderNo: `NMSCP${stamp}`.slice(0, 14), idempotencyKey: `pay_cp_${stamp}` } });
ok("造一笔通道支付", pay2.status === 201, pay2.data.orderNo);
await api(`/api/entities/PaymentOrder/${pay2.data.orderId}`, { method: "DELETE" });
const rec1 = await api("/api/admin/reconcile");
ok("删除订单后出现孤立通道单", rec1.data.orphanPayments?.length > 0, `orphan=${rec1.data.orphanPayments?.length}`);
const comp = await api("/api/admin/reconcile/compensate", { method: "POST", body: {} });
ok("补偿执行", comp.status === 200 && comp.data.compensated >= 1, `修复 ${comp.data.compensated} 项`);
ok("补偿后通道对齐", Math.abs(comp.data.after?.channelDiff ?? 1) < 0.01, `channelDiff=${comp.data.after?.channelDiff}`);

console.log("\n4) 审计日志");
const auditRes = await api("/api/admin/audit?limit=10");
ok("审计可查", auditRes.status === 200 && Array.isArray(auditRes.data.items), `${auditRes.data.items?.length} 条`);
const actions = (auditRes.data.items || []).map((i) => i.action);
ok("记录支付", actions.includes("pay.settled"));
ok("记录退款执行", actions.includes("refund.executed"));
ok("记录部分审批", actions.includes("refund.approve.partial"));
ok("记录补偿", actions.includes("reconcile.compensate"));

console.log(`\n=== 结果：${pass} 通过 / ${fail} 失败 ===\n`);
process.exit(fail === 0 ? 0 : 1);
