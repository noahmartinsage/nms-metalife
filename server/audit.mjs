/**
 * 审计日志：记录所有写操作（谁、何时、对什么、从哪个 IP）
 * 商用系统必备：出问题能回溯，监管能举证。
 */
import crypto from "node:crypto";
import db from "./db.mjs";

db.exec(`
  CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY,
    actor TEXT,
    action TEXT,
    target TEXT,
    target_id TEXT,
    ip TEXT,
    payload TEXT,
    result TEXT,
    created_date TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_date);
  CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);
`);

const newId = () => `aud_${Date.now().toString(36)}${crypto.randomBytes(3).toString("hex")}`;

export function audit({ actor = "system", action, target = "", targetId = "", ip = "", payload = {}, result = "ok" } = {}) {
  try {
    db.prepare(
      `INSERT INTO audit_log (id, actor, action, target, target_id, ip, payload, result, created_date)
       VALUES (?,?,?,?,?,?,?,?,?)`
    ).run(
      newId(),
      String(actor),
      String(action),
      String(target),
      String(targetId),
      String(ip),
      JSON.stringify(payload).slice(0, 4000),
      String(result),
      new Date().toISOString()
    );
  } catch (e) {
    // 审计失败不能阻断主流程，但要留痕
    console.warn("[audit] 写入失败：", e.message);
  }
}

export function listAudit({ limit = 30, action, actor } = {}) {
  const where = [];
  const binds = [];
  if (action) {
    where.push("action = ?");
    binds.push(action);
  }
  if (actor) {
    where.push("actor = ?");
    binds.push(actor);
  }
  const sql = `SELECT * FROM audit_log ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY created_date DESC LIMIT ?`;
  return db
    .prepare(sql)
    .all(...binds, Math.min(Number(limit) || 30, 200))
    .map((r) => ({ ...r, payload: r.payload ? JSON.parse(r.payload) : null }));
}

export function auditStats() {
  const total = db.prepare("SELECT COUNT(*) AS c FROM audit_log").get().c;
  const today = db
    .prepare("SELECT COUNT(*) AS c FROM audit_log WHERE created_date LIKE ?")
    .get(`${new Date().toISOString().slice(0, 10)}%`).c;
  return { total, today };
}
