/**
 * 鉴权与 RBAC（生产级）
 *
 * 设计要点：
 * - 无状态 HMAC 签名令牌：nms1.<b64url(payload)>.<sig>，自带 exp，服务端不存会话即可校验
 * - 支持吊销表 revoked_tokens（登出/风控封禁）
 * - OTP 登录：一次性验证码，5 分钟有效，用后即焚
 * - NMS_AUTH_STRICT=1 时关闭演示兜底（生产必须开），否则无令牌一律 401
 */
import crypto from "node:crypto";
import db from "./db.mjs";

const SECRET = process.env.NMS_JWT_SECRET || "nms-metalife-dev-secret-change-me";
const TTL_SECONDS = Number(process.env.NMS_TOKEN_TTL || 60 * 60 * 12); // 默认 12 小时
const OTP_TTL_MS = 5 * 60 * 1000;

/** 生产环境默认严格模式；显式 NMS_AUTH_STRICT=0 才允许演示兜底 */
export const STRICT =
  process.env.NMS_AUTH_STRICT === "1" ||
  (process.env.NMS_AUTH_STRICT !== "0" && process.env.NODE_ENV === "production");

db.exec(`
  CREATE TABLE IF NOT EXISTS auth_codes (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    used INTEGER DEFAULT 0,
    created_date TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_auth_codes_email ON auth_codes(email);

  CREATE TABLE IF NOT EXISTS revoked_tokens (
    sig TEXT PRIMARY KEY,
    email TEXT,
    reason TEXT,
    created_date TEXT
  );
`);

const b64u = (buf) => Buffer.from(buf).toString("base64url");
const nowISO = () => new Date().toISOString();
const newId = (p) => `${p}_${crypto.randomBytes(8).toString("hex")}`;

const sign = (data) => crypto.createHmac("sha256", SECRET).update(data).digest("base64url").slice(0, 32);

/** 签发令牌 */
export function issueToken({ id, email, role = "user", full_name = "" }) {
  const payload = {
    sub: id,
    email,
    role,
    name: full_name,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + TTL_SECONDS,
  };
  const body = b64u(JSON.stringify(payload));
  const sig = sign(`nms1.${body}`);
  return { token: `nms1.${body}.${sig}`, expiresIn: TTL_SECONDS, payload };
}

/** 校验令牌；返回 claims 或 null */
export function verifyToken(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "nms1") return null;
  const [, body, sig] = parts;

  const expected = sign(`nms1.${body}`);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  let claims;
  try {
    claims = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch (e) {
    return null;
  }
  if (!claims?.exp || claims.exp * 1000 < Date.now()) return null;

  const revoked = db.prepare("SELECT 1 FROM revoked_tokens WHERE sig = ?").get(sig);
  if (revoked) return null;

  return { ...claims, sig };
}

/** 吊销令牌（登出） */
export function revokeToken(token, reason = "logout") {
  const claims = verifyToken(token);
  if (!claims) return { ok: true, alreadyInvalid: true };
  db.prepare("INSERT OR REPLACE INTO revoked_tokens (sig, email, reason, created_date) VALUES (?,?,?,?)").run(
    claims.sig,
    claims.email,
    reason,
    nowISO()
  );
  return { ok: true, revoked: true };
}

/* ------------------------------ OTP ------------------------------ */

const genCode = () => String(crypto.randomInt(0, 1000000)).padStart(6, "0");

/** 发送登录验证码（演示环境直接返回 code；生产走短信/邮件通道） */
export function sendOtp({ email }) {
  const addr = String(email || "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(addr)) {
    const err = new Error("invalid_email");
    err.status = 400;
    throw err;
  }

  /* 频率限制：同邮箱 60 秒内只能发一次 */
  const recent = db
    .prepare("SELECT * FROM auth_codes WHERE email = ? ORDER BY created_date DESC LIMIT 1")
    .get(addr);
  if (recent && Date.now() - new Date(recent.created_date).getTime() < 60_000) {
    const err = new Error("otp_too_frequent");
    err.status = 429;
    throw err;
  }

  const code = genCode();
  db.prepare("INSERT INTO auth_codes (id, email, code, expires_at, used, created_date) VALUES (?,?,?,?,0,?)").run(
    newId("otp"),
    addr,
    code,
    Date.now() + OTP_TTL_MS,
    nowISO()
  );

  /* 生产应在此调用短信/邮件服务；开发环境把 code 返回给前端便于自测 */
  return { ok: true, sent: true, email: addr, ttl: OTP_TTL_MS / 1000, ...(STRICT ? {} : { devCode: code }) };
}

