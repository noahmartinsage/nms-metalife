import React, { useState } from "react";
import { Bot, Eye, KeyRound, ShieldCheck, Sparkles } from "lucide-react";
import { SectionCard } from "@/components/common/SectionCard";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const AGENTS = [
  { key: "arb", name: "套利 Agent", desc: "跨池价差扫描 · 单笔上限 2,000 NMS", allowed: true },
  { key: "risk", name: "风控 Agent", desc: "波动 > 25% 自动熔断", allowed: true },
  { key: "reinvest", name: "复投 Agent", desc: "收益自动滚入质押池", allowed: false },
  { key: "bridge", name: "跨链调度 Agent", desc: "LayerZero 通道再平衡", allowed: false },
];

const CHAINS = [
  { name: "NMS Chain", status: "主链", color: "#22c55e" },
  { name: "Ethereum", status: "已连接", color: "#818cf8" },
  { name: "Polygon", status: "已连接", color: "#a855f7" },
  { name: "BNB Chain", status: "已连接", color: "#fbbf24" },
];

/** Web4.0 Agentic 钱包（规范 8.13） */
export default function AgenticWallet() {
  const [agents, setAgents] = useState(() => Object.fromEntries(AGENTS.map((a) => [a.key, a.allowed])));

  return (
    <SectionCard
      title="Agentic Wallet"
      desc="Web4.0 · AI + ZK 框架 · Agent 一等公民"
      icon={Bot}
      actions={<Badge variant="purple">Kyber-768 KEM</Badge>}
    >
      <div className="rounded-xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 to-violet-500/5 p-3">
        <div className="flex items-center gap-2">
          <KeyRound className="h-3.5 w-3.5 text-cyan-300" />
          <p className="text-[11px] font-medium">私钥永不离开本地设备</p>
        </div>
        <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
          零知识证明验证授权，Agent 仅获得策略执行权限，<span className="text-rose-300">无资产转移权</span>。
        </p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-1.5">
        {CHAINS.map((c) => (
          <div key={c.name} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5">
            <span className="flex items-center gap-1.5 text-[10px]">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.color }} />
              {c.name}
            </span>
            <span className="text-[9px] text-muted-foreground">{c.status}</span>
          </div>
        ))}
      </div>

      <div className="mt-3 space-y-1.5">
        {AGENTS.map((a) => (
          <div key={a.key} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-2">
            <div className="min-w-0">
              <p className="flex items-center gap-1 text-[11px] font-medium">
                <Sparkles className={cn("h-3 w-3", agents[a.key] ? "text-emerald-400" : "text-muted-foreground")} />
                {a.name}
              </p>
              <p className="truncate text-[9px] text-muted-foreground">{a.desc}</p>
            </div>
            <Switch
              checked={agents[a.key]}
              onCheckedChange={(v) => {
                setAgents((s) => ({ ...s, [a.key]: v }));
                toast.message(`${a.name} 权限已${v ? "授予" : "撤销"}`);
              }}
            />
          </div>
        ))}
      </div>

      <p className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
        <ShieldCheck className="h-3 w-3 text-emerald-400" /> 所有 Agent 动作均生成 ZK 证明并上链存证
      </p>
      <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
        <Eye className="h-3 w-3" /> 自托管 · 多链 · 可审计
      </p>
    </SectionCard>
  );
}
