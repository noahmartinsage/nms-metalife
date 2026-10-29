/**
 * NMS MetaLife · Cloudflare Worker API（D1）
 *
 * 与本地 server/index.mjs 同一套路由与返回结构，
 * 前端只需把 VITE_API_BASE 指向 Worker 域名即可。
 *
 * 部署：
 *   npx wrangler d1 create nms-metalife
 *   npx wrangler d1 execute nms-metalife --file=./cloudflare/migrations/0001_schema.sql --remote
 *   npx wrangler d1 execute nms-metalife --file=./cloudflare/migrations/0002_seed.sql --remote
 *   npx wrangler deploy --config cloudflare/wrangler.toml
 */
import { ENTITY_META } from "./entities.js";

const ORDER = ENTITY_META.order;
const COLS = ENTITY_META.columns;

const json = (body, status = 200, extra = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...extra,
    },
  });

const corsHeaders = (request) => {
  const origin = request.headers.get("origin") || "*";
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS",
    "access-control-allow-headers": "content-type,authorization,x-user-email",
    "access-control-max-age": "600",
    vary: "origin",
  };
};

const parse = (value, type) => {
  if (value === null || value === undefined) return null;
  if (type === "boolean") return !!value;
  if (type === "array" || type === "object") {
    try {
      return JSON.parse(value);
    } catch (e) {
      return [];
    }
  }
  return value;
};

const serialize = (value, type) => {
  if (value === undefined || value === null) return null;
  if (type === "array" || type === "object") return JSON.stringify(value);
  if (type === "boolean") return value ? 1 : 0;
  if (typeof value === "object") return JSON.stringify(value);
  return value;
};

const toEntity = (name, row) => {
  if (!row) return null;
  const out = { ...row };
  for (const [key, type] of Object.entries(COLS[name] || {})) {
    if (key in out) out[key] = parse(out[key], type);
  }
  return out;
};

const orderClause = (name, sort) => {
  const raw = String(sort || "-created_date");
  const desc = raw.startsWith("-");
  const key = raw.replace(/^[-+]/, "");
  const allowed = new Set(["id", "created_date", "updated_date", ...Object.keys(COLS[name] || {})]);
  const col = allowed.has(key) ? key : "created_date";
  return `ORDER BY "${col}" ${desc ? "DESC" : "ASC"}`;
};

