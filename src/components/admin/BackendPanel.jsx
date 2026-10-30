import React, { useEffect, useState } from "react";
import { Cloud, Database, HardDrive, RefreshCw, Server, Upload, Wrench } from "lucide-react";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { API_MODE, base44, localClient } from "@/api/base44Client";
import { ENTITY_ORDER } from "@/api/schemas";
import { fmtNum } from "@/lib/format";
import payClient from "@/api/payClient";

/**
 * 数据后端面板：展示运行模式（localStorage / SQLite 服务端），
 * 支持把本地演示数据一键迁移到服务端数据库。
 */
export default function BackendPanel() {
  const [health, setHealth] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [rec, setRec] = useState(null);
  const [pendingRefunds, setPendingRefunds] = useState([]);
  const [refundRules, setRefundRules] = useState({ autoApproveLimit: 500, merchantLimit: 5000 });
  const [runs, setRuns] = useState([]);
  const [scheduler, setScheduler] = useState({});
  const [unackedAlerts, setUnackedAlerts] = useState(0);

  const isServer = API_MODE === "server";

  const probe = async () => {
    if (!isServer || typeof base44.health !== "function") return;
    try {
      const h = await base44.health();
      setHealth(h);
      setError("");
    } catch (e) {
      setHealth(null);
      setError(String(e.message || e));
    }
  };

  useEffect(() => {
    probe();
    loadChannel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadChannel = async () => {
    if (!isServer) return;
    try {
      const [refundsRes, runsRes, alertsRes] = await Promise.all([
        payClient.listRefunds(),
        payClient.reconcileRuns(5),
        payClient.alerts(true),
      ]);
      setPendingRefunds((refundsRes.items || []).filter((r) => ["pending", "pending_second"].includes(r.status)));
      if (refundsRes.rules) setRefundRules(refundsRes.rules);
      setRuns(runsRes.runs || []);
      setScheduler(runsRes.scheduler || {});
      // 用最近一次对账结果填充面板，避免首屏显示「未对账」
      const latest = runsRes.runs?.[0];
      if (latest?.payload) {
        try {
          setRec(JSON.parse(latest.payload));
        } catch (e) {
          /* 忽略解析失败 */
        }
      }
      setUnackedAlerts(Array.isArray(alertsRes) ? alertsRes.length : 0);
    } catch (e) {
      /* 通道接口不可用时静默降级 */
    }
  };

  const decideRefund = async (id, action) => {
    try {
      if (action === "approve") await payClient.approveRefund(id, "管理员审批通过");
      else await payClient.rejectRefund(id, "管理员驳回");
      toast.success(action === "approve" ? "已通过并完成退款" : "已驳回");
      await loadChannel();
      probe();
    } catch (e) {
      toast.error(`操作失败：${e.message}`);
    }
  };

  const runCompensate = async () => {
    try {
      const res = await payClient.compensate();
      if (res.compensated > 0) toast.success(`已自动补偿 ${res.compensated} 项差异`);
      else toast.message("未发现需要补偿的通道差异");
      setRec(res.after || null);
      await loadChannel();
    } catch (e) {
      toast.error(`补偿失败：${e.message}`);
    }
  };

  const runReconcile = async () => {
    if (!isServer) return;
    try {
      const data = await payClient.reconcile();
      setRec(data);
      if (data.balanced) toast.success(`对账通过：通道与订单逐笔对齐（${data.pairs} 笔）`);
      else toast.warning(`对账存在差异：${data.channelDiff}`);
    } catch (e) {
      toast.error(`对账失败：${e.message}`);
    }
  };

  const migrate = async () => {
    if (!isServer) {
      toast.error("当前为 localStorage 模式，请用 VITE_API_MODE=server 启动");
      return;
    }
    setBusy(true);
    try {
      const payload = {};
      let total = 0;
      for (const name of ENTITY_ORDER) {
        const rows = await localClient.entities[name].list("-created_date", 1000);
        if (rows?.length) {
          payload[name] = rows;
          total += rows.length;
        }
      }
      const res = await base44.bulkSeed(payload);
      toast.success(`已迁移 ${fmtNum(res?.inserted ?? total, 0)} 条记录到 SQLite`);
      probe();
    } catch (e) {
      toast.error(`迁移失败：${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  const resetServer = async () => {
    setBusy(true);
    try {
      await base44.resetDemoData();
      toast.success("服务端数据库已重置为种子数据");
      probe();
    } catch (e) {
      toast.error(`重置失败：${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  const counts = health?.db?.counts || {};

  return (
    <SectionCard
      title="数据后端"
      desc={isServer ? "SQLite 持久化（node:sqlite）· 可迁移至 Cloudflare D1" : "localStorage 模拟层 · 离线可用"}
      icon={isServer ? Server : HardDrive}
      actions={<Badge variant={isServer ? "success" : "outline"}>{isServer ? "server" : "local"}</Badge>}
    >
      <div className="grid grid-cols-3 gap-1.5 text-center">
        {[
          ["运行模式", isServer ? "SQLite" : "LocalStorage", isServer ? "text-emerald-300" : "text-cyan-300"],
          ["实体数", health?.db?.entities ?? ENTITY_ORDER.length, "text-violet-300"],
          ["记录总数", Object.values(counts).reduce((s, v) => s + v, 0), "text-amber-300"],
        ].map(([k, v, c]) => (
          <div key={k} className="rounded-lg border border-white/10 bg-white/[0.03] py-1.5">
            <p className={`num text-[11px] font-semibold ${c}`}>{typeof v === "number" ? fmtNum(v, 0) : v}</p>
            <p className="text-[9px] text-muted-foreground">{k}</p>
          </div>
        ))}
      </div>

      {isServer && (
        <div className="mt-2 rounded-xl border border-white/10 bg-black/20 p-2.5">
          <p className="flex items-center gap-1 text-[10px] font-medium">
            <Database className="h-3 w-3 text-cyan-300" /> 服务端状态
          </p>
          {health ? (
            <>
              <p className="num mt-1 break-all text-[9px] text-muted-foreground">{health.db?.file}</p>
              <div className="mt-1 grid grid-cols-2 gap-x-2 gap-y-0.5">
                {Object.entries(counts).slice(0, 8).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-[9px]">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="num">{v}</span>
                  </div>
                ))}
              </div>
              <p className="mt-1 text-[9px] text-emerald-300">
                已连接 · v{health.version} · {new Date(health.time).toLocaleTimeString("zh-CN", { hour12: false })}
              </p>
            </>
          ) : (
            <p className="mt-1 text-[9px] text-rose-300">
              {error || "未连接"} · 请先运行 npm run server
            </p>
          )}
        </div>
      )}

      {!isServer && (
        <div className="mt-2 rounded-xl border border-amber-400/20 bg-amber-400/5 p-2.5 text-[9px] leading-relaxed text-amber-200/90">
          当前数据存在浏览器 localStorage。要启用真正的服务端数据库：
          <span className="num ml-1 rounded bg-black/30 px-1">npm run server</span>
          <span className="num ml-1 rounded bg-black/30 px-1">VITE_API_MODE=server npm run dev</span>
        </div>
      )}

      {isServer && (
        <div className="mt-2 rounded-xl border border-white/10 bg-black/20 p-2.5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-medium">支付通道对账</p>
            {rec ? (
              <Badge variant={rec.balanced ? "success" : "danger"}>{rec.balanced ? "账平" : "有差异"}</Badge>
            ) : (
              <Badge variant="outline">未对账</Badge>
            )}
          </div>
          {rec ? (
            <div className="mt-1 space-y-0.5 text-[9px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">订单 / 交易 / 通道</span>
                <span className="num">
                  {rec.orders.count} / {rec.transactions.count} / {rec.channel.count} 笔
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">通道 vs 订单差额</span>
                <span className={rec.channelDiff === 0 ? "num text-emerald-300" : "num text-rose-300"}>
                  {rec.channelDiff}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">历史未匹配订单</span>
                <span className="num text-muted-foreground">{rec.legacyOrphans ?? 0} 笔</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">账本哈希链</span>
                <span className={rec.chain?.ok ? "text-emerald-300" : "text-rose-300"}>
                  {rec.chain?.ok ? `完整（${rec.chain.length} 条）` : "已断裂"}
                </span>
              </div>
            </div>
          ) : (
            <p className="mt-1 text-[9px] text-muted-foreground">校验 PaymentOrder / Transaction / payments 三方汇总</p>
          )}
          <Button size="sm" variant="outline" className="mt-1.5 w-full" onClick={runReconcile}>
            <RefreshCw className="h-3 w-3" /> 立即对账
          </Button>
        </div>
      )}

      <div className="mt-2 grid grid-cols-2 gap-1.5">
        <Button size="sm" variant="outline" onClick={migrate} disabled={busy || !isServer}>
          <Upload className="h-3 w-3" /> 迁移本地数据
        </Button>
        <Button size="sm" variant="ghost" onClick={resetServer} disabled={busy || !isServer}>
          <RefreshCw className="h-3 w-3" /> 重置服务端
        </Button>
      </div>

      {isServer && (
        <>
          {/* 退款审批 */}
          <div className="mt-2 rounded-xl border border-white/10 bg-black/20 p-2.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-medium">退款审批</p>
              <Badge variant={pendingRefunds.length ? "warning" : "outline"}>{pendingRefunds.length} 待审</Badge>
            </div>
            <p className="mt-0.5 text-[9px] text-muted-foreground">
              风控：≤{refundRules.autoApproveLimit} 自动通过 · ≤{refundRules.merchantLimit} 需确认 · 以上需管理员
            </p>
            {pendingRefunds.length === 0 ? (
              <p className="mt-1.5 rounded-lg bg-white/[0.02] px-2 py-1.5 text-[9px] text-muted-foreground">
                暂无待审批退款
              </p>
            ) : (
              <div className="mt-1.5 space-y-1">
                {pendingRefunds.slice(0, 3).map((r) => (
                  <div key={r.id} className="rounded-lg bg-white/[0.03] px-2 py-1.5">
                    <div className="flex items-center justify-between">
                      <span className="num text-[9px]">{r.order_no}</span>
                      <span className="num text-[10px] font-medium text-amber-300">{fmtNum(r.amount)}</span>
                    </div>
                    <p className="mt-0.5 truncate text-[8px] text-muted-foreground">
                      {r.merchant_name} · {r.risk_level === "high" ? "高风险" : "需确认"} · {r.reason || "未填原因"}
                    </p>
                    {(r.required_approvals || 1) > 1 && (
                      <p className="mt-0.5 text-[8px] text-amber-300">
                        双人复核 {r.approvals || 0}/{r.required_approvals}
                        {r.status === "pending_second" ? " · 待第二人" : ""}
                      </p>
                    )}
                    <div className="mt-1 flex gap-1">
                      <Button size="sm" variant="success" className="h-6 flex-1 text-[9px]" onClick={() => decideRefund(r.id, "approve")}>
                        通过
                      </Button>
                      <Button size="sm" variant="ghost" className="h-6 flex-1 text-[9px]" onClick={() => decideRefund(r.id, "reject")}>
                        驳回
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 对账历史 */}
          <div className="mt-2 rounded-xl border border-white/10 bg-black/20 p-2.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-medium">对账任务</p>
              <Badge variant={unackedAlerts > 0 ? "danger" : "success"}>
                {unackedAlerts > 0 ? `${unackedAlerts} 条告警` : "无告警"}
              </Badge>
            </div>
            <p className="mt-0.5 text-[9px] text-muted-foreground">
              每日 {String(scheduler.hour ?? 0).padStart(2, "0")}:00 自动执行
              {scheduler.nextRunAt ? ` · 下次 ${new Date(scheduler.nextRunAt).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}` : ""}
            </p>
            <div className="mt-1 space-y-0.5">
              {runs.length === 0 ? (
                <p className="rounded-lg bg-white/[0.02] px-2 py-1.5 text-[9px] text-muted-foreground">尚无对账记录</p>
              ) : (
                runs.slice(0, 3).map((r) => (
                  <div key={r.id} className="flex items-center justify-between rounded bg-white/[0.02] px-2 py-1 text-[9px]">
                    <span className="num text-muted-foreground">{r.run_date}</span>
                    <span className="text-muted-foreground">{r.trigger_type === "cron" ? "自动" : "手动"}</span>
                    <span className={r.balanced ? "text-emerald-300" : "text-rose-300"}>
                      {r.balanced ? "账平" : `差 ${r.channel_diff}`}
                    </span>
                    <span className={r.chain_ok ? "text-emerald-300" : "text-rose-300"}>链{r.chain_ok ? "✓" : "✗"}</span>
                  </div>
                ))
              )}
            </div>
            <Button size="sm" variant="outline" className="mt-1.5 w-full" onClick={runCompensate}>
              <Wrench className="h-3 w-3" /> 自动补偿差异
            </Button>
          </div>
        </>
      )}

      <div className="mt-2 flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-2 py-1.5 text-[9px]">
        <span className="flex items-center gap-1 text-muted-foreground">
          <Cloud className="h-2.5 w-2.5" /> 部署目标：Cloudflare Workers + D1（同一套 SQL 方言）
        </span>
        <span className="num text-muted-foreground">:8787</span>
      </div>
    </SectionCard>
  );
}
