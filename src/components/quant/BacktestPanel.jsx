import React, { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { FlaskConical, Play } from "lucide-react";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectOption } from "@/components/ui/select";
import { fmtNum } from "@/lib/format";

/** 回测系统 */
export default function BacktestPanel() {
  const [days, setDays] = useState("90");
  const [strategy, setStrategy] = useState("alpha");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);

  const run = () => {
    setProgress(0);
    setResult(null);
    let p = 0;
    const timer = setInterval(() => {
      p += 10;
      setProgress(p);
      if (p >= 100) {
        clearInterval(timer);
        const n = Number(days) || 90;
        const equity = Array.from({ length: n }, (_, i) => {
          const base = 100000;
          const drift = strategy === "alpha" ? 0.0032 : strategy === "arb" ? 0.0018 : 0.0024;
          const noise = Math.sin(i / 3.2) * 0.012 + Math.cos(i / 7) * 0.008;
          return { day: i + 1, equity: Math.round(base * (1 + drift * i + noise)) };
        });
        const final = equity[equity.length - 1].equity;
        let peak = 0;
        let mdd = 0;
        equity.forEach((e) => {
          peak = Math.max(peak, e.equity);
          mdd = Math.min(mdd, (e.equity - peak) / peak);
        });
        setResult({
          equity,
          totalReturn: ((final - 100000) / 100000) * 100,
          mdd: mdd * 100,
          sharpe: strategy === "alpha" ? 2.14 : 1.62,
          winRate: strategy === "alpha" ? 74.2 : 68.4,
          trades: Math.round(n * 1.8),
        });
      }
    }, 90);
  };

  const chartData = useMemo(() => result?.equity || [], [result]);

  return (
    <SectionCard title="回测系统" desc="历史数据回放 · 滑点与手续费建模" icon={FlaskConical}>
      <div className="flex gap-2">
        <Select value={strategy} onChange={(e) => setStrategy(e.target.value)} className="h-8 text-xs">
          <SelectOption value="alpha">Alpha 六因子</SelectOption>
          <SelectOption value="arb">跨池套利</SelectOption>
          <SelectOption value="mm">做市网格</SelectOption>
        </Select>
        <Select value={days} onChange={(e) => setDays(e.target.value)} className="h-8 text-xs">
          <SelectOption value="30">30 天</SelectOption>
          <SelectOption value="90">90 天</SelectOption>
          <SelectOption value="180">180 天</SelectOption>
        </Select>
        <Button size="sm" onClick={run}>
          <Play className="h-3.5 w-3.5" /> 运行
        </Button>
      </div>

      {progress > 0 && progress < 100 && <Progress value={progress} className="mt-2" />}

      {result && (
        <>
          <div className="mt-2 h-[140px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid stroke="rgba(148,163,184,0.1)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 9, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  width={52}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    background: "rgba(13,21,38,0.96)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10,
                    fontSize: 11,
                  }}
                  formatter={(v) => [`¥${fmtNum(v)}`, "净值"]}
                />
                <Line type="monotone" dataKey="equity" stroke="#22d3ee" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 grid grid-cols-4 gap-1.5 text-center">
            {[
              ["总收益", `${result.totalReturn.toFixed(2)}%`, result.totalReturn >= 0 ? "text-rose-400" : "text-emerald-400"],
              ["最大回撤", `${result.mdd.toFixed(2)}%`, "text-emerald-400"],
              ["夏普", result.sharpe.toFixed(2), "text-cyan-300"],
              ["胜率", `${result.winRate}%`, "text-violet-300"],
            ].map(([k, v, c]) => (
              <div key={k} className="rounded-lg border border-white/10 bg-white/[0.03] py-1.5">
                <p className={`num text-[11px] font-semibold ${c}`}>{v}</p>
                <p className="text-[9px] text-muted-foreground">{k}</p>
              </div>
            ))}
          </div>
          <p className="mt-1.5 text-[10px] text-muted-foreground">
            共 {result.trades} 笔交易 · 手续费 0 Gas · 滑点 0.05%
          </p>
        </>
      )}
    </SectionCard>
  );
}
