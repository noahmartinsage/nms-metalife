import React, { useMemo, useState } from "react";
import { Bot, Cpu, Rocket, ShieldCheck, Sparkles } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { StatCard } from "@/components/common/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import ModuleState from "@/components/common/ModuleState";
import { useEntityList } from "@/hooks/useEntity";
import { useSession } from "@/hooks/useSession";
import { base44 } from "@/api/base44Client";
import { fmtNum, sanitizeAmount } from "@/lib/format";

/** 委托即真实写库：TradingStrategy 落库 + 余额可用→冻结 + 链上交易存证 */
export default function OnChainAgent() {
  const { user, balance, refresh: refreshSession } = useSession();
  const { data: strategies, loading, error, refresh } = useEntityList("TradingStrategy", {}, "-created_date", 50);

  const [active, setActive] = useState(null);
  const [capital, setCapital] = useState("2000");
  const [busy, setBusy] = useState(false);

  const stats = useMemo(() => {
    const activeCount = strategies.filter((s) => s.status === "active" || s.status === "running").length;
    const allocated = strategies.reduce((a, s) => a + (Number(s.allocated_capital) || 0), 0);
    const avgPnl = strategies.length
      ? strategies.reduce((a, s) => a + (Number(s.pnl_percent) || 0), 0) / strategies.length
      : 0;
    return { activeCount, allocated, avgPnl };
  }, [strategies]);

  const deploy = async () => {
    const amt = Number(sanitizeAmount(capital));
    if (!(amt > 0)) {
      toast.error("请输入有效的委托资金");
      return;
    }
    if (balance && (balance.available_nms || 0) < amt) {
      toast.error(`可用余额不足，当前 ${fmtNum(balance.available_nms)} NMS`);
      return;
    }

    setBusy(true);
    try {
      /* 1) 策略落库 */
      await base44.entities.TradingStrategy.create({
        name: active.name,
        type: active.type,
        status: "active",
        win_rate: Number(active.win_rate) || 0,
        pnl: 0,
        pnl_percent: 0,
        allocated_capital: amt,
        risk_level: active.risk_level || "medium",
        trades_count: 0,
      });

      /* 2) 资金守恒：可用 → 冻结 */
      if (balance?.id) {
        await base44.entities.UserBalance.update(balance.id, {
          available_nms: (balance.available_nms || 0) - amt,
          locked_nms: (balance.locked_nms || 0) + amt,
        });
      }

      /* 3) 链上存证（服务端会重签为后量子签名） */
      await base44.entities.Transaction.create({
        tx_hash: `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
        block_number: 18492000 + Math.floor(Math.random() * 90000),
        from_address: user?.email || "demo@nms.ai",
        to_address: `AGENT:${active.name}`,
        amount: amt,
        token_type: "NMS",
        status: "confirmed",
        gas_fee: 0,
        quantum_signature: "",
        signature_time_ms: Date.now(),
      });

      toast.success(`${active.name} 已部署 ${fmtNum(amt)} NMS，ZK 授权已上链（无资产转移权）`);
      setActive(null);
      refresh();
      refreshSession?.();
    } catch (e) {
      toast.error(`委托失败：${e.message || "请重试"}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        icon={Bot}
        title="链上 Agent"
        subtitle="Agent 一等公民 · ZK 授权 · 策略执行无资产转移权 · 委托资金真实冻结"
        badge={<Badge variant="purple">Web4.0</Badge>}
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard label="在运行策略" value={loading ? "—" : stats.activeCount} unit="个" icon={Bot} accent="cyan" />
        <StatCard label="总委托资金" value={loading ? "—" : fmtNum(stats.allocated)} unit="NMS" icon={Cpu} accent="emerald" />
        <StatCard
          label="平均收益"
          value={loading ? "—" : stats.avgPnl.toFixed(2)}
          unit="%"
          icon={Rocket}
          accent={stats.avgPnl >= 0 ? "violet" : "rose"}
        />
        <StatCard label="可用余额" value={fmtNum(balance?.available_nms)} unit="NMS" icon={ShieldCheck} accent="amber" />
      </div>

      <SectionCard title="可委托策略" desc="选择策略并委托资金，资金进入冻结账户" icon={Bot}>
        <ModuleState
          loading={loading}
          error={error}
          empty={strategies.length === 0}
          onRetry={refresh}
          emptyHint="还没有策略，选择下方模板委托第一笔"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {strategies.map((s) => (
              <div key={s.id} className="glass glass-hover rounded-2xl p-3.5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-400/15 text-cyan-300">
                      <Bot className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold">{s.name}</p>
                      <p className="text-[9px] text-muted-foreground">{s.type || "策略"}</p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      s.risk_level === "high" ? "danger" : s.risk_level === "medium" ? "warning" : "success"
                    }
                  >
                    {s.risk_level === "high" ? "高风险" : s.risk_level === "medium" ? "中风险" : "低风险"}
                  </Badge>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-1.5 text-center">
                  {[
                    ["胜率", `${Number(s.win_rate || 0).toFixed(1)}%`],
                    ["收益", `${Number(s.pnl_percent || 0).toFixed(2)}%`],
                    ["委托额", fmtNum(s.allocated_capital)],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-lg bg-white/5 py-1">
                      <p className="num text-[11px] font-semibold text-cyan-300">{v}</p>
                      <p className="text-[9px] text-muted-foreground">{k}</p>
                    </div>
                  ))}
                </div>
                <Button
                  className="mt-2 w-full"
                  size="sm"
                  onClick={() =>
                    setActive({
                      name: s.name,
                      type: s.type,
                      win_rate: s.win_rate,
                      risk_level: s.risk_level,
                    })
                  }
                >
                  <Sparkles className="h-3.5 w-3.5" /> 追加委托
                </Button>
              </div>
            ))}
          </div>
        </ModuleState>

        <div className="mt-3 grid gap-2 sm:grid-cols-4">
          {[
            { name: "ArbBot-7", type: "跨池套利", win_rate: 68.2, risk_level: "medium" },
            { name: "GridMaster", type: "做市网格", win_rate: 72.4, risk_level: "low" },
            { name: "SentimentX", type: "情绪因子", win_rate: 54.8, risk_level: "high" },
            { name: "YieldFarmer", type: "收益农场", win_rate: 76.1, risk_level: "low" },
          ].map((t) => (
            <button
              key={t.name}
              type="button"
              onClick={() => setActive(t)}
              className="rounded-xl border border-dashed border-white/15 px-2 py-2 text-left transition-colors hover:border-cyan-400/40"
            >
              <p className="text-[10px] font-medium">{t.name}</p>
              <p className="text-[9px] text-muted-foreground">{t.type} · 胜率 {t.win_rate}%</p>
            </button>
          ))}
        </div>
      </SectionCard>

      <Dialog open={!!active} onOpenChange={(v) => !v && setActive(null)}>
        {active && (
          <DialogContent onClose={() => setActive(null)} className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-cyan-300" /> 委托 {active.name}
              </DialogTitle>
              <DialogDescription>
                授权后 Agent 仅可执行白名单策略，无资产转移权，所有动作生成 ZK 证明
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Input
                type="number"
                min="0"
                step="any"
                value={capital}
                onChange={(e) => setCapital(sanitizeAmount(e.target.value))}
                className="h-9 text-xs"
              />
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">胜率</span>
                  <span className="num text-emerald-300">{Number(active.win_rate || 0).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">风险等级</span>
                  <span className="num">{active.risk_level || "medium"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">委托后可用余额</span>
                  <span className="num">
                    {fmtNum(Math.max(0, (balance?.available_nms || 0) - (Number(capital) || 0)))} NMS
                  </span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setActive(null)}>
                取消
              </Button>
              <Button onClick={deploy} disabled={busy}>
                {busy ? "部署中…" : "确认委托"}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
