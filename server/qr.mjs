/**
 * 收款码签名（防伪）
 *
 * 格式：NMS1.<base64url(payload)>.<sig>
 * payload: { v:1, mid, code, name, exp? }   exp 为毫秒时间戳，可做限时码
 * sig    : HMAC-SHA256(secret, base64url(payload)) 的 base64url 前 32 位
 *
 * 扫码端先验签再下单，避免伪造/篡改的收款码骗取资金。
 */
import crypto from "node:crypto";

const SECRET = process.env.NMS_QR_SECRET || "nms-dev-qr-secret-change-me";
const PREFIX = "NMS1";

const b64u = (buf) => Buffer.from(buf).toString("base64url");
const hmac = (data) => crypto.createHmac("sha256", SECRET).update(data).digest("base64url").slice(0, 32);

export function signMerchantPayload(merchant, { ttlMs } = {}) {
  const payload = {
    v: 1,
    mid: merchant.id,
    code: merchant.qr_code,
    name: merchant.store_name,
    iat: Date.now(),
    ...(ttlMs ? { exp: Date.now() + ttlMs } : {}),
  };
  const body = b64u(JSON.stringify(payload));
  return {
    token: `${PREFIX}.${body}.${hmac(body)}`,
    payload,
  };
}

export function verifyMerchantPayload(token) {
  if (typeof token !== "string") return { valid: false, reason: "invalid_type" };
  const parts = token.trim().split(".");
  if (parts.length !== 3 || parts[0] !== PREFIX) return { valid: false, reason: "bad_format" };

  const [, body, sig] = parts;
  const expected = hmac(body);
  // 定长比较，避免时序侧信道
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { valid: false, reason: "bad_signature" };
  }

  let payload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch (e) {
    return { valid: false, reason: "bad_payload" };
  }

  if (payload.exp && Date.now() > payload.exp) return { valid: false, reason: "expired", payload };
  if (!payload.mid || !payload.code) return { valid: false, reason: "missing_fields", payload };

  return { valid: true, payload };
}

export const QR_META = { PREFIX, secretSource: process.env.NMS_QR_SECRET ? "env" : "default-dev" };
