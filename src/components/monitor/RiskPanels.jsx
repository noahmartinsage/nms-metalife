import React, { useState } from "react";
import { Cpu, Play, ShieldCheck, Zap } from "lucide-react";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";

/** 量子风险仪表盘 */
export function QuantumRiskDashboard() {
  const score = 18;
  const circumference = 2 * Math.PI * 42;
  const dash = (score / 100) * circumference;

  return (
    <SectionCard title="量子风险仪表盘" desc="Kyber-768 KEM · Dilithium 签名" icon={Cpu}>
      <div className="flex items-center gap-4">
        <div className="relative h-[108px] w-[108px] shrink-0">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="#22d3ee"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference}`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="num text-xl font-bold text-cyan-300">{score}</span>
            <span className="text-[9px] text-muted-foreground">风险评分</span>
          </div>
        </div>

        <div className="flex-1 space-y-1.5">
          {[
            ["密钥强度", 98],
            ["签名覆盖率", 100],
            ["后量子迁移", 86],
            ["密钥轮换", 92],
          ].map(([k, v]) => (
            <div key={k}>
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">{k}</span>
                <span className="num">{v}%</span>
              </div>
              <Progress value={v} className="mt-0.5 h-1" />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1 rounded-lg border border-emerald-400/20 bg-emerald-400/5 px-2 py-1.5">
        <ShieldCheck className="h-3 w-3 text-emerald-400" />
        <p className="text-[10px] text-muted-foreground">
          抗量子等级 <span className="text-emerald-300">Level 5</span> · 上次密钥轮换 8 小时前
        </p>
      </div>
    </SectionCard>
  );
}

const RULES = [
  { key: "vol", name: "波动率 > 25% → 暂停跨链", on: true },
  { key: "pool", name: "矿池风险 > 75 → 撤回安全池", on: true },
  { key: "audit", name: "审计告警 → 冻结资产", on: true },
  { key: "bridge", name: "桥延迟 > 30min → 暂停通道", on: false },
];

/** 自动风险执行器 */
export function AutoRiskExecutor() {
  const [rules, setRules] = useState(() => Object.fromEntries(RULES.map((r) => [r.key, r.on])));
  const [log, setLog] = useState([
    { t: "11:42", msg: "检测到 NMS/USDT 波动 18.4%，未触发规则" },
    { t: "10:15", msg: "RWAOwnership.sol 出现 1 项中危提示，已通知审计" },
  ]);
  const [busy, setBusy] = useState(false);

  const execute = () => {
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      setLog((l) => [
        {
          t: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false }),
          msg: "手动执行风控检查：全部规则通过，无资产被冻结",
        },
        ...l,
      ]);
      toast.success("风控检查完成，未发现异常");
    }, 700);
  };

  return (
    <SectionCard
      title="自动风险执行器"
      desc="规则引擎 · 命中即执行链上动作"
      icon={Zap}
      actions={<Badge variant="success">{Object.values(rules).filter(Boolean).length} 条生效</Badge>}
    >
      <div className="space-y-1.5">
        {RULES.map((r) => (
          <div key={r.key} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-1.5">
            <span className="text-[10px] text-muted-foreground">{r.name}</span>
            <Switch
              checked={rules[r.key]}
              onCheckedChange={(v) => {
                setRules((s) => ({ ...s, [r.key]: v }));
                toast.message(`规则已${v ? "启用" : "停用"}`);
              }}
            />
          </div>
        ))}
      </div>

      <Button className="mt-2 w-full" size="sm" variant="outline" onClick={execute} disabled={busy}>
        <Play className="h-3.5 w-3.5" /> {busy ? "执行中…" : "立即执行风控检查"}
      </Button>

      <div className="mt-2 max-h-28 space-y-1 overflow-y-auto">
        {log.map((l, i) => (
          <div key={i} className="flex gap-2 rounded bg-black/20 px-2 py-1 text-[9px]">
            <span className="num shrink-0 text-muted-foreground">{l.t}</span>
            <span className="text-muted-foreground">{l.msg}</span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
