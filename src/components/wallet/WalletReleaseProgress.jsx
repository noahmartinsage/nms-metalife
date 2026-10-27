import React from "react";
import { Gauge, Timer, TrendingUp } from "lucide-react";
import { SectionCard } from "@/components/common/SectionCard";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { calcReleaseProgress, calcThreeDimension } from "@/lib/engine";
import { fmtNum } from "@/lib/format";

/** 9×9×9 释放进度可视化（规范 8.14） */
export default function WalletReleaseProgress({ balance }) {
  const pending = balance?.pending_release_nms || 0;
  const days = balance?.release_days || 999;
  const p = calcReleaseProgress({ pendingNms: pending, releaseDays: days, elapsedDays: Math.round(days * 0.32) });
  const dims = calcThreeDimension({
    consumption: balance?.consumption_level,
    referral: balance?.referral_level,
    nft: balance?.nft_synthesis_level,
  });

  return (
    <SectionCard
      title="9×9×9 释放进度"
      desc={`待释放 ${fmtNum(pending)} NMS · 日释放 ${fmtNum(p.dailyRelease, 4)}`}
      icon={Gauge}
      actions={<Badge variant="success">{p.speed}x 加速</Badge>}
    >
      <div className="space-y-3">
        <div>
          <div className="mb-1 flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">总释放进度</span>
            <span className="num">
              {p.percent.toFixed(1)}% · 剩余 {p.remainingDays} 天
            </span>
          </div>
          <Progress value={p.percent} className="h-2.5" />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1 text-muted-foreground">
              <TrendingUp className="h-3 w-3" /> 加速因子
            </span>
            <span className="num">{p.speed} / 32.2x</span>
          </div>
          <Progress
            value={(p.speed / 32.2) * 100}
            className="h-2"
            indicatorClassName="bg-gradient-to-r from-violet-400 to-fuchsia-400"
          />
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {[
            ["消费维度", dims.consumption, "#22c55e"],
            ["推荐维度", dims.referral, "#06b6d4"],
            ["NFT 合成", dims.nft, "#a855f7"],
          ].map(([label, value, color]) => (
            <div key={label} className="rounded-xl border border-white/10 bg-white/[0.03] p-2">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">{label}</span>
                <span className="num" style={{ color }}>
                  {value}/9
                </span>
              </div>
              <div className="mt-1.5 flex gap-0.5">
                {Array.from({ length: 9 }, (_, i) => (
                  <span
                    key={i}
                    className="h-1.5 flex-1 rounded-sm"
                    style={{ background: i < value ? color : "rgba(255,255,255,0.08)" }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2">
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Timer className="h-3 w-3" /> 总等级 {dims.total}/27 → 释放周期 {dims.days} 天
          </span>
          <span className="num text-[11px] text-emerald-300">已释放 {fmtNum(p.released)}</span>
        </div>
      </div>
    </SectionCard>
  );
}
