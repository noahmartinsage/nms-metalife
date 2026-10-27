/**
 * base44Client — 本地 BaaS 模拟层
 *
 * 真实项目由 Base44 BaaS 提供：实体存储（MongoDB）、多方式认证、集成服务、实时订阅。
 * 本项目为「提示词复现版」，用 localStorage 完整模拟同一套 API 契约，
 * 使所有业务代码保持与 Base44 SDK 完全一致的调用方式（list / filter / create / update / delete / subscribe）。
 */
import { buildSeed, DEMO_USER } from "./seed";
import { ENTITY_ORDER } from "./schemas";

const DB_KEY = "nms_metalife_db_v13";
const USER_KEY = "nms_metalife_user_v13";
const CHANGE_EVENT = "nms:db-change";

const clone = (v) => JSON.parse(JSON.stringify(v));

const readDB = () => {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const ok = ENTITY_ORDER.every((name) => Array.isArray(parsed[name]));
      if (ok) return parsed;
    }
  } catch (e) {
    /* 存储损坏则重建 */
  }
  const fresh = buildSeed();
  writeDB(fresh);
  return fresh;
};

const writeDB = (db) => {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch (e) {
    /* 超出配额时降级为内存模式 */
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { at: Date.now() } }));
  }
};

const uid = (prefix) =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

const sortRows = (rows, sort) => {
  if (!sort) return rows;
  const desc = String(sort).startsWith("-");
  const key = desc ? String(sort).slice(1) : String(sort);
  return [...rows].sort((a, b) => {
    const av = a?.[key];
    const bv = b?.[key];
    if (av === bv) return 0;
    if (av === undefined || av === null) return 1;
    if (bv === undefined || bv === null) return -1;
    const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
    return desc ? -cmp : cmp;
  });
};

const matchQuery = (row, query = {}) =>
  Object.entries(query).every(([k, v]) => {
    if (v === undefined || v === null) return true;
    const rv = row?.[k];
    if (Array.isArray(v)) return v.includes(rv);
    return rv === v;
  });

function createEntityApi(name) {
  return {
    /** 列表查询 */
    async list(sort = "-created_date", limit = 500) {
      const db = readDB();
      return clone(sortRows(db[name] || [], sort).slice(0, limit));
    },

    /** 条件查询 */
    async filter(query = {}, sort = "-created_date", limit = 500) {
      const db = readDB();
      const rows = (db[name] || []).filter((r) => matchQuery(r, query));
      return clone(sortRows(rows, sort).slice(0, limit));
    },

    /** 单条读取 */
    async get(id) {
      const db = readDB();
      const row = (db[name] || []).find((r) => r.id === id);
      return row ? clone(row) : null;
    },

    /** 新建 */
    async create(data) {
      const db = readDB();
      const row = {
        id: uid(name.slice(0, 3).toLowerCase()),
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
        ...data,
      };
      db[name] = [row, ...(db[name] || [])];
      writeDB(db);
      return clone(row);
    },

    /** 批量新建 */
    async bulkCreate(list = []) {
      const db = readDB();
      const rows = list.map((data) => ({
        id: uid(name.slice(0, 3).toLowerCase()),
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
        ...data,
      }));
      db[name] = [...rows, ...(db[name] || [])];
      writeDB(db);
      return clone(rows);
    },

    /** 更新 */
    async update(id, data) {
      const db = readDB();
      let updated = null;
      db[name] = (db[name] || []).map((r) => {
        if (r.id !== id) return r;
        updated = { ...r, ...data, id, updated_date: new Date().toISOString() };
        return updated;
      });
      writeDB(db);
      return updated ? clone(updated) : null;
    },

    /** 按条件批量更新 */
    async bulkUpdate(query = {}, data = {}) {
      const db = readDB();
      let count = 0;
      db[name] = (db[name] || []).map((r) => {
        if (!matchQuery(r, query)) return r;
        count += 1;
        return { ...r, ...data, updated_date: new Date().toISOString() };
      });
      writeDB(db);
      return { updated: count };
    },

    /** 删除 */
    async delete(id) {
      const db = readDB();
      db[name] = (db[name] || []).filter((r) => r.id !== id);
      writeDB(db);
      return { deleted: true, id };
    },

    /** 实时订阅（模拟 WebSocket 实体变更推送） */
    subscribe(callback) {
      const handler = () => callback({ entity: name });
      window.addEventListener(CHANGE_EVENT, handler);
      return () => window.removeEventListener(CHANGE_EVENT, handler);
    },
  };
}

const entities = ENTITY_ORDER.reduce((acc, name) => {
  acc[name] = createEntityApi(name);
  return acc;
}, {});

const getUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    /* ignore */
  }
  return DEMO_USER;
};

const sleep = (ms = 180) => new Promise((r) => setTimeout(r, ms));

export const base44 = {
  auth: {
    async me() {
      await sleep(60);
      return getUser();
    },
    async updateMe(data) {
      const next = { ...getUser(), ...data };
      localStorage.setItem(USER_KEY, JSON.stringify(next));
      return next;
    },
    async login(email = DEMO_USER.email) {
      const next = { ...DEMO_USER, email };
      localStorage.setItem(USER_KEY, JSON.stringify(next));
      return next;
    },
    logout() {
      localStorage.removeItem(USER_KEY);
      window.location.reload();
    },
    redirectToLogin() {
      window.location.reload();
    },
  },

  entities,

  integrations: {
    Core: {
      /** AI 调用（本地模拟 Minara-AI 回复） */
      async InvokeLLM({ prompt = "", add_context_from_internet = false, response_json_schema } = {}) {
        await sleep(520);
        if (response_json_schema) {
          return {
            result: "已根据当前钱包与等级生成策略建议",
            confidence: 0.86,
            actions: ["提升消费维度至 7 级", "合成 3 个 rare NFT", "将 20% 可用 NMS 质押至 DeFi"],
          };
        }
        const short = prompt.slice(0, 60).replace(/\s+/g, " ");
        return [
          `【Minara-AI】已解析你的问题：「${short}${prompt.length > 60 ? "…" : ""}」`,
          "",
          "· 当前钱包：可用 NMS 12,860.5，待释放 48,000，释放周期 552 天（1.81x 加速）",
          "· 建议路径：消费维度 6→7（月消费 ≥ 50 万）可将释放周期压缩至 478 天",
          "· 风险提示：NMS/USDT 池 24h 波动 18.4%，未触发 25% 熔断阈值",
          add_context_from_internet ? "· 已联网校验链上数据（模拟）" : "",
        ]
          .filter(Boolean)
          .join("\n");
      },
      async SendEmail({ to, subject }) {
        await sleep(300);
        return { success: true, to, subject, message_id: uid("mail") };
      },
      async UploadFile({ file } = {}) {
        await sleep(300);
        return { file_url: `local://uploads/${file?.name || uid("file")}` };
      },
      async UploadPrivateFile({ file } = {}) {
        await sleep(300);
        return { file_uri: `local://private/${file?.name || uid("file")}` };
      },
      async GenerateImage({ prompt } = {}) {
        await sleep(400);
        return { url: `local://generated/${encodeURIComponent(String(prompt).slice(0, 24))}.png` };
      },
      async CreateFileSignedUrl({ file_uri } = {}) {
        return { signed_url: file_uri };
      },
    },
  },

  /** 演示数据重置 */
  resetDemoData() {
    localStorage.removeItem(DB_KEY);
    localStorage.removeItem(USER_KEY);
    writeDB(buildSeed());
  },
};

export default base44;
