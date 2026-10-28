import React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

/** 全局错误边界：渲染异常时给出可恢复界面，避免整页白屏 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // 生产环境可在此上报到监控平台
    console.error("[NMS ErrorBoundary]", error, info?.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-6 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-2xl border border-rose-400/30 bg-rose-400/10 text-rose-300">
          <AlertTriangle className="h-6 w-6" />
        </span>
        <p className="text-sm font-semibold">页面渲染出错</p>
        <p className="max-w-sm text-[11px] leading-relaxed text-muted-foreground">
          已捕获异常，你的本地数据未受影响。可尝试刷新；若持续出现，请在「管理后台 → 重置演示数据」恢复。
        </p>
        <p className="num max-w-sm truncate rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-[10px] text-muted-foreground">
          {String(error?.message || error)}
        </p>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => window.location.reload()}>
            <RotateCcw className="h-3.5 w-3.5" /> 刷新页面
          </Button>
          <Button size="sm" variant="outline" onClick={() => this.setState({ error: null })}>
            返回重试
          </Button>
        </div>
      </div>
    );
  }
}
