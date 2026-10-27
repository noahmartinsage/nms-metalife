import React, { useState } from "react";
import { ArrowRight, Coins, Combine, Landmark, Zap } from "lucide-react";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { fmtNum } from "@/lib/format";
import { calcThreeDimension } from "@/lib/engine";

/** AI 释放策略顾问（规范 8.16） */
export default function ReleaseStrategyAdvisor({ balance }) {
  const [applied, setApplied] = useState(null);
  const dims = calcThreeDimension({
    consumption: balance?.consumption_level,
    referral: balance?.referral_level,
    nft: balance?.nft_synthesis_level,
  });

  const PLANS = [
    {
      key: "P1",
      title: "晋升加速释放",
      icon: Landmark,
      desc: "提升等级直接缩短释放周期",
      detail: `当前 ${balance?.major_level || "普通用户"} · ${balance?.release_days || 999} 天 → 晋升后可缩短至 403 天`,
      effect: "-149 天",
      color: "#22c55e",
    },
    {
      key: "P2",
      title: "商城兑换消费",
      icon: Coins,
      desc: "1:1 返还同时提升消费维度",
      detail: "每 ¥10,000 消费可提升消费维度 1 级，同时获得等额 NMS 与实物 NFT",
      effect: "消费维度 +1",
      color: "#22d3ee",
    },
    {
      key: "P3",
      title: "NFT 合成维度",
      icon: Combine,
      desc: "3 合 1 提升合成维度",
      detail: `当前合成维度 ${dims.nft}/9，合成 3 次可提升 1 级，成本约 ${fmtNum(1200)} NMS`,
      effect: "NFT 维度 +1",
      color: "#a855f7",
    },
    {
      key: "P4",
      title: "DeFi 质押增值",
      icon: Zap,
      desc: "年化 12-25% + 释放加速叠加",
      detail: "质押 90 天享 16% 年化，同时释放加速因子叠加 +0.2x",
      effect: "+0.2x 加速",
      color: "#f59e0b",
    },
  ];

  return (
    <SectionCard
      title="AI 释放策略顾问"
      desc={`当前 ${dims.total}/27 级 · ${dims.days} 天周期 · 待释放 ${fmtNum(balance?.pending_release_nms || 0)} NMS`}
      icon={Zap}
      actions={<Badge variant="success">{dims.speed}x</Badge>}
    >
      <div className="space-y-1.5">
        {PLANS.map((p) => {
          const Icon = p.icon;
          const active = applied === p.key;
          return (
            <div
              key={p.key}
              className={`rounded-xl border p-2.5 transition-colors ${
                active ? "border-cyan-400/40 bg-cyan-400/[0.07]" : "border-white/5 bg-white/[0.02]"
              }`}
            >
              <div className="flex items-start gap-2">
                <span
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-lg"
                  style={{ background: `${p.color}22`, color: p.color }}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-[11px] font-medium">
                    <span className="text-muted-foreground">{p.key}</span> {p.title}
                    <span className="num text-[9px]" style={{ color: p.color }}>
                      {p.effect}
                    </span>
                  </p>
                  <p className="text-[9px] text-muted-foreground">{p.desc}</p>
                  <p className="mt-0.5 text-[9px] leading-relaxed text-muted-foreground/80">{p.detail}</p>
                </div>
                <Button
                  size="sm"
                  variant={active ? "secondary" : "outline"}
                  onClick={() => {
                    setApplied(p.key);
                    toast.success(`已采纳 ${p.key} 策略建议`);
                  }}
                >
                  {active ? "已采纳" : <ArrowRight className="h-3 w-3" />}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