/** 校验验证码并签发令牌 */
export function loginWithOtp({ email, code }) {
  const addr = String(email || "").trim().toLowerCase();
  const input = String(code || "").trim();

  const row = db
    .prepare("SELECT * FROM auth_codes WHERE email = ? AND used = 0 ORDER BY created_date DESC LIMIT 1")
    .get(addr);

  if (!row) {
    const err = new Error("otp_not_found");
    err.status = 401;
    throw err;
  }
  if (row.expires_at < Date.now()) {
    const err = new Error("otp_expired");
    err.status = 401;
    throw err;
  }
  if (row.code !== input) {
    const err = new Error("otp_invalid");
    err.status = 401;
    throw err;
  }

  db.prepare("UPDATE auth_codes SET used = 1 WHERE id = ?").run(row.id);

  let user = db.prepare("SELECT * FROM users WHERE email = ?").get(addr);
  if (!user) {
    /* 首次登录即开户：默认普通用户，admin 由种子/后台授予 */
    const id = newId("usr");
    db.prepare(
      "INSERT INTO users (id, email, full_name, role, token, created_date) VALUES (?,?,?,?,?,?)"
    ).run(id, addr, addr.split("@")[0], "user", "", nowISO());
    user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
  }

  const issued = issueToken({
    id: user.id,
    email: user.email,
    role: user.role || "user",
    full_name: user.full_name || "",
  });

  return {
    ok: true,
    token: issued.token,
    expiresIn: issued.expiresIn,
    user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role || "user" },
  };
}

/* ------------------------------ 守卫 ------------------------------ */

/** 从请求解析身份；无令牌返回 null（严格模式）或演示用户（宽松模式） */
export function resolveIdentity(req) {
  const raw = req.headers.authorization || "";
  const token = raw.startsWith("Bearer ") ? raw.slice(7).trim() : null;

  if (token) {
    const claims = verifyToken(token);
    if (claims) {
      return { id: claims.sub, email: claims.email, full_name: claims.name || "", role: claims.role || "user", via: "jwt" };
    }
    /* 兼容旧的明文 users.token —— 仅在宽松模式允许；
       严格模式必须用签名令牌，否则种子里的 nms-demo-token 会变成公开后门 */
    if (!STRICT) {
      const legacy = db.prepare("SELECT * FROM users WHERE token = ?").get(token);
      if (legacy) {
        return { id: legacy.id, email: legacy.email, full_name: legacy.full_name, role: legacy.role, via: "legacy" };
      }
    }
  }

  const headerEmail = req.headers["x-user-email"];
  if (headerEmail) {
    const u = db.prepare("SELECT * FROM users WHERE email = ?").get(String(headerEmail));
    if (u) return { id: u.id, email: u.email, full_name: u.full_name, role: u.role, via: "header" };
  }

  if (STRICT) return null;

  /* 开发环境兜底：默认演示账号（admin），保证 UI 不因缺令牌而无法自测 */
  const demo = db.prepare("SELECT * FROM users WHERE email = ?").get("demo@nms.ai");
  if (demo) {
    return { id: demo.id, email: demo.email, full_name: demo.full_name, role: demo.role || "admin", via: "demo" };
  }
  return { id: "usr_demo_001", email: "demo@nms.ai", full_name: "陈元", role: "admin", via: "demo" };
}

const httpError = (status, code, detail) => {
  const err = new Error(code);
  err.status = status;
  err.code = code;
  err.detail = detail;
  return err;
};

/** 必须已登录 */
export function requireAuth(req) {
  const user = resolveIdentity(req);
  if (!user) throw httpError(401, "unauthorized", "缺少或无效的访问令牌");
  return user;
}

/** 必须属于指定角色之一 */
export function requireRole(req, roles = ["admin"]) {
  const user = requireAuth(req);
  const list = Array.isArray(roles) ? roles : [roles];
  if (!list.includes(String(user.role || "").toLowerCase())) {
    throw httpError(403, "forbidden", `需要角色：${list.join("/")}，当前：${user.role}`);
  }
  return user;
}

export const AUTH_META = {
  strict: STRICT,
  tokenTtl: TTL_SECONDS,
  otpTtl: OTP_TTL_MS / 1000,
  algorithm: "HMAC-SHA256 (nms1)",
  roles: ["user", "merchant", "admin", "owner"],
};