const newId = (name) =>
  `${name.slice(0, 3).toLowerCase()}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

async function insertRow(env, name, entity) {
  const now = new Date().toISOString();
  const id = entity.id || newId(name);
  const cols = ["id"];
  const vals = [id];

  for (const [key, type] of Object.entries(COLS[name] || {})) {
    if (entity[key] !== undefined) {
      cols.push(key);
      vals.push(serialize(entity[key], type));
    }
  }
  cols.push("created_date", "updated_date");
  vals.push(entity.created_date || now, now);

  await env.DB.prepare(
    `INSERT INTO "${name}" (${cols.map((c) => `"${c}"`).join(",")}) VALUES (${cols.map(() => "?").join(",")})`
  )
    .bind(...vals)
    .run();

  const row = await env.DB.prepare(`SELECT * FROM "${name}" WHERE id = ?`).bind(id).first();
  return toEntity(name, row);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const method = request.method.toUpperCase();
    const cors = corsHeaders(request);

    if (method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

    const seg = url.pathname.replace(/^\/+|\/+$/g, "").split("/");

    try {
      if (method === "GET" && url.pathname === "/api/health") {
        const counts = {};
        for (const name of ORDER) {
          const row = await env.DB.prepare(`SELECT COUNT(*) AS c FROM "${name}"`).first();
          counts[name] = row?.c ?? 0;
        }
        return json(
          { ok: true, service: "nms-metalife-api", runtime: "cloudflare-worker", version: "1.0.0", db: { entities: ORDER.length, counts } },
          200,
          cors
        );
      }

      if (method === "POST" && url.pathname === "/api/auth/me") {
        return json({ id: "usr_demo_001", email: "demo@nms.ai", full_name: "陈元", role: "admin" }, 200, cors);
      }

      if (method === "POST" && url.pathname === "/api/auth/login") {
        const user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind("demo@nms.ai").first();
        return json({ token: user?.token || "nms-demo-token", user: { id: user?.id, email: user?.email, full_name: user?.full_name, role: user?.role } }, 200, cors);
      }

      if (seg[0] === "api" && seg[1] === "entities" && seg[2]) {
        const name = decodeURIComponent(seg[2]);
        if (!ORDER.includes(name)) return json({ error: "unknown_entity", name }, 404, cors);

        const action = seg[3] ? decodeURIComponent(seg[3]) : null;
        const isCollection = action === "list" || action === "filter";
        const id = action && !isCollection ? action : null;

        if (isCollection && method === "POST") {
          const body = await request.json().catch(() => ({}));
          const limit = Math.min(Number(body.limit) || 100, 1000);

          if (action === "list") {
            const { results } = await env.DB.prepare(
              `SELECT * FROM "${name}" ${orderClause(name, body.sort)} LIMIT ?`
            )
              .bind(limit)
              .all();
            return json((results || []).map((r) => toEntity(name, r)), 200, cors);
          }

          const entries = Object.entries(body.query || {}).filter(([k]) => k === "id" || COLS[name][k]);
          const where = entries.length ? `WHERE ${entries.map(([k]) => `"${k}" = ?`).join(" AND ")}` : "";
          const binds = entries.map(([, v]) => (typeof v === "boolean" ? (v ? 1 : 0) : v));
          const { results } = await env.DB.prepare(
            `SELECT * FROM "${name}" ${where} ${orderClause(name, body.sort)} LIMIT ?`
          )
            .bind(...binds, limit)
            .all();
          return json((results || []).map((r) => toEntity(name, r)), 200, cors);
        }

        if (!action && method === "POST") {
          const body = await request.json().catch(() => ({}));
          return json(await insertRow(env, name, body), 201, cors);
        }

        if (id && method === "GET") {
          const row = await env.DB.prepare(`SELECT * FROM "${name}" WHERE id = ?`).bind(id).first();
          return json(toEntity(name, row), 200, cors);
        }

        if (id && (method === "PATCH" || method === "PUT")) {
          const body = await request.json().catch(() => ({}));
          const sets = [];
          const vals = [];
          for (const [k, type] of Object.entries(COLS[name])) {
            if (body[k] !== undefined) {
              sets.push(`"${k}" = ?`);
              vals.push(serialize(body[k], type));
            }
          }
          if (sets.length) {
            await env.DB.prepare(`UPDATE "${name}" SET ${sets.join(", ")}, updated_date = ? WHERE id = ?`)
              .bind(...vals, new Date().toISOString(), id)
              .run();
          }
          const row = await env.DB.prepare(`SELECT * FROM "${name}" WHERE id = ?`).bind(id).first();
          return json(toEntity(name, row), 200, cors);
        }

        if (id && method === "DELETE") {
          await env.DB.prepare(`DELETE FROM "${name}" WHERE id = ?`).bind(id).run();
          return json({ id, deleted: true }, 200, cors);
        }
      }

      if (method === "POST" && url.pathname === "/api/admin/seed") {
        const body = await request.json().catch(() => ({}));
        let inserted = 0;
        for (const [name, rows] of Object.entries(body.entities || body || {})) {
          if (!ORDER.includes(name) || !Array.isArray(rows)) continue;
          for (const row of rows) {
            await insertRow(env, name, row);
            inserted += 1;
          }
        }
        return json({ inserted }, 200, cors);
      }

      if (method === "POST" && url.pathname === "/api/admin/reset") {
        for (const name of ORDER) await env.DB.prepare(`DELETE FROM "${name}"`).run();
        return json({ reset: true }, 200, cors);
      }

      if (method === "POST" && url.pathname === "/api/integrations/llm") {
        const body = await request.json().catch(() => ({}));
        return json(`【边缘推理】已收到：${String(body.prompt || "").slice(0, 200)}`, 200, cors);
      }

      return json({ error: "not_found", path: url.pathname }, 404, cors);
    } catch (e) {
      return json({ error: String(e.message || e) }, 500, cors);
    }
  },
};
