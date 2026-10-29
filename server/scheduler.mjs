/**
 * 每日对账定时任务
 *
 * 默认每天 00:00（本地时区）执行一次对账并落库，异常写入 alerts 表。
 * 可用环境变量调整：
 *   RECONCILE_HOUR=0        执行小时（0-23）
 *   RECONCILE_ON_BOOT=1     启动时先跑一次
 *   ALERT_WEBHOOK=<url>     异常时 POST 告警（企业微信/飞书/Slack 通用 JSON）
 */
import { runReconcile, alert } from "./payments.mjs";

const HOUR = Math.min(23, Math.max(0, Number(process.env.RECONCILE_HOUR ?? 0)));
let timer = null;
let lastRun = null;
let nextRunAt = null;

function msUntilNext(hour = HOUR) {
  const now = new Date();
  const next = new Date(now);
  next.setHours(hour, 0, 0, 0);
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
  return { delay: next.getTime() - now.getTime(), at: next };
}

async function notify(text, payload) {
  const url = process.env.ALERT_WEBHOOK;
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ msgtype: "text", text: { content: text }, ...payload }),
    });
  } catch (e) {
    console.warn("[cron] 告警推送失败：", e.message);
  }
}

async function execute(trigger = "cron") {
  try {
    const res = runReconcile({ trigger });
    lastRun = { at: new Date().toISOString(), date: res.date, balanced: res.balanced, channelDiff: res.channelDiff };
    console.log(
      `[cron] 对账完成 ${res.date} · balanced=${res.balanced} · channelDiff=${res.channelDiff} · 链${res.chain?.ok ? "完整" : "断裂"}`
    );
    if (!res.balanced || !res.chain?.ok) {
      await notify(
        `【NMS 对账告警】${res.date} 通道差额 ${res.channelDiff}，孤立通道单 ${res.orphanPayments.length}，哈希链${res.chain?.ok ? "正常" : "断裂"}`
      );
    }
    return res;
  } catch (e) {
    alert({ level: "error", source: "cron", message: `定时对账失败：${e.message}` });
    await notify(`【NMS 对账任务失败】${e.message}`);
    return null;
  }
}

export function startScheduler() {
  const { delay, at } = msUntilNext();
  nextRunAt = at.toISOString();
  console.log(`[cron] 每日对账已排程：${at.toLocaleString("zh-CN")}（${Math.round(delay / 3600000)}h 后）`);

  const loop = async () => {
    await execute("cron");
    const next = msUntilNext();
    nextRunAt = next.at.toISOString();
    timer = setTimeout(loop, next.delay);
  };

  timer = setTimeout(loop, delay);

  if (process.env.RECONCILE_ON_BOOT === "1") {
    execute("boot");
  }

  return { nextRunAt, hour: HOUR };
}

export function stopScheduler() {
  if (timer) clearTimeout(timer);
  timer = null;
}

export function schedulerStatus() {
  return { hour: HOUR, nextRunAt, lastRun, webhook: !!process.env.ALERT_WEBHOOK };
}

export { execute as runReconcileNow };
