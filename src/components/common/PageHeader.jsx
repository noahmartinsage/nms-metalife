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
      className={cn("mb-5 flex flex-wrap items-start justify-between gap-3", className)}
    >
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-cyan-500/20 to-violet-500/10 text-cyan-300">
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
            {badge}
          </div>
          {subtitle && <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </motion.header>
  );
}
