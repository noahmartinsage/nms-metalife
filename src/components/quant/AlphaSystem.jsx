import React, { useMemo } from "react";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip } from "recharts";
import { Target } from "lucide-react";
import { SectionCard } from "@/components/common/SectionCard";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

/** 六因子 Alpha 模型（规范 8.6） */
export const ALPHA_FACTORS = [
  { key: "momentum", label: "动量", weight: 25, score: 82 },
  { key: "meanRev", label: "均值回归", weight: 20, score: 64 },
  { key: "liquidity", label: "流动性", weight: 15, score: 76 },
  { key: "volatility", label: "波动率", weight: 15, score: 58 },
  { key: "sentiment", label: "链上情绪", weight: 15, score: 71 },
  { key: "crossSpread", label: "跨链价差", weight: 10, score: 88 },
];

export default function AlphaSystem() {
  const composite = useMemo(
    () => ALPHA_FACTORS.reduce((s, f) => s + (f.score * f.weight) / 100, 0),
    []
  );

  const radar = ALPHA_FACTORS.map((f) => ({ factor: f.label, value: f.score }));

  return (
    <SectionCard
      title="Alpha 六因子系统"
      desc="动量 25% · 均值回归 20% · 流动性 15% · 波动率 15% · 情绪 15% · 跨链价差 10%"
      icon={Target}
      actions={
        <Badge variant={composite > 75 ? "success" : "warning"}>综合 {composite.toFixed(1)}</Badge>
      }
    >
      <div className="grid gap-2 sm:grid-cols-[160px_1fr]">
        <div className="h-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radar} outerRadius="72%">
              <PolarGrid stroke="rgba(148,163,184,0.2)" />
              <PolarAngleAxis dataKey="factor" tick={{ fontSize: 9, fill: "#94a3b8" }} />
              <Radar dataKey="value" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.28} />
              <Tooltip
                contentStyle={{
                  background: "rgba(13,21,38,0.96)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 10,
                  fontSize: 11,
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-1.5">
          {ALPHA_FACTORS.map((f) => (
            <div key={f.key}>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">
                  {f.label} <span className="text-muted-foreground/60">({f.weight}%)</span>
                </span>
                <span className="num">{f.score}</span>
              </div>
              <Progress value={f.score} className="mt-0.5 h-1" />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-[10px] leading-relaxed text-muted-foreground">
        综合评分 {composite.toFixed(1)}/100 · 建议仓位{" "}
        <span className="text-emerald-300">{composite > 75 ? "60%" : composite > 60 ? "40%" : "20%"}</span>
        ，止损线 -3.5%，最大回撤阈值 -12%。
      </div>
    </SectionCard>
  );
}
