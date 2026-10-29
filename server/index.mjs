/**
 * NMS MetaLife 本地服务端（Node 原生 http + node:sqlite，零第三方依赖）
 *
 * 启动：npm run server          → http://127.0.0.1:8787
 * 健康检查：GET /api/health
 *
 * 与前端 base44Client 契约保持一致，切换方式：
 *   VITE_API_BASE=http://127.0.0.1:8787 npm run dev
 */
import http from "node:http";
import { URL } from "node:url";
import {
  ENTITY_ORDER,
  SCHEMAS,
  SERVER_BOOT,
  list,
  filter,
  get,
  create,
  update,
  remove,
  counts,
  bulkSeed,
  resetAll,
  findUserByToken,
  findUserByEmail,
  dbInfo,
} from "./db.mjs";

const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || "127.0.0.1";
const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN || "http://127.0.0.1:3000,http://localhost:3000,http://127.0.0.1:5173,http://localhost:5173").split(",");

/* --------------------------- 简易速率限制 --------------------------- */
const hits = new Map();
const RATE_WINDOW = 60_000;
const RATE_MAX = 600;

function rateLimited(ip) {
  const now = Date.now();
  const rec = hits.get(ip) || { count: 0, start: now };
  if (now - rec.start > RATE_WINDOW) {
    rec.count = 0;
    rec.start = now;
  }
  rec.count += 1;
  hits.set(ip, rec);
  return rec.count > RATE_MAX;
}

/* ------------------------------ 工具 ------------------------------ */
const json = (res, status, body) => {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(payload),
    "cache-control": "no-store",
  });
  res.end(payload);
};

const readBody = (req) =>
  new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > 4 * 1024 * 1024) {
        reject(Object.assign(new Error("payload too large"), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => {
      if (!chunks.length) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch (e) {
        reject(Object.assign(new Error("invalid json"), { status: 400 }));
      }
    });
    req.on("error", reject);
  });

const cors = (req, res) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("access-control-allow-origin", origin);
    res.setHeader("vary", "origin");
  } else if (ALLOWED_ORIGINS.includes("*")) {
    res.setHeader("access-control-allow-origin", "*");
  }
  res.setHeader("access-control-allow-methods", "GET,POST,PATCH,PUT,DELETE,OPTIONS");
  res.setHeader("access-control-allow-headers", "content-type,authorization,x-user-email");
  res.setHeader("access-control-max-age", "600");
};

const authOf = (req) => {
  const raw = req.headers.authorization || "";
  const token = raw.startsWith("Bearer ") ? raw.slice(7) : null;
  if (token) {
    const user = findUserByToken(token);
    if (user) return { id: user.id, email: user.email, full_name: user.full_name, role: user.role };
  }
  const email = req.headers["x-user-email"];
  if (email) {
    const user = findUserByEmail(String(email));
    if (user) return { id: user.id, email: user.email, full_name: user.full_name, role: user.role };
  }
  return { id: "usr_demo_001", email: "demo@nms.ai", full_name: "陈元", role: "admin" };
};

