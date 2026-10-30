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
import db, {
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
import {
  pay,
  refund,
  getPayment,
  listPayments,
  reconcile,
  verifyChain,
  splitPayment,
  requestRefund,
  listRefunds,
  approveRefund,
  rejectRefund,
  runReconcile,
  listReconcileRuns,
  listAlerts,
  REFUND_RULES,
  compensate,
} from "./payments.mjs";
import { audit, listAudit, auditStats } from "./audit.mjs";
import {
  issueToken,
  verifyToken,
  revokeToken,
  sendOtp,
  loginWithOtp,
  resolveIdentity,
  requireAuth,
  requireRole,
  AUTH_META,
  STRICT,
} from "./auth.mjs";
import { startScheduler, schedulerStatus, runReconcileNow } from "./scheduler.mjs";
import { signMerchantPayload, verifyMerchantPayload, QR_META } from "./qr.mjs";

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

const securityHeaders = (res) => {
  res.setHeader("x-content-type-options", "nosniff");
  res.setHeader("x-frame-options", "SAMEORIGIN");
  res.setHeader("referrer-policy", "no-referrer");
  res.setHeader("permissions-policy", "camera=(self), microphone=()");
};

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

/** 当前身份（严格模式下可能为 null，写操作请用 requireAuth/requireRole） */
const authOf = (req) => resolveIdentity(req) || { id: "anonymous", email: "anonymous", full_name: "未登录", role: "guest" };

/* ------------------------------ 路由 ------------------------------ */
const server = http.createServer(async (req, res) => {
  const started = Date.now();
  securityHeaders(res);
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
        uptime: Math.round(process.uptime()),
        audit: auditStats(),
        boot: SERVER_BOOT,
        db: dbInfo(),
        channel: { pay: "POST /api/pay", refund: "POST /api/pay/refund/request", reconcile: "GET /api/admin/reconcile", qr: QR_META },
        refundRules: REFUND_RULES,
        auth: AUTH_META,
        scheduler: schedulerStatus(),
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
    if (method === "POST" && url.pathname === "/api/auth/otp") {
      const body = await readBody(req);
      return json(res, 200, sendOtp({ email: body.email }));
    }

    if (method === "POST" && url.pathname === "/api/auth/login") {
      const body = await readBody(req);

      /* 严格模式必须带验证码；宽松模式允许仅凭邮箱登录（本地自测） */
      if (STRICT || body.code) {
        return json(res, 200, loginWithOtp({ email: body.email, code: body.code }));
      }

      const user = findUserByEmail(String(body.email || "")) || findUserByEmail("demo@nms.ai");
      if (!user) return json(res, 401, { error: "user_not_found" });
      const issued = issueToken({
        id: user.id,
        email: user.email,
        role: user.role || "user",
        full_name: user.full_name || "",
      });
      return json(res, 200, {
        token: issued.token,
        expiresIn: issued.expiresIn,
        user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
      });
    }

    if (method === "POST" && url.pathname === "/api/auth/logout") {
      const raw = req.headers.authorization || "";
      const token = raw.startsWith("Bearer ") ? raw.slice(7).trim() : null;
      return json(res, 200, token ? revokeToken(token) : { ok: true });
    }

    if (method === "POST" && url.pathname === "/api/auth/session") {
      const user = resolveIdentity(req);
      return json(res, 200, { authenticated: !!user, user, auth: AUTH_META });
    }

    /* 管理接口：仅 admin / owner */
    if (url.pathname.startsWith("/api/admin/")) {
      requireRole(req, ["admin", "owner"]);
    }

    /* 支付与收款码：必须登录 */
    if (url.pathname === "/api/pay" || url.pathname.startsWith("/api/pay/") || url.pathname.startsWith("/api/qr/")) {
      requireAuth(req);
    }

    /* 实体写操作：必须登录（list/filter 虽用 POST 但属读操作，放行） */
    const isEntityRead =
      url.pathname.endsWith("/list") ||
      url.pathname.endsWith("/filter") ||
      method === "GET";
    if (
      url.pathname.startsWith("/api/entities/") &&
      !isEntityRead &&
      ["POST", "PATCH", "PUT", "DELETE"].includes(method)
    ) {
      requireAuth(req);
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
      audit({ actor: authOf(req).email, action: "admin.seed", target: "entities", payload: { inserted } });
      return json(res, 200, { inserted, counts: counts() });
    }
    if (method === "POST" && url.pathname === "/api/admin/reset") {
      const ok = resetAll();
      audit({ actor: authOf(req).email, action: "admin.reset", target: "entities", payload: { seeded: ok } });
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

    /* ---------------- 支付通道 ---------------- */
    if (method === "POST" && url.pathname === "/api/pay") {
      const body = await readBody(req);
      const user = authOf(req);
      const result = pay({ ...body, userEmail: body.userEmail || user.email });
      return json(res, result.idempotent ? 200 : 201, result);
    }

    if (method === "POST" && url.pathname === "/api/pay/refund") {
      const body = await readBody(req);
      return json(res, 200, refund(body));
    }

    /* 退款申请（小额自动通过，大额进入审批） */
    if (method === "POST" && url.pathname === "/api/pay/refund/request") {
      const body = await readBody(req);
      const user = authOf(req);
      return json(res, 200, requestRefund({ ...body, requester: body.requester || user.email }));
    }

    if (method === "GET" && url.pathname === "/api/admin/refunds") {
      return json(res, 200, {
        rules: REFUND_RULES,
        items: listRefunds({ status: url.searchParams.get("status") || undefined, limit: Number(url.searchParams.get("limit") || 20) }),
      });
    }

    if (method === "POST" && seg[0] === "api" && seg[1] === "admin" && seg[2] === "refunds" && seg[3] && seg[4]) {
      const body = await readBody(req);
      const requestId = decodeURIComponent(seg[3]);
      if (seg[4] === "approve") return json(res, 200, approveRefund({ ...body, requestId }));
      if (seg[4] === "reject") return json(res, 200, rejectRefund({ ...body, requestId }));
    }

    if (method === "POST" && url.pathname === "/api/admin/reconcile/compensate") {
      const body = await readBody(req).catch(() => ({}));
      const user = authOf(req);
      return json(res, 200, compensate({ date: body.date, actor: user.email }));
    }

    if (method === "GET" && url.pathname === "/api/admin/audit") {
      return json(res, 200, {
        stats: auditStats(),
        items: listAudit({
          limit: Number(url.searchParams.get("limit") || 30),
          action: url.searchParams.get("action") || undefined,
          actor: url.searchParams.get("actor") || undefined,
        }),
      });
    }

    if (method === "GET" && url.pathname === "/api/admin/reconcile/runs") {
      return json(res, 200, { scheduler: schedulerStatus(), runs: listReconcileRuns({ limit: Number(url.searchParams.get("limit") || 10) }) });
    }

    if (method === "POST" && url.pathname === "/api/admin/reconcile/run") {
      const body = await readBody(req).catch(() => ({}));
      return json(res, 200, body?.viaCron ? await runReconcileNow("manual") : runReconcile({ trigger: "manual" }));
    }

    if (method === "GET" && url.pathname === "/api/admin/alerts") {
      return json(res, 200, listAlerts({ limit: Number(url.searchParams.get("limit") || 20), onlyUnacked: url.searchParams.get("unacked") === "1" }));
    }

    if (method === "GET" && seg[0] === "api" && seg[1] === "pay" && seg[2]) {
      const row = getPayment(decodeURIComponent(seg[2]));
      if (!row) return json(res, 404, { error: "payment_not_found" });
      return json(res, 200, row);
    }

    if (method === "GET" && url.pathname === "/api/admin/payments") {
      const limit = Number(url.searchParams.get("limit") || 20);
      return json(res, 200, listPayments({ limit, userEmail: url.searchParams.get("user") || undefined }));
    }

    if (method === "GET" && url.pathname === "/api/admin/reconcile") {
      return json(res, 200, reconcile({ date: url.searchParams.get("date") || undefined }));
    }

    /* ---------------- 收款码签名 ---------------- */
    if (method === "POST" && url.pathname === "/api/qr/sign") {
      const body = await readBody(req);
      const merchant = body.merchantId
        ? db.prepare('SELECT * FROM "MerchantStore" WHERE id = ?').get(body.merchantId)
        : db.prepare('SELECT * FROM "MerchantStore" WHERE qr_code = ?').get(body.qrCode);
      if (!merchant) return json(res, 404, { error: "merchant_not_found" });
      const signed = signMerchantPayload(merchant, { ttlMs: body.ttlMs });
      return json(res, 200, { ...signed, merchant: { id: merchant.id, name: merchant.store_name, qr_code: merchant.qr_code } });
    }

    if (method === "POST" && url.pathname === "/api/qr/verify") {
      const body = await readBody(req);
      const result = verifyMerchantPayload(body.token);
      if (!result.valid) return json(res, 400, result);
      const merchant = db.prepare('SELECT * FROM "MerchantStore" WHERE id = ?').get(result.payload.mid);
      return json(res, 200, {
        ...result,
        merchant: merchant
          ? {
              id: merchant.id,
              name: merchant.store_name,
              category: merchant.category,
              qr_code: merchant.qr_code,
              tip_ratio: merchant.tip_ratio,
              is_verified: !!merchant.is_verified,
            }
          : null,
      });
    }

    if (method === "GET" && url.pathname === "/api/chain/verify") {
      return json(res, 200, verifyChain());
    }

    return json(res, 404, { error: "not_found", path: url.pathname });
  } catch (e) {
    const status = e.status || 500;
    if (status >= 500) console.error("[api]", e);
    return json(res, status, {
      error: e.code || e.message || "internal_error",
      detail: e.detail || undefined,
      message: e.message,
    });
  } finally {
    if (process.env.LOG !== "off") {
      console.log(`${method} ${url.pathname} ${res.statusCode} ${Date.now() - started}ms`);
    }
  }
});

/* --------------------------- 优雅关闭 --------------------------- */
let closing = false;
const shutdown = (signal) => {
  if (closing) return;
  closing = true;
  console.log(`\n[shutdown] 收到 ${signal}，停止接收新请求…`);
  server.close(() => {
    try {
      db.close();
    } catch (e) {
      /* 已关闭 */
    }
    console.log("[shutdown] 数据库已关闭，进程退出");
    process.exit(0);
  });
  setTimeout(() => {
    console.warn("[shutdown] 超时强制退出");
    process.exit(1);
  }, 8000).unref();
};
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("unhandledRejection", (err) => {
  console.error("[unhandledRejection]", err);
});

server.listen(PORT, HOST, () => {
  const info = dbInfo();
  console.log(`\n  NMS MetaLife API  →  http://${HOST}:${PORT}`);
  console.log(`  数据库            →  ${SERVER_BOOT.dbFile}`);
  console.log(`  实体              →  ${info.entities} 个 ${SERVER_BOOT.seeded ? "(已导入演示数据)" : ""}`);
  console.log(`  实体行数          →  ${Object.entries(info.counts).map(([k, v]) => `${k}:${v}`).join(" ")}`);
  console.log(`  退款风控          →  ≤${REFUND_RULES.autoApproveLimit} 自动通过 / ≤${REFUND_RULES.merchantLimit} 需确认 / 以上需管理员`);
  startScheduler();
  console.log("");
});
