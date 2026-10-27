import React, { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Radio, Sparkles, Zap } from "lucide-react";
import { SectionCard } from "@/components/common/SectionCard";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const SIGNALS = [
  ["NMS/ACS", "做多", 82, 0.88, 1284.6, "已执行"],
  ["YSE/NMS", "做空", 64, 0.71, -326.4, "已执行"],
  ["ACS/USDT", "做多", 58, 0.64, 486.2, "已执行"],
  ["GCP/ACS", "观望", 42, 0.55, 0, "待触发"],
  ["NMS/USDT", "做多", 76, 0.81, 862.4, "已执行"],
  ["NMS/YSE", "做空", 69, 0.74, 642.8, "已执行"],
  ["ACS/NMS", "做多", 51, 0.6, 128.6, "待触发"],
  ["YSE/ACS", "观望", 38, 0.48, 0, "待触发"],
];

/** Alpha 信号与自动执行（白皮书 15.2-15.4） */
export default function AlphaSignals() {
  const [master, setMaster] = useState(true);
  const [auto, setAuto] = useState(false);

  const data = useMemo(() => {
    let strat = 100;
    let base = 100;
    return Array.from({ length: 30 }, (_, i) => {
      strat += 0.62 + Math.sin(i / 2.6) * 0.9 - (i === 18 ? 2.4 : 0);
      base += 0.16 + Math.cos(i / 4) * 0.5;
      return { day: `D${i + 1}`, strategy: Math.round(strat * 100) / 100, benchmark: Math.round(base * 100) / 100 };
    });
  }, []);

  const last = data[data.length - 1];

  return (
    <SectionCard
      title="Alpha 信号与自动执行"
      desc="六因子信号生成 · 置信度加权 · 自动下单"
      icon={Radio}
      actions={<Badge variant={auto ? "success" : "outline"}>{auto ? "自动执行中" : "手动确认"}</Badge>}
    >
      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-2">
        <span className="flex items-center gap-1.5 text-[11px]">
          <Sparkles className="h-3.5 w-3.5 text-cyan-300" /> Alpha 系统总开关
        </span>
        <Switch
          checked={master}
          onCheckedChange={(v) => {
            setMaster(v);
            if (!v) setAuto(false);
            toast.message(`Alpha 系统已${v ? "启用" : "停用"}`);
          }}
        />
      </div>
      <div className="mt-1.5 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-2">
        <span className="flex items-center gap-1.5 text-[11px]">
          <Zap className="h-3.5 w-3.5 text-amber-300" /> 自动执行信号
        </span>
        <Switch checked={auto} onCheckedChange={setAuto} disabled={!master} />
      </div>

      <div className="mt-2 h-[150px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 6, right: 4, left: -26, bottom: 0 }}>
            <CartesianGrid stroke="rgba(148,163,184,0.1)" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 8, fill: "#94a3b8" }} axisLine={false} tickLine={false} interval={6} />
            <YAxis
              domain={["dataMin - 1", "dataMax + 1"]}
              tick={{ fontSize: 8, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip
              contentStyle={{
                background: "rgba(13,21,38,0.96)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10,
                fontSize: 11,
              }}
            />
            <Line type="monotone" dataKey="strategy" name="Alpha 策略" stroke="#22d3ee" strokeWidth={2} dot={false} />
            <Line
              type="monotone"
              dataKey="benchmark"
              name="基准"
              stroke="#94a3b8"
              strokeWidth={1.5}
              strokeDasharray="3 3"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-between text-[9px] text-muted-foreground">
        <span>30 日净值对比（起点 100）</span>
        <span>
          策略 <span className="num text-cyan-300">{last.strategy}</span> · 基准{" "}
          <span className="num">{last.benchmark}</span> · 超额{" "}
          <span className="num text-rose-400">+{(last.strategy - last.benchmark).toFixed(2)}%</span>
        </span>
      </div>

      <div className="mt-2 overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-[9px]">
          <thead className="bg-white/5 text-muted-foreground">
            <tr>
              <th className="px-2 py-1 text-left font-medium">交易对</th>
              <th className="px-2 py-1 text-left font-medium">方向</th>
              <th className="px-2 py-1 text-right font-medium">强度</th>
              <th className="px-2 py-1 text-right font-medium">置信度</th>
              <th className="px-2 py-1 text-right font-medium">P&L</th>
              <th className="px-2 py-1 text-right font-medium">状态</th>
            </tr>
          </thead>
          <tbody>
            {SIGNALS.map(([pair, side, strength, conf, pnl, status]) => (
              <tr key={pair + side} className="border-t border-white/5">
                <td className="num px-2 py-1">{pair}</td>
                <td
                  className={cn(
                    "px-2 py-1",
                    side === "做多" ? "text-rose-400" : side === "做空" ? "text-emerald-400" : "text-muted-foreground"
                  )}
                >
                  {side}
                </td>
                <td className="num px-2 py-1 text-right">{strength}</td>
                <td className="num px-2 py-1 text-right text-muted-foreground">{conf.toFixed(2)}</td>
                <td className={cn("num px-2 py-1 text-right", pnl >= 0 ? "text-rose-400" : "text-emerald-400")}>
                  {pnl ? `${pnl > 0 ? "+" : ""}${pnl.toFixed(1)}` : "—"}
                </td>
                <td className="px-2 py-1 text-right text-muted-foreground">{status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Button
        className="mt-2 w-full"
        size="sm"
        variant="outline"
        onClick={() => toast.success(auto ? "已按当前信号自动下单（演示）" : "信号已推送到交易面板")}
      >
        <Zap className="h-3.5 w-3.5" /> {auto ? "立即执行全部信号" : "推送信号到交易面板"}
      </Button>
    </SectionCard>
  );
}
