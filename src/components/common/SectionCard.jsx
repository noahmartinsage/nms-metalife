import React from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** 带标题的区块卡片 */
export function SectionCard({ title, desc, icon: Icon, actions, children, className, bodyClass, id }) {
  return (
    <Card id={id} className={cn("overflow-hidden", className)}>
      {(title || actions) && (
        <CardHeader className="flex-row items-center justify-between gap-2 pb-3">
          <div className="flex min-w-0 items-center gap-2.5">
            {Icon && (
              <span className="glow-cyan grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-cyan-400/25 bg-gradient-to-br from-cyan-500/25 to-violet-500/10 text-cyan-200 backdrop-blur-md">
                <Icon className="h-3.5 w-3.5" />
              </span>
            )}
            <div className="min-w-0">
              <CardTitle className="truncate text-sm">{title}</CardTitle>
              {desc && <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{desc}</p>}
            </div>
          </div>
          {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
        </CardHeader>
      )}
      <CardContent className={cn("pt-0", bodyClass)}>{children}</CardContent>
    </Card>
  );
}

/** 空状态 */
export function EmptyState({ title = "暂无数据", desc, icon: Icon = Inbox, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 px-4 py-10 text-center">
      <Icon className="h-7 w-7 text-muted-foreground/60" />
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      {desc && <p className="max-w-xs text-[11px] leading-relaxed text-muted-foreground/70">{desc}</p>}
      {action}
    </div>
  );
}

/** 键值行 */
export function DataRow({ label, value, valueClass, hint }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/5 py-2 last:border-0">
      <div className="min-w-0">
        <span className="text-xs text-muted-foreground">{label}</span>
        {hint && <p className="text-[10px] text-muted-foreground/60">{hint}</p>}
      </div>
      <span className={cn("num shrink-0 text-xs font-medium", valueClass)}>{value}</span>
    </div>
  );
}

/** 小标签块 */
export function Pill({ children, className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-muted-foreground",
        className
      )}
    >
      {children}
    </span>
  );
}

export default SectionCard;
