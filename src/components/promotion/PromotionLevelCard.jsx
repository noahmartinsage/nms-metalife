import React from "react";
import { Crown, Check, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { calcReleaseDays } from "@/lib/promotionData";

/** 晋升等级卡（单一真相源驱动） */
export default function PromotionLevelCard({ tier, current = false, onClick, compact = false }) {
  const speed = (999 / tier.releaseDays).toFixed(2);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative w-full overflow-hidden rounded-2xl border p-3 text-left transition-all",
        current
          ? "border-cyan-400/40 bg-gradient-to-br from-cyan-500/12 to-transparent"
          : "border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className="grid h-8 w-8 place-items-center rounded-xl text-[11px] font-bold"
            style={{ background: `${tier.color}22`, color: tier.color }}
          >
            <Crown className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold leading-tight">{tier.level}</p>
            <p className="text-[10px] text-muted-foreground">
              序号 {tier.order} · {tier.releaseDays} 天释放
            </p>
          </div>
        </div>
        {current ? (
          <Badge variant="success">
            <Check className="h-2.5 w-2.5" /> 当前
          </Badge>
        ) : (
          <span className="num rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] text-cyan-300">
            {speed}x
          </span>
        )}
      </div>

      {!compact && (
        <>
          <div className="mt-2.5 grid grid-cols-2 gap-1.5 text-[10px]">
            <div className="rounded-lg bg-black/20 px-2 py-1">
              <span className="text-muted-foreground">团队门槛 </span>
              <span className="num">{tier.team.toLocaleString("zh-CN")}</span>
            </div>
            <div className="rounded-lg bg-black/20 px-2 py-1">
              <span className="text-muted-foreground">消费门槛 </span>
              <span className="num">¥{tier.consume.toLocaleString("zh-CN")}</span>
            </div>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1">
            <span className="rounded-md bg-emerald-400/10 px-1.5 py-0.5 text-[10px] text-emerald-300">
              直推 {tier.reward}%
            </span>
            <span className="rounded-md bg-violet-400/10 px-1.5 py-0.5 text-[10px] text-violet-300">
              级差 {tier.diff}%
            </span>
          </div>
          <p className="mt-1.5 line-clamp-1 text-[10px] text-muted-foreground">{tier.priv}</p>
        </>
      )}

      {current && (
        <span className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full bg-cyan-400/10 blur-xl" />
      )}
      <span className="sr-only">
        释放天数 {calcReleaseDays(tier.order)} 天
      </span>
    </button>
  );
}

export { Zap };
