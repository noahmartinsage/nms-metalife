/**
 * HTTP 客户端：与本地服务端（server/index.mjs）通信，
 * API 表面与 base44Client（localStorage 版）完全一致，可直接替换。
 *
 * 启用方式：VITE_API_MODE=server（开发时经 vite 代理 /api → 127.0.0.1:8787）
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

async function request(path, { method = "GET", body } = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!res.ok) {
    let detail = "";
    try {
      const err = await res.json();
      detail = err.error || JSON.stringify(err);
    } catch (e) {
      detail = res.statusText;
    }
    throw new Error(`API ${method} ${path} → ${res.status} ${detail}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

/** 轮询式订阅：服务端未提供 WS 时保持接口一致 */
function subscribe(name, callback, intervalMs = 4000) {
  let stopped = false;
  let last = "";
  const tick = async () => {
    if (stopped) return;
    try {
      const rows = await request(`/entities/${name}/list`, { method: "POST", body: { limit: 100 } });
      const sig = JSON.stringify(rows.map((r) => r.id + r.updated_date));
      if (sig !== last) {
        last = sig;
        callback?.({ entity: name, data: rows });
      }
    } catch (e) {
      /* 网络异常时静默重试 */
    }
  };
  const timer = setInterval(tick, intervalMs);
  tick();
  return () => {
    stopped = true;
    clearInterval(timer);
  };
}

const entityApi = (name) => ({
  list: (sort = "-created_date", limit = 100) =>
    request(`/entities/${name}/list`, { method: "POST", body: { sort, limit } }),
  filter: (query = {}, sort = "-created_date", limit = 100) =>
    request(`/entities/${name}/filter`, { method: "POST", body: { query, sort, limit } }),
  get: (id) => request(`/entities/${name}/${encodeURIComponent(id)}`),
  create: (data) => request(`/entities/${name}`, { method: "POST", body: data }),
  update: (id, patch) => request(`/entities/${name}/${encodeURIComponent(id)}`, { method: "PATCH", body: patch }),
  delete: (id) => request(`/entities/${name}/${encodeURIComponent(id)}`, { method: "DELETE" }),
  subscribe: (cb, intervalMs) => subscribe(name, cb, intervalMs),
});

const ENTITIES = [
  "UserBalance",
  "WalletAccount",
  "MerchantStore",
  "PromotionLevel",
  "PaymentOrder",
  "NFTItem",
  "Transaction",
  "LiquidityPool",
  "RedPacket",
  "DataAsset",
  "DAORegion",
  "ChatMessage",
  "TradingStrategy",
];

export const base44 = {
  entities: Object.fromEntries(ENTITIES.map((n) => [n, entityApi(n)])),

  auth: {
    async me() {
      return request("/auth/me", { method: "POST", body: {} });
    },
    async login(email) {
      const data = await request("/auth/login", { method: "POST", body: { email } });
      try {
        if (data?.token) localStorage.setItem(TOKEN_KEY, data.token);
      } catch (e) {
        /* ignore */
      }
      return data;
    },
    async logout() {
      try {
        localStorage.removeItem(TOKEN_KEY);
      } catch (e) {
        /* ignore */
      }
      return true;
    },
    async updateMe(patch) {
      const me = await request("/auth/me", { method: "POST", body: {} });
      return { ...me, ...patch };
    },
  },

  integrations: {
    Core: {
      async InvokeLLM({ prompt } = {}) {
        return request("/integrations/llm", { method: "POST", body: { prompt } });
      },
      async UploadFile({ file } = {}) {
        return { file_url: `local://upload/${file?.name || "file"}` };
      },
      async SendEmail({ to, subject } = {}) {
        return { delivered: true, to, subject };
      },
      async GenerateImage({ prompt } = {}) {
        return { url: `local://generated/${encodeURIComponent(String(prompt || "").slice(0, 24))}.png` };
      },
      async CreateFileSignedUrl({ file_uri } = {}) {
        return { signed_url: file_uri };
      },
    },
  },

  /** 服务端管理：重置为种子数据 */
  async resetDemoData() {
    return request("/admin/reset", { method: "POST", body: {} });
  },

  /** 服务端管理：批量导入（把本地演示数据迁移到 SQLite） */
  async bulkSeed(entities) {
    return request("/admin/seed", { method: "POST", body: { entities } });
  },

  /** 健康检查 */
  async health() {
    return request("/health");
  },

  mode: "server",
};

export default base44;
