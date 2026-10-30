/**
 * 鉴权与 RBAC 验证
 * 用法：node scripts/test-auth.mjs [strictBase]
 * 需要同时运行：
 *   - 宽松模式实例（默认 8787）
 *   - 严格模式实例（默认 8788，NMS_AUTH_STRICT=1）
 */
import { DatabaseSync } from "node:sqlite";
import path from "node:path";

const SOFT = (process.argv[2] || "http://127.0.0.1:8787").replace(/\/api$/, "") + "/api";
const STRICT = (process.argv[3] || "http://127.0.0.1:8788").replace(/\/api$/, "") + "/api";

let pass = 0;
let fail = 0;
const ok = (n, c, d = "") => {
  c ? (pass++, console.log(`  ✅ ${n}${d ? " — " + d : ""}`)) : (fail++, console.log(`  ❌ ${n}${d ? " — " + d : ""}`));
};

const api = async (base, p, { method = "GET", body, token } = {}) => {
  const headers = { "content-type": "application/json" };
  if (token) headers.authorization = `Bearer ${token}`;
  const res = await fetch(base + p, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: res.status, data };
};

const db = new DatabaseSync(path.resolve("server/data/nms.db"));
const latestCode = (email) =>
  db.prepare("SELECT code FROM auth_codes WHERE email = ? ORDER BY created_date DESC LIMIT 1").get(email)?.code;

console.log("\n=== 鉴权与 RBAC 验证 ===\n");

/* ---------------- 1. 宽松模式：开发自测不受阻 ---------------- */
console.log("1) 宽松模式（NMS_AUTH_STRICT 未开）");
const softSession = await api(SOFT, "/auth/session", { method: "POST", body: {} });
ok("无令牌可识别为演示身份", softSession.data.authenticated === true, softSession.data.user?.role);
ok("演示身份为 admin", softSession.data.user?.role === "admin");
const softAdmin = await api(SOFT, "/admin/audit?limit=1");
ok("演示身份可访问管理接口", softAdmin.status === 200);

/* ---------------- 2. 严格模式：未登录一律拒绝 ---------------- */
console.log("\n2) 严格模式（NMS_AUTH_STRICT=1）");
const strictHealth = await api(STRICT, "/health");
ok("health 声明 strict=true", strictHealth.data.auth?.strict === true);

const noTokenAdmin = await api(STRICT, "/admin/audit");
ok("管理接口无令牌 → 401", noTokenAdmin.status === 401 && noTokenAdmin.data.error === "unauthorized");
const noTokenPay = await api(STRICT, "/pay", { method: "POST", body: { merchantId: "store_1", amount: 10 } });
ok("支付接口无令牌 → 401", noTokenPay.status === 401);
const noTokenWrite = await api(STRICT, "/entities/ChatMessage", { method: "POST", body: { content: "x" } });
ok("实体写入无令牌 → 401", noTokenWrite.status === 401);

const readList = await api(STRICT, "/entities/MerchantStore/list", { method: "POST", body: { limit: 1 } });
ok("实体读 list 无需令牌 → 200", readList.status === 200, `${readList.data?.length ?? 0} 条`);
const readFilter = await api(STRICT, "/entities/UserBalance/filter", {
  method: "POST",
  body: { query: { user_email: "demo@nms.ai" }, limit: 1 },
});
ok("实体读 filter 无需令牌 → 200", readFilter.status === 200);

const legacyToken = await api(STRICT, "/admin/audit", { token: "nms-demo-token" });
ok("严格模式拒绝明文种子令牌（后门）", legacyToken.status === 401, `status=${legacyToken.status}`);

/* ---------------- 3. OTP 登录 ---------------- */
console.log("\n3) OTP 登录流程");
const email = `rbac${Date.now().toString(36)}@nms.test`;
const otp = await api(STRICT, "/auth/otp", { method: "POST", body: { email } });
ok("验证码已发送", otp.data.sent === true);
ok("严格模式不回显验证码", otp.data.devCode === undefined);

const wrong = await api(STRICT, "/auth/login", { method: "POST", body: { email, code: "000000" } });
ok("错误验证码 → 401", wrong.status === 401 && wrong.data.error === "otp_invalid");

const realCode = latestCode(email);
const login = await api(STRICT, "/auth/login", { method: "POST", body: { email, code: realCode } });
ok("正确验证码 → 签发令牌", login.status === 200 && !!login.data.token, `role=${login.data.user?.role}`);
ok("新用户默认角色 user", login.data.user?.role === "user");

const reuse = await api(STRICT, "/auth/login", { method: "POST", body: { email, code: realCode } });
ok("验证码用后即焚", reuse.status === 401);

/* ---------------- 4. RBAC：user 不得进管理端 ---------------- */
console.log("\n4) RBAC 越权拦截");
const userToken = login.data.token;
const userAdmin = await api(STRICT, "/admin/audit", { token: userToken });
ok("user 角色访问管理接口 → 403", userAdmin.status === 403 && userAdmin.data.error === "forbidden");

const userPay = await api(STRICT, "/pay", {
  method: "POST",
  token: userToken,
  body: { merchantId: "store_1", amount: 1, orderNo: `NMSRB${Date.now().toString().slice(-8)}`, idempotencyKey: `pay_rbac_${Date.now()}` },
});
ok("user 角色可发起支付（余额不足或成功均非 401/403）", ![401, 403].includes(userPay.status), `status=${userPay.status}`);

const userWrite = await api(STRICT, "/entities/ChatMessage", {
  method: "POST",
  token: userToken,
  body: { region_code: "did:rbac", sender_email: email, content: "hi", message_type: "text" },
});
ok("user 角色可写业务实体", userWrite.status === 201 || userWrite.status === 200);

/* ---------------- 5. 管理员令牌可进管理端 ---------------- */
console.log("\n5) 管理员身份");
const adminLogin = await api(STRICT, "/auth/otp", { method: "POST", body: { email: "demo@nms.ai" } });
const adminCode = latestCode("demo@nms.ai");
const adminAuth = await api(STRICT, "/auth/login", { method: "POST", body: { email: "demo@nms.ai", code: adminCode } });
ok("管理员登录成功", adminAuth.status === 200, `role=${adminAuth.data.user?.role}`);
const adminToken = adminAuth.data.token;
const adminOk = await api(STRICT, "/admin/audit?limit=1", { token: adminToken });
ok("admin 令牌访问管理接口 → 200", adminOk.status === 200);

/* ---------------- 6. 令牌吊销 ---------------- */
console.log("\n6) 登出与吊销");
const beforeLogout = await api(STRICT, "/admin/audit", { token: adminToken });
ok("登出前可用", beforeLogout.status === 200);
const out = await api(STRICT, "/auth/logout", { method: "POST", token: adminToken });
ok("登出成功", out.data.revoked === true);
const afterLogout = await api(STRICT, "/admin/audit", { token: adminToken });
ok("登出后令牌失效 → 401", afterLogout.status === 401);

/* ---------------- 7. 令牌篡改 ---------------- */
console.log("\n7) 令牌完整性");
const tampered = adminToken.slice(0, -4) + "AAAA";
const badToken = await api(STRICT, "/admin/audit", { token: tampered });
ok("篡改签名 → 401", badToken.status === 401);
const fakeRole = await api(STRICT, "/admin/audit", {
  token: userToken.split(".").slice(0, 2).join(".") + ".deadbeefdeadbeefdeadbeefdeadbeef",
});
ok("伪造签名 → 401", fakeRole.status === 401);

console.log(`\n=== 结果：${pass} 通过 / ${fail} 失败 ===\n`);
process.exit(fail === 0 ? 0 : 1);
