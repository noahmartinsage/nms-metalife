import React, { useMemo, useState } from "react";
import { AlertTriangle, Power, ShieldAlert, ShieldCheck } from "lucide-react";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { CIRCUIT_THRESHOLDS, evaluateCircuitBreaker } from "@/lib/engine";
import { cn } from "@/lib/utils";

/** AI 熔断器（规范 7.8） */
export default function AICircuitBreaker() {
  const [state, setState] = useState({
    volatility: 18,
    poolRisk: 42,
    auditAlert: 0,
    bridgeDelay: 12,
  });
  const [frozen, setFrozen] = useState(false);

  const verdict = useMemo(() => evaluateCircuitBreaker(state), [state]);

  const toggleFreeze = () => {
    setFrozen((v) => !v);
    toast[frozen ? "success" : "warning"](frozen ? "已解除全局冻结" : "已触发全局熔断，跨链调度暂停");
  };

  const label = { volatility: "全网波动率", poolRisk: "矿池风险评分", auditAlert: "合约审计告警", bridgeDelay: "跨链确认延迟" };
  const unit = { volatility: "%", poolRisk: "分", auditAlert: "个", bridgeDelay: "min" };

  return (
    <SectionCard
      title="AI 熔断器"
      desc="Minara-AI 实时监控 · 自动触发智能合约熔断"
      icon={ShieldAlert}
      actions={
        <Badge variant={verdict.level === "critical" ? "danger" : verdict.level === "warning" ? "warning" : "success"}>
          {verdict.level === "critical" ? "严重" : verdict.level === "warning" ? "预警" : "正常"}
        </Badge>
      }
    >
      <div className="space-y-2.5">
        {CIRCUIT_THRESHOLDS.map((t) => {
          const v = state[t.key];
          const over = v >= t.threshold;
          return (
            <div key={t.key}>
              <div className="flex items-center justify-between text-[10px]">
                <span className={cn("flex items-center gap-1", over ? "text-rose-300" : "text-muted-foreground")}>
                  {over && <AlertTriangle className="h-2.5 w-2.5" />}
                  {label[t.key]}
                </span>
                <span className="num">
                  {v}
                  {unit[t.key]} / 阈值 {t.threshold}
                  {unit[t.key]}
                </span>
              </div>
              <Slider
                className="mt-1"
                value={v}
                min={0}
                max={t.key === "volatility" ? 60 : t.key === "poolRisk" ? 100 : t.key === "auditAlert" ? 3 : 60}
                step={t.key === "auditAlert" ? 1 : 1}
                onValueChange={(val) => setState((s) => ({ ...s, [t.key]: val }))}
              />
            </div>
          );
        })}
      </div>

      <div
        className={cn(
          "mt-3 rounded-xl border p-2.5",
          verdict.triggered ? "border-rose-400/30 bg-rose-400/10" : "border-emerald-400/25 bg-emerald-400/10"
        )}
      >
        <p className={cn("flex items-center gap-1 text-[11px] font-medium", verdict.triggered ? "text-rose-300" : "text-emerald-300")}>
          {verdict.triggered ? <ShieldAlert className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
          {verdict.triggered ? `已触发 ${verdict.hits.length} 项熔断条件` : "全部指标处于安全区间"}
        </p>
        {verdict.triggered && (
          <ul className="mt-1 space-y-0.5">
            {verdict.hits.map((h) => (
              <li key={h.key} className="text-[10px] text-muted-foreground">
                · {h.label} → <span className="text-rose-300">{h.action}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Button className="mt-2 w-full" variant={frozen ? "success" : "destructive"} onClick={toggleFreeze}>
        <Power className="h-4 w-4" /> {frozen ? "解除全局冻结" : "手动触发全局熔断"}
      </Button>
    </SectionCard>
  );
}
