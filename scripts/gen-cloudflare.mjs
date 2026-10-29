/**
 * 从 server/schema.json + seed.json 生成 Cloudflare D1 迁移脚本
 * 输出：cloudflare/migrations/0001_schema.sql、0002_seed.sql
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve("server");
const OUT = path.resolve("cloudflare/migrations");
fs.mkdirSync(OUT, { recursive: true });

const { order, schemas } = JSON.parse(fs.readFileSync(path.join(ROOT, "schema.json"), "utf8"));
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "seed.json"), "utf8"));

const colType = (def) => {
  if (!def) return "TEXT";
  if (def.type === "number" || def.type === "integer") return "REAL";
  if (def.type === "boolean") return "INTEGER";
  return "TEXT";
};

const quote = (v) => {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "1" : "0";
  if (typeof v === "object") return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
  return `'${String(v).replace(/'/g, "''")}'`;
};

/* ---------------------------- 0001_schema.sql ---------------------------- */
const schemaLines = ["-- NMS MetaLife · D1 初始化（由 scripts/gen-cloudflare.mjs 生成）", ""];

for (const name of order) {
  const cols = Object.entries(schemas[name].properties).map(([k, def]) => `  "${k}" ${colType(def)}`);
  schemaLines.push(
    `CREATE TABLE IF NOT EXISTS "${name}" (`,
    `  id TEXT PRIMARY KEY,`,
    cols.join(",\n") + ",",
    `  created_date TEXT,`,
    `  updated_date TEXT`,
    `);`,
    `CREATE INDEX IF NOT EXISTS idx_${name}_created ON "${name}"(created_date);`,
    ""
  );
}

schemaLines.push(
  `CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'user',
  token TEXT,
  created_date TEXT
);`,
  `CREATE TABLE IF NOT EXISTS ledger_meta (key TEXT PRIMARY KEY, value TEXT);`,
  ""
);

fs.writeFileSync(path.join(OUT, "0001_schema.sql"), schemaLines.join("\n"), "utf8");

/* ----------------------------- 0002_seed.sql ----------------------------- */
const seedLines = ["-- NMS MetaLife · 演示种子数据（由 scripts/gen-cloudflare.mjs 生成）", "BEGIN TRANSACTION;", ""];

for (const name of order) {
  const rows = seed[name] || [];
  for (const entity of rows) {
    const cols = ["id", "created_date", "updated_date"];
    const vals = [
      entity.id || `${name.slice(0, 3).toLowerCase()}_${Math.random().toString(36).slice(2, 9)}`,
      entity.created_date || new Date().toISOString(),
      entity.updated_date || new Date().toISOString(),
    ];
    for (const [k, def] of Object.entries(schemas[name].properties)) {
      cols.push(k);
      vals.push(entity[k] === undefined ? null : entity[k]);
    }
    seedLines.push(
      `INSERT OR REPLACE INTO "${name}" (${cols.map((c) => `"${c}"`).join(",")}) VALUES (${vals
        .map(quote)
        .join(",")});`
    );
  }
}

seedLines.push(
  `INSERT OR REPLACE INTO users (id,email,full_name,role,token,created_date) VALUES ('usr_demo_001','demo@nms.ai','陈元','admin','nms-demo-token','${new Date().toISOString()}');`,
  `INSERT OR REPLACE INTO ledger_meta (key,value) VALUES ('seeded_at','${new Date().toISOString()}');`,
  "COMMIT;",
  ""
);

fs.writeFileSync(path.join(OUT, "0002_seed.sql"), seedLines.join("\n"), "utf8");

// 生成 Worker 用的实体元数据
const metaDir = path.resolve("cloudflare/src");
fs.mkdirSync(metaDir, { recursive: true });
const meta = {
  order,
  columns: Object.fromEntries(
    order.map((name) => [
      name,
      Object.fromEntries(Object.entries(schemas[name].properties).map(([k, def]) => [k, def.type || "string"])),
    ])
  ),
};
fs.writeFileSync(
  path.join(metaDir, "entities.js"),
  "// 由 scripts/gen-cloudflare.mjs 自动生成，请勿手改\n" +
    "export const ENTITY_META = " +
    JSON.stringify(meta, null, 2) +
    ";\n",
  "utf8"
);

console.log("[gen-cloudflare] entities.js:", order.length, "个实体");
console.log("[gen-cloudflare] 0001_schema.sql:", schemaLines.length, "行");
console.log("[gen-cloudflare] 0002_seed.sql:", seedLines.length, "行");
