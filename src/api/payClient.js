/**
 * 支付通道客户端（服务端模式专用）
 * 与 server/payments.mjs 对应：原子扣款、幂等、退款、对账、收款码签名
 */
const BASE = (import.meta.env.VITE_API_BASE || "/api").replace(/\/$/, "");

const token = () => {
  try {
    return localStorage.getItem("nms_api_token") || "nms-demo-token";
  } catch (e) {
    return "nms-demo-token";
  }
};

async function call(path, { method = "GET", body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "content-type": "application/json", authorization: `Bearer ${token()}` },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.detail = data;
    throw err;
  }
  return data;
}

/** 幂等键：同一业务单号重试不会重复扣款 */
export const makeIdempotencyKey = (prefix = "pay") =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export const payClient = {
  /** 原子支付：余额 → 锁定 → 结算（失败自动回滚） */
  pay: (params) => call("/pay", { method: "POST", body: params }),

  /** 退款（幂等） */
  refund: (paymentId) => call("/pay/refund", { method: "POST", body: { paymentId } }),

  /** 查询单笔支付 */
  get: (id) => call(`/pay/${encodeURIComponent(id)}`),

  /** 收款码签名（商家侧） */
  signQr: ({ merchantId, qrCode, ttlMs }) => call("/qr/sign", { method: "POST", body: { merchantId, qrCode, ttlMs } }),

  /** 收款码验签（扫码侧） */
  verifyQr: (qrToken) => call("/qr/verify", { method: "POST", body: { token: qrToken } }),

  /** 每日对账 */
  reconcile: (date) => call(`/admin/reconcile${date ? `?date=${date}` : ""}`),

  /** 链式账本完整性 */
  verifyChain: () => call("/chain/verify"),

  /** 最近支付流水 */
  recent: (limit = 20) => call(`/admin/payments?limit=${limit}`),
};

export default payClient;
