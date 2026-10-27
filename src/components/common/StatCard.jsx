import React from "react";
import { motion } from "framer-motion";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

/** 指标卡 */
export function StatCard({
  label,
  value,
  unit,
  sub,
  icon: Icon,
  trend,
  accent = "cyan",
  delay = 0,
  className,
  onClick,
}) {
  const accents = {
    cyan: "from-cyan-500/20 to-sky-500/5 text-cyan-300 border-cyan-400/20",
    emerald: "from-emerald-500/20 to-teal-500/5 text-emerald-300 border-emerald-400/20",
    violet: "from-violet-500/20 to-fuchsia-500/5 text-violet-300 border-violet-400/20",
    amber: "from-amber-500/20 to-orange-500/5 text-amber-300 border-amber-400/20",
    rose: "from-rose-500/20 to-pink-500/5 text-rose-300 border-rose-400/20",
    slate: "from-slate-500/20 to-slate-500/5 text-slate-300 border-white/10",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] p-4 backdrop-blur-xl",
        onClick && "cursor-pointer transition-colors hover:border-white/20 hover:bg-white/[0.06]",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
        {Icon && (
          <span
            className={cn(
              "grid h-8 w-8 place-items-center rounded-xl border bg-gradient-to-br",
              accents[accent] || accents.cyan
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-baseline gap-x-1 gap-y-0">
        <span className="num whitespace-nowrap text-lg font-semibold tracking-tight sm:text-xl">{value}</span>
        {unit && <span className="shrink-0 whitespace-nowrap text-[11px] text-muted-foreground">{unit}</span>}
      </div>
      <div className="mt-1 flex items-center gap-1.5">
        {typeof trend === "number" && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-[11px] font-medium",
              trend >= 0 ? "text-emerald-400" : "text-rose-400"
            )}
          >
            {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(trend).toFixed(2)}%
          </span>
        )}
        {sub && <span className="truncate text-[11px] text-muted-foreground">{sub}</span>}
      </div>
    </motion.div>
  );
}

export default StatCard;
