import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/** 页面标题区 */
export default function PageHeader({ icon: Icon, title, subtitle, badge, actions, className }) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("relative mb-5 flex flex-wrap items-start justify-between gap-3", className)}
    >
      {/* 彩色氛围光 */}
      <span className="pointer-events-none absolute -left-6 -top-10 -z-10 h-32 w-32 rounded-full bg-cyan-500/20 blur-3xl" />
      <span className="pointer-events-none absolute left-24 -top-8 -z-10 h-28 w-28 rounded-full bg-violet-500/20 blur-3xl" />

      <div className="flex items-start gap-3">
        {Icon && (
          <div className="glow-cyan grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/25 via-sky-500/10 to-violet-500/15 text-cyan-200 backdrop-blur-xl">
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="bg-gradient-to-r from-white via-white to-cyan-200 bg-clip-text text-xl font-semibold tracking-tight text-transparent sm:text-2xl">
              {title}
            </h1>
            {badge}
          </div>
          {subtitle && <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </motion.header>
  );
}
