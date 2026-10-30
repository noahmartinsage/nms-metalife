import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Atom, Cpu, Globe, Orbit, Sparkles, Zap } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { StatCard } from "@/components/common/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { createPageUrl } from "@/utils";

const PHASES = [
  { name: "Phase 1 · 链上生活", pct: 100, desc: "消费即铸造、RWA 确权、NFT 合成、9×9×9 释放", done: true },
  { name: "Phase 2 · AI 自治", pct: 86, desc: "Minara-AI 策略自进化、Agent 一等公民、自动熔断", done: false },
  { name: "Phase 3 · 元世界", pct: 42, desc: "门店与资产的数字孪生、空间化社交", done: false },
  { name: "Phase 4 · 奇点", pct: 12, desc: "生态自组织、参数自调节、全球 DAO 网络", done: false },
];

export default function Singularity() {
  return (
    <div className="space-y-4">
      <PageHeader
        icon={Atom}
        title="奇点"
        subtitle="NMS 生态的终局形态：自组织、自进化、自调节的链上生活网络"
        badge={<Badge variant="purple">Phase 4</Badge>}
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard label="奇点指数" value="12" unit="/100" icon={Atom} accent="violet" />
        <StatCard label="自治参数" value="48" unit="项" icon={Cpu} accent="cyan" />
        <StatCard label="AI 决策占比" value="72" unit="%" icon={Sparkles} accent="emerald" />
        <StatCard label="全球 DAO" value="1,284" unit="个" icon={Globe} accent="amber" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <SectionCard title="演化阶段" desc="从链上生活到自组织奇点" icon={Orbit}>
          <div className="space-y-2">
            {PHASES.map((p, i) => (
              <div key={p.name} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-1.5 text-[11px] font-medium">
                    <span className="num text-[10px] text-muted-foreground">0{i + 1}</span>
                    {p.name}
                  </p>
                  <span className={`num text-[10px] ${p.done ? "text-emerald-300" : "text-cyan-300"}`}>{p.pct}%</span>
                </div>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{p.desc}</p>
                <Progress value={p.pct} className="mt-1.5 h-1" />
              </div>
            ))}
          </div>
        </SectionCard>

        <div className="space-y-4">
          <SectionCard title="奇点特征" icon={Zap}>
            {[
              ["自组织", "DAO 提案由 AI 起草并模拟执行结果"],
              ["自进化", "策略参数 200 代遗传优化"],
              ["自调节", "通胀/销毁参数按链上数据动态调整"],
              ["自审计", "ZK 证明实时验证所有资产动作"],
              ["自金融", "Agent 之间自动撮合与结算"],
            ].map(([k, v]) => (
              <div key={k} className="border-b border-white/5 py-1.5 last:border-0">
                <p className="text-[11px] font-medium text-cyan-300">{k}</p>
                <p className="text-[10px] text-muted-foreground">{v}</p>
              </div>
            ))}
          </SectionCard>

          <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-500/12 to-transparent p-4">
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-violet-300" /> 消费即分红，共同富裕
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              当生态中的资产、行为、治理全部上链并由 AI 协同，NMS 将从一个应用演进为一个可自我演化的生活网络。
            </p>
            <Link to={createPageUrl("Whitepaper")} className="mt-2 inline-flex items-center gap-1 text-[11px] text-violet-300">
              阅读白皮书 <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
        <p className="text-xs font-semibold">技术底座</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-4">
          {[
            ["PoS + AI 验证", "21,480 TPS"],
            ["ML-DSA-65", "抗量子签名"],
            ["Hypercore", "去中心化存储"],
            ["LayerZero", "12 条链互操作"],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
              <p className="text-[10px] font-medium">{k}</p>
              <p className="text-[9px] text-muted-foreground">{v}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