/* ------------------------------ 路由 ------------------------------ */
const server = http.createServer(async (req, res) => {
  const started = Date.now();
  cors(req, res);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  const ip = req.socket.remoteAddress || "local";
  if (rateLimited(ip)) return json(res, 429, { error: "rate_limited" });

  const url = new URL(req.url, `http://${req.headers.host}`);
  const seg = url.pathname.replace(/^\/+|\/+$/g, "").split("/"); // api/entities/Name/:id
  const method = req.method.toUpperCase();

  try {
    /* 健康检查 */
    if (method === "GET" && url.pathname === "/api/health") {
      return json(res, 200, {
        ok: true,
        service: "nms-metalife-api",
        version: "1.0.0",
        time: new Date().toISOString(),
        boot: SERVER_BOOT,
        db: dbInfo(),
      });
    }

    /* Schema 元数据 */
    if (method === "GET" && url.pathname === "/api/schemas") {
      return json(res, 200, { order: ENTITY_ORDER, schemas: SCHEMAS });
    }

    /* 认证 */
    if (method === "POST" && url.pathname === "/api/auth/me") {
      return json(res, 200, authOf(req));
    }
    if (method === "POST" && url.pathname === "/api/auth/login") {
      const body = await readBody(req);
      const user = findUserByEmail(String(body.email || "")) || findUserByEmail("demo@nms.ai");
      if (!user) return json(res, 401, { error: "user_not_found" });
      return json(res, 200, { token: user.token, user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role } });
    }

    /* 实体集合 */
    if (seg[0] === "api" && seg[1] === "entities" && seg[2]) {
      const name = decodeURIComponent(seg[2]);
      const action = seg[3] ? decodeURIComponent(seg[3]) : null;
      const isCollectionAction = action === "list" || action === "filter";
      const id = action && !isCollectionAction ? action : null;

      if (isCollectionAction && method === "POST") {
        const body = await readBody(req);
        if (action === "list") return json(res, 200, list(name, body.sort, body.limit));
        return json(res, 200, filter(name, body.query, body.sort, body.limit));
      }
      if (!action && method === "POST") {
        const body = await readBody(req);
        return json(res, 201, create(name, body));
      }
      if (id && method === "GET") return json(res, 200, get(name, id));
      if (id && (method === "PATCH" || method === "PUT")) {
        const body = await readBody(req);
        return json(res, 200, update(name, id, body));
      }
      if (id && method === "DELETE") return json(res, 200, remove(name, id));
    }

    /* 管理操作 */
    if (method === "POST" && url.pathname === "/api/admin/seed") {
      const body = await readBody(req);
      const inserted = bulkSeed(body.entities || body);
      return json(res, 200, { inserted, counts: counts() });
    }
    if (method === "POST" && url.pathname === "/api/admin/reset") {
      const ok = resetAll();
      return json(res, 200, { reset: true, seeded: ok, counts: counts() });
    }

    /* AI 集成（可接真实 LLM；未配置时返回确定性应答） */
    if (method === "POST" && url.pathname === "/api/integrations/llm") {
      const body = await readBody(req);
      const prompt = String(body.prompt || "").slice(0, 2000);
      if (process.env.LLM_API_KEY && process.env.LLM_ENDPOINT) {
        const r = await fetch(process.env.LLM_ENDPOINT, {
          method: "POST",
          headers: { "content-type": "application/json", authorization: `Bearer ${process.env.LLM_API_KEY}` },
          body: JSON.stringify({ model: process.env.LLM_MODEL || "gpt-4o-mini", messages: [{ role: "user", content: prompt }] }),
        });
        const data = await r.json();
        const text = data?.choices?.[0]?.message?.content || data?.content || "";
        return json(res, 200, text || "（模型未返回内容）");
      }
      return json(res, 200, `【本地推理】已收到：${prompt}\n\n当前为离线应答模式；配置 LLM_ENDPOINT 与 LLM_API_KEY 后将转发至真实模型。`);
    }

    return json(res, 404, { error: "not_found", path: url.pathname });
  } catch (e) {
    const status = e.status || 500;
    if (status >= 500) console.error("[api]", e);
    return json(res, status, { error: e.message || "internal_error" });
  } finally {
    if (process.env.LOG !== "off") {
      console.log(`${method} ${url.pathname} ${res.statusCode} ${Date.now() - started}ms`);
    }
  }
});

server.listen(PORT, HOST, () => {
  const info = dbInfo();
  console.log(`\n  NMS MetaLife API  →  http://${HOST}:${PORT}`);
  console.log(`  数据库            →  ${SERVER_BOOT.dbFile}`);
  console.log(`  实体              →  ${info.entities} 个 ${SERVER_BOOT.seeded ? "(已导入演示数据)" : ""}`);
  console.log(`  实体行数          →  ${Object.entries(info.counts).map(([k, v]) => `${k}:${v}`).join(" ")}\n`);
});
