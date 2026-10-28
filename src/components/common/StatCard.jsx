import React from "react";
import { motion } from "framer-motion";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const ACCENTS = {
  cyan: {
    chip: "from-cyan-500/30 to-sky-500/10 text-cyan-200 border-cyan-400/30",
    blob: "bg-cyan-500/25",
    glow: "glow-cyan",
    bar: "from-cyan-400 to-sky-400",
  },
  emerald: {
    chip: "from-emerald-500/30 to-teal-500/10 text-emerald-200 border-emerald-400/30",
    blob: "bg-emerald-500/25",
    glow: "glow-emerald",
    bar: "from-emerald-400 to-teal-400",
  },
  violet: {
    chip: "from-violet-500/30 to-fuchsia-500/10 text-violet-200 border-violet-400/30",
    blob: "bg-violet-500/25",
    glow: "glow-violet",
    bar: "from-violet-400 to-fuchsia-400",
  },
  amber: {
    chip: "from-amber-500/30 to-orange-500/10 text-amber-200 border-amber-400/30",
    blob: "bg-amber-500/25",
    glow: "glow-amber",
    bar: "from-amber-400 to-orange-400",
  },
  rose: {
    chip: "from-rose-500/30 to-pink-500/10 text-rose-200 border-rose-400/30",
    blob: "bg-rose-500/25",
    glow: "glow-rose",
    bar: "from-rose-400 to-pink-400",
  },
  slate: {
    chip: "from-slate-500/25 to-slate-500/10 text-slate-200 border-white/15",
    blob: "bg-slate-500/20",
    glow: "",
    bar: "from-slate-400 to-slate-500",
  },
};

/** 指标卡（毛玻璃 + 彩色光晕） */
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
  const a = ACCENTS[accent] || ACCENTS.cyan;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      onClick={onClick}
      className={cn(
        "glass glass-hover group relative overflow-hidden rounded-2xl p-4",
        onClick && "cursor-pointer",
        className
      )}
    >
      <span
        className={cn(
          "pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full blur-3xl opacity-60 transition-opacity duration-300 group-hover:opacity-90",
          a.blob
        )}
      />
      <div className="relative flex items-start justify-between gap-2">
        <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
        {Icon && (
          <span
            className={cn(
              "grid h-8 w-8 place-items-center rounded-xl border bg-gradient-to-br backdrop-blur-md transition-transform duration-300 group-hover:scale-105",
              a.chip,
              a.glow
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <div className="relative mt-2 flex flex-wrap items-baseline gap-x-1 gap-y-0">
        <span className="num whitespace-nowrap text-lg font-semibold tracking-tight text-white sm:text-xl">
          {value}
        </span>
        {unit && <span className="shrink-0 whitespace-nowrap text-[11px] text-muted-foreground">{unit}</span>}
      </div>
      <div className="relative mt-1 flex items-center gap-1.5">
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

      <span
        className={cn(
          "pointer-events-none absolute inset-x-4 bottom-0 h-px bg-gradient-to-r opacity-40 transition-opacity duration-300 group-hover:opacity-90",
          a.bar
        )}
      />
    </motion.div>
  );
}

export default StatCard;
