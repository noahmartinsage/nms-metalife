import React, { useState } from "react";
import { Bot, Cpu, Rocket, ShieldCheck, Sparkles } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { StatCard } from "@/components/common/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { fmtNum } from "@/lib/format";

const AGENTS = [
  { name: "ArbBot-7", type: "跨池套利", apy: 18.6, fee: 10, users: 1284, risk: "中", color: "#22d3ee" },
  { name: "GridMaster", type: "做市网格", apy: 12.4, fee: 8, users: 862, risk: "低", color: "#34d399" },
  { name: "SentimentX", type: "情绪因子", apy: 24.8, fee: 15, users: 426, risk: "高", color: "#fb7185" },
  { name: "YieldFarmer", type: "收益农场", apy: 9.6, fee: 5, users: 2140, risk: "低", color: "#a78bfa" },
];

export default function OnChainAgent() {
  const [active, setActive] = useState(null);
  const [capital, setCapital] = useState("2000");
  const [busy, setBusy] = useState(false);

  const deploy = () => {
    if (!(Number(capital) > 0)) {
      toast.error("请输入委托资金");
      return;
    }
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      toast.success(`${active.name} 已部署，ZK 授权已上链（无资产转移权）`);
      setActive(null);
    }, 700);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        icon={Bot}
        title="链上 Agent"
        subtitle="Agent 一等公民 · ZK 授权 · 策略执行无资产转移权"
        badge={<Badge variant="purple">Web4.0</Badge>}
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard label="在运行 Agent" value={AGENTS.length} unit="个" icon={Bot} accent="cyan" />
        <StatCard label="总委托资金" value={fmtNum(2_860_000)} unit="NMS" icon={Cpu} accent="emerald" />
        <StatCard label="平均年化" value="16.4" unit="%" icon={Rocket} accent="violet" />
        <StatCard label="安全事件" value="0" unit="起" icon={ShieldCheck} accent="amber" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {AGENTS.map((a) => (
          <div key={a.name} className="rounded-2xl border border-white/10 bg-white/[0.035] p-3.5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="grid h-9 w-9 place-items-center rounded-xl"
                  style={{ background: `${a.color}22`, color: a.color }}
                >
                  <Bot className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs font-semibold">{a.name}</p>
                  <p className="text-[9px] text-muted-foreground">{a.type}</p>
                </div>
              </div>
              <Badge variant={a.risk === "高" ? "danger" : a.risk === "中" ? "warning" : "success"}>
                {a.risk}风险
              </Badge>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-1.5 text-center">
              {[
                ["年化", `${a.apy}%`],
                ["业绩费", `${a.fee}%`],
                ["委托人数", a.users],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg bg-white/5 py-1">
                  <p className="num text-[11px] font-semibold text-cyan-300">{v}</p>
                  <p className="text-[9px] text-muted-foreground">{k}</p>
                </div>
              ))}
            </div>
            <Button className="mt-2 w-full" size="sm" onClick={() => setActive(a)}>
              <Sparkles className="h-3.5 w-3.5" /> 委托资金
            </Button>
          </div>
        ))}
      </div>

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
                onChange={(e) => {
                  const v = e.target.value;
                  setCapital(parseFloat(v) < 0 ? "0" : v);
                }}
                className="h-9 text-xs"
              />
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">预期年化</span>
                  <span className="num text-emerald-300">{active.apy}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">业绩费</span>
                  <span className="num">{active.fee}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">预估年收益</span>
                  <span className="num">
                    {fmtNum(((Number(capital) || 0) * active.apy) / 100 * (1 - active.fee / 100))} NMS
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
