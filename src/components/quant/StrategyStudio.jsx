import React, { useState } from "react";
import { Pause, Play, Plus, Sliders, TrendingUp } from "lucide-react";
import { SectionCard, EmptyState } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectOption } from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { base44 } from "@/api/base44Client";
import { fmtNum } from "@/lib/format";
import { cn } from "@/lib/utils";

const TYPE_LABEL = {
  arbitrage: "套利",
  yield_farming: "收益农场",
  market_making: "做市",
  trend_following: "趋势跟踪",
  sentiment: "情绪因子",
};

/** 策略工作室 */
export default function StrategyStudio({ strategies = [], onChanged }) {
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", type: "arbitrage", capital: "100000" });

  const toggle = async (s) => {
    await base44.entities.TradingStrategy.update(s.id, {
      status: s.status === "active" ? "paused" : "active",
    });
    toast.success(`${s.name} 已${s.status === "active" ? "暂停" : "启动"}`);
    onChanged?.();
  };

  const create = async () => {
    if (!form.name.trim()) {
      toast.error("请填写策略名称");
      return;
    }
    await base44.entities.TradingStrategy.create({
      name: form.name,
      type: form.type,
      status: "paused",
      win_rate: 0,
      pnl: 0,
      pnl_percent: 0,
      allocated_capital: Number(form.capital) || 0,
      risk_level: "medium",
      trades_count: 0,
    });
    toast.success("策略已创建，处于暂停状态");
    setForm({ name: "", type: "arbitrage", capital: "100000" });
    setCreating(false);
    onChanged?.();
  };

  return (
    <SectionCard
      title="策略工作室"
      desc={`${strategies.length} 个策略 · 5 类模型`}
      icon={Sliders}
      actions={
        <Button size="sm" variant="outline" onClick={() => setCreating((v) => !v)}>
          <Plus className="h-3.5 w-3.5" /> 新建
        </Button>
      }
    >
      {creating && (
        <div className="mb-3 space-y-2 rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-3">
          <Input
            placeholder="策略名称"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="h-8 text-xs"
          />
          <div className="flex gap-2">
            <Select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="h-8 text-xs"
            >
              {Object.entries(TYPE_LABEL).map(([k, v]) => (
                <SelectOption key={k} value={k}>
                  {v}
                </SelectOption>
              ))}
            </Select>
            <Input
              type="number"
              min="0"
              step="any"
              value={form.capital}
              onChange={(e) => {
                const v = e.target.value;
                setForm({ ...form, capital: parseFloat(v) < 0 ? "0" : v });
              }}
              className="h-8 text-xs"
              placeholder="分配资金"
            />
          </div>
          <Button size="sm" className="w-full" onClick={create}>
            创建策略
          </Button>
        </div>
      )}

      {strategies.length === 0 ? (
        <EmptyState title="暂无策略" desc="点击「新建」创建第一个量化策略" />
      ) : (
        <div className="space-y-1.5">
          {strategies.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-2.5"
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 shrink-0 rounded-full",
                  s.status === "active" ? "bg-emerald-400" : "bg-muted-foreground"
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate text-[11px] font-medium">
                  {s.name}
                  <span className="rounded bg-white/5 px-1 text-[9px] text-muted-foreground">
                    {TYPE_LABEL[s.type] || s.type}
                  </span>
                </p>
                <p className="num text-[9px] text-muted-foreground">
                  胜率 {s.win_rate}% · {s.trades_count} 笔 · 资金 {fmtNum(s.allocated_capital)}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className={cn("num text-[11px] font-medium", s.pnl >= 0 ? "text-rose-400" : "text-emerald-400")}>
                  {s.pnl >= 0 ? "+" : ""}
                  {fmtNum(s.pnl)}
                </p>
                <p className="num text-[9px] text-muted-foreground">{s.pnl_percent}%</p>
              </div>
              <button
                type="button"
                onClick={() => toggle(s)}
                className="shrink-0 rounded-lg border border-white/10 p-1.5 text-muted-foreground hover:text-foreground"
                aria-label={s.status === "active" ? "暂停" : "启动"}
              >
                {s.status === "active" ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2">
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <TrendingUp className="h-3 w-3" /> 合计盈亏
        </span>
        <span className="num text-xs font-semibold text-rose-400">
          {fmtNum(strategies.reduce((a, s) => a + (s.pnl || 0), 0))}
        </span>
      </div>
    </SectionCard>
  );
}

export { TYPE_LABEL };
