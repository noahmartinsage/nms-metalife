/**
 * KMS 客户端：对接服务端 /api/kms/* 与 /api/chain/*
 *
 * 只做展示与运维操作；签名私钥始终留在服务端，前端拿不到也无需拿到。
 */

const BASE = (import.meta.env.VITE_API_BASE || "/api").replace(/\/$/, "");
const TOKEN_KEY = "nms_api_token";

const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY) || "";
  } catch (e) {
    return "";
  }
};

async function call(path, { method = "GET", body, allowFail = false } = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }

  if (!res.ok && !allowFail) {
    const err = new Error(data?.detail || data?.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const kmsClient = {
  /** 服务状态：provider / 算法 / 密钥数 / 延迟 */
  health: () => call("/kms/health"),

  /** 密钥列表（仅公钥与指纹） */
  keys: (alias) => call(`/kms/keys${alias ? `?alias=${encodeURIComponent(alias)}` : ""}`),

  /** 轮换密钥（旧密钥保留验签） */
  rotate: (alias = "nms-chain-tx") => call("/kms/rotate", { method: "POST", body: { alias } }),

  /** 签名（需要登录） */
  sign: (payload, context = "api") => call("/kms/sign", { method: "POST", body: { payload, context } }),

  /** 验签（公开，失败返回 valid:false 而不是抛错） */
  verify: (payload, signature, keyId) =>
    call("/kms/verify", { method: "POST", body: { payload, signature, keyId }, allowFail: true }),

  /** 签名审计 */
  audit: (limit = 20, op) => call(`/kms/audit?limit=${limit}${op ? `&op=${op}` : ""}`),

  /** 生成链检查点（账本根哈希后量子签名） */
  checkpoint: () => call("/chain/checkpoint", { method: "POST", body: {} }),

  /** 检查点列表 */
  checkpoints: (limit = 10) => call(`/chain/checkpoints?limit=${limit}`),

  /** 校验检查点签名 */
  verifyCheckpoint: (id = "latest") => call("/chain/checkpoint/verify", { method: "POST", body: { id } }),

  /** 逐笔校验链上交易签名 */
  chainVerify: (limit = 50) => call(`/chain/verify?limit=${limit}`),
};

export default kmsClient;
