/**
 * NMS MetaLife 本地数据库层（node:sqlite，零依赖）
 * - 表结构由 server/schema.json（前端实体 Schema 的导出）自动生成
 * - 首次启动自动导入 server/seed.json 演示数据
 * - 预留 Cloudflare D1 迁移：SQL 方言保持一致，仅替换驱动
 */
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const ROOT = path.resolve("server");
const DATA_DIR = path.join(ROOT, "data");
const DB_FILE = process.env.NMS_DB_FILE || path.join(DATA_DIR, "nms.db");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const schemaJson = JSON.parse(fs.readFileSync(path.join(ROOT, "schema.json"), "utf8"));
const seedJson = JSON.parse(fs.readFileSync(path.join(ROOT, "seed.json"), "utf8"));

export const ENTITY_ORDER = schemaJson.order;
export const SCHEMAS = schemaJson.schemas;

const db = new DatabaseSync(DB_FILE);
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

const colType = (def) => {
  if (!def) return "TEXT";
  if (def.type === "number" || def.type === "integer") return "REAL";
  if (def.type === "boolean") return "INTEGER";
  if (def.type === "array" || def.type === "object") return "TEXT";
  return "TEXT";
};

const columnsOf = (name) => Object.entries(SCHEMAS[name].properties);

/** 建表 + 增量补列（Schema 演进时不丢数据） */
function migrate() {
  for (const name of ENTITY_ORDER) {
    const cols = columnsOf(name);
    const defs = cols.map(([key, def]) => `"${key}" ${colType(def)}`);
    db.exec(
      `CREATE TABLE IF NOT EXISTS "${name}" (
        id TEXT PRIMARY KEY,
        ${defs.join(",\n        ")},
        created_date TEXT,
        updated_date TEXT
      );`
    );

    // 补列
    const existing = new Set(db.prepare(`PRAGMA table_info("${name}")`).all().map((r) => r.name));
    for (const [key, def] of cols) {
      if (!existing.has(key)) {
        db.exec(`ALTER TABLE "${name}" ADD COLUMN "${key}" ${colType(def)}`);
      }
    }
    db.exec(`CREATE INDEX IF NOT EXISTS idx_${name}_created ON "${name}"(created_date);`);
  }

  // 账户与会话（服务端自有，不在实体 Schema 内）
  db.exec(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'user',
    token TEXT,
    created_date TEXT
  );`);
  db.exec(`CREATE TABLE IF NOT EXISTS ledger_meta (
    key TEXT PRIMARY KEY,
    value TEXT
  );`);
}

const parseValue = (name, key, value) => {
  const def = SCHEMAS[name]?.properties?.[key];
  if (value === null || value === undefined) return null;
  if (def?.type === "array" || def?.type === "object") {
    try {
      return JSON.parse(value);
    } catch (e) {
      return [];
    }
  }
  if (def?.type === "boolean") return !!value;
  return value;
};

const serializeValue = (name, key, value) => {
  const def = SCHEMAS[name]?.properties?.[key];
  if (value === undefined || value === null) return null;
  if (def?.type === "array" || def?.type === "object") return JSON.stringify(value);
  if (def?.type === "boolean") return value ? 1 : 0;
  if (typeof value === "number") return value;
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

export function rowToEntity(name, row) {
  if (!row) return null;
  const out = { ...row };
  for (const key of Object.keys(out)) {
    if (key === "id" || key === "created_date" || key === "updated_date") continue;
    out[key] = parseValue(name, key, out[key]);
  }
  return out;
}

export function entityToRow(name, entity) {
  const row = {};
  for (const [key, def] of columnsOf(name)) {
    if (entity[key] !== undefined) row[key] = serializeValue(name, key, entity[key]);
  }
  return row;
}

const newId = (name) => `${name.slice(0, 3).toLowerCase()}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

function seedIfEmpty() {
  const total = db.prepare("SELECT COUNT(*) AS c FROM UserBalance").get().c;
  if (total > 0) return false;

  db.exec("BEGIN");
  try {
    for (const name of ENTITY_ORDER) {
      const rows = seedJson[name] || [];
      for (const entity of rows) {
        insertRow(name, entity);
      }
    }
    db.prepare("INSERT OR REPLACE INTO users (id,email,full_name,role,token,created_date) VALUES (?,?,?,?,?,?)").run(
      "usr_demo_001",
      "demo@nms.ai",
      "陈元",
      "admin",
      "nms-demo-token",
      new Date().toISOString()
    );
    db.prepare("INSERT OR REPLACE INTO ledger_meta (key,value) VALUES (?,?)").run("seeded_at", new Date().toISOString());
    db.exec("COMMIT");
    return true;
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

function insertRow(name, entity) {
  const row = entityToRow(name, entity);
  const now = new Date().toISOString();
  const id = entity.id || newId(name);
  const cols = ["id", ...Object.keys(row), "created_date", "updated_date"];
  const vals = [id, ...Object.values(row), entity.created_date || now, now];
  const placeholders = cols.map(() => "?").join(",");
  db.prepare(`INSERT INTO "${name}" (${cols.map((c) => `"${c}"`).join(",")}) VALUES (${placeholders})`).run(...vals);
  return get(name, id);
}

/* ------------------------------- 查询 API ------------------------------- */

const assertEntity = (name) => {
  if (!ENTITY_ORDER.includes(name)) {
    const err = new Error(`unknown entity: ${name}`);
    err.status = 404;
    throw err;
  }
};

const orderClause = (name, sort) => {
  const raw = String(sort || "-created_date");
  const desc = raw.startsWith("-");
  const key = raw.replace(/^[-+]/, "");
  const allowed = new Set(["id", "created_date", "updated_date", ...columnsOf(name).map(([k]) => k)]);
  const col = allowed.has(key) ? key : "created_date";
  return `ORDER BY "${col}" ${desc ? "DESC" : "ASC"}`;
};

export function list(name, sort = "-created_date", limit = 100) {
  assertEntity(name);
  const rows = db
    .prepare(`SELECT * FROM "${name}" ${orderClause(name, sort)} LIMIT ?`)
    .all(Math.min(Number(limit) || 100, 1000));
  return rows.map((r) => rowToEntity(name, r));
}

export function filter(name, query = {}, sort = "-created_date", limit = 100) {
  assertEntity(name);
  const entries = Object.entries(query || {}).filter(([k]) => k === "id" || SCHEMAS[name].properties[k]);
  const where = entries.length ? `WHERE ${entries.map(([k]) => `"${k}" = ?`).join(" AND ")}` : "";
  const vals = entries.map(([, v]) => (typeof v === "boolean" ? (v ? 1 : 0) : v));
  const rows = db
    .prepare(`SELECT * FROM "${name}" ${where} ${orderClause(name, sort)} LIMIT ?`)
    .all(...vals, Math.min(Number(limit) || 100, 1000));
  return rows.map((r) => rowToEntity(name, r));
}

export function get(name, id) {
  assertEntity(name);
  const row = db.prepare(`SELECT * FROM "${name}" WHERE id = ?`).get(id);
  return rowToEntity(name, row);
}

export function create(name, entity) {
  assertEntity(name);
  return insertRow(name, entity || {});
}

export function update(name, id, patch) {
  assertEntity(name);
  const row = entityToRow(name, patch || {});
  const keys = Object.keys(row);
  if (!keys.length) return get(name, id);
  const sets = keys.map((k) => `"${k}" = ?`).join(", ");
  db.prepare(`UPDATE "${name}" SET ${sets}, updated_date = ? WHERE id = ?`).run(
    ...Object.values(row),
    new Date().toISOString(),
    id
  );
  return get(name, id);
}

export function remove(name, id) {
  assertEntity(name);
  db.prepare(`DELETE FROM "${name}" WHERE id = ?`).run(id);
  return { id, deleted: true };
}

export function counts() {
  const out = {};
  for (const name of ENTITY_ORDER) {
    out[name] = db.prepare(`SELECT COUNT(*) AS c FROM "${name}"`).get().c;
  }
  return out;
}

export function bulkSeed(payload) {
  let inserted = 0;
  db.exec("BEGIN");
  try {
    for (const [name, rows] of Object.entries(payload || {})) {
      if (!ENTITY_ORDER.includes(name) || !Array.isArray(rows)) continue;
      for (const entity of rows) {
        insertRow(name, entity);
        inserted += 1;
      }
    }
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
  return inserted;
}

export function resetAll() {
  db.exec("BEGIN");
  try {
    for (const name of ENTITY_ORDER) db.exec(`DELETE FROM "${name}"`);
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
  return seedIfEmpty();
}

export function findUserByToken(token) {
  return db.prepare("SELECT * FROM users WHERE token = ?").get(token) || null;
}

export function findUserByEmail(email) {
  return db.prepare("SELECT * FROM users WHERE email = ?").get(email) || null;
}

export function dbInfo() {
  return { file: DB_FILE, entities: ENTITY_ORDER.length, counts: counts() };
}

migrate();
const seeded = seedIfEmpty();

export const SERVER_BOOT = { seeded, dbFile: DB_FILE };
export default db;
