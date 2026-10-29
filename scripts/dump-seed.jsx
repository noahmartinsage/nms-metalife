/**
 * 把前端演示种子与实体 Schema 导出为 JSON，供本地服务端初始化 SQLite 使用。
 * 用法：vite build --ssr scripts/dump-seed.jsx --outDir .ssr-seed && node .ssr-seed/dump-seed.js
 */
import fs from "node:fs";
import path from "node:path";
import { buildSeed } from "../src/api/seed.js";
import { SCHEMAS, ENTITY_ORDER } from "../src/api/schemas.js";

const dir = path.resolve("server");
fs.mkdirSync(dir, { recursive: true });

const seed = buildSeed();
fs.writeFileSync(path.join(dir, "seed.json"), JSON.stringify(seed, null, 2), "utf8");
fs.writeFileSync(
  path.join(dir, "schema.json"),
  JSON.stringify({ order: ENTITY_ORDER, schemas: SCHEMAS }, null, 2),
  "utf8"
);

const summary = Object.entries(seed)
  .map(([k, v]) => `${k}:${v.length}`)
  .join(", ");
console.log("[dump-seed] entities:", ENTITY_ORDER.length);
console.log("[dump-seed] rows:", summary);
