import React from "react";
import { AlertTriangle, Inbox, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/** 骨架屏：加载态 */
export function SkeletonRows({ rows = 4 }) {
  return (
    <div className="space-y-1.5" aria-busy="true" aria-live="polite">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-2.5 py-2"
          style={{ opacity: 1 - i * 0.12 }}
        >
          <div className="h-7 w-7 shrink-0 animate-pulse rounded-lg bg-white/[0.06]" />
          <div className="flex-1 space-y-1">
            <div className="h-2 w-1/3 animate-pulse rounded bg-white/[0.07]" />
            <div className="h-2 w-1/2 animate-pulse rounded bg-white/[0.04]" />
          </div>
          <div className="h-2 w-10 animate-pulse rounded bg-white/[0.06]" />
        </div>
      ))}
    </div>
  );
}

/** 错误态：可重试，不隐藏失败原因 */
export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-rose-400/25 bg-rose-400/[0.06] px-3 py-5 text-center">
      <AlertTriangle className="h-5 w-5 text-rose-300" />
      <p className="text-[11px] font-medium text-rose-200">数据加载失败</p>
      <p className="max-w-md break-words text-[10px] leading-relaxed text-rose-200/70">{message || "请检查网络或服务端状态"}</p>
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry}>
          <RefreshCw className="h-3 w-3" /> 重试
        </Button>
      )}
    </div>
  );
}

/** 空态：给出下一步动作而不是一片空白 */
export function EmptyState({ hint = "暂无数据", action }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-white/10 px-3 py-6 text-center">
      <Inbox className="h-5 w-5 text-muted-foreground/60" />
      <p className="text-[11px] text-muted-foreground">{hint}</p>
      {action}
    </div>
  );
}

/**
 * 统一异步状态容器：加载 → 错误 → 空 → 内容
 * 所有模块都必须走这条链路，避免"白屏当正常"。
 */
export default function ModuleState({ loading, error, empty, onRetry, emptyHint, skeletonRows = 4, emptyAction, children }) {
  if (loading) return <SkeletonRows rows={skeletonRows} />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (empty) return <EmptyState hint={emptyHint} action={emptyAction} />;
  return children;
}

/** 行内加载指示（用于按钮等局部刷新） */
export function InlineLoading({ label = "加载中" }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
      <Loader2 className="h-3 w-3 animate-spin" /> {label}
    </span>
  );
}
