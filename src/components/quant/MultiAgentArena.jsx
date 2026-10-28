import React, { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Swords, Trophy, Zap } from "lucide-react";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { fmtNum } from "@/lib/format";
import { cn } from "@/lib/utils";

const AGENTS = [
  { key: "arb", name: "ArbBot-7", type: "跨池套利", color: "#22d3ee", ret: 18.6, win: 78.4, mdd: -4.2, sharpe: 2.31, capital: 150000 },
  { key: "grid", name: "GridMaster", type: "做市网格", color: "#34d399", ret: 12.4, win: 68.2, mdd: -3.1, sharpe: 1.86, capital: 260000 },
  { key: "sent", name: "SentimentX", type: "情绪因子", color: "#fb7185", ret: 24.8, win: 61.8, mdd: -9.6, sharpe: 1.42, capital: 80000 },
  { key: "yield", name: "YieldFarmer", type: "收益农场", color: "#a78bfa", ret: 9.6, win: 92.1, mdd: -1.4, sharpe: 3.04, capital: 320000 },
];

/** 多智能体竞技场（技术白皮书 4.5 / 白皮书 6.1） */
export default function MultiAgentArena() {
  const [round, setRound] = useState(1);

  const data = useMemo(() => {
    const series = AGENTS.map((a) => ({ key: a.key, drift: a.ret / 30, vol: Math.abs(a.mdd) / 12 }));
    return Array.from({ length: 30 }, (_, i) => {
      const row = { day: `D${i + 1}` };
      series.forEach((s, idx) => {
        const noise = Math.sin((i + idx * 3) / 2.4) * s.vol + Math.cos((i + idx) / 5) * (s.vol / 2);
        row[s.key] = Math.round((100 + s.drift * (i + 1) + noise) * 100) / 100;
      });
      return row;
    });
  }, []);

  const ranked = [...AGENTS].sort((a, b) => b.sharpe - a.sharpe);
  const last = data[data.length - 1];

  return (
    <SectionCard
      title="多智能体竞技场"
      desc="4 个 AI Agent 同场竞技 · 夏普比率排名 · 30 日资金曲线"
      icon={Swords}
      actions={<Badge variant="purple">第 {round} 轮</Badge>}
    >
      <div className="h-[150px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 6, right: 4, left: -28, bottom: 0 }}>
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
            {AGENTS.map((a) => (
              <Line
                key={a.key}
                type="monotone"
                dataKey={a.key}
                name={a.name}
                stroke={a.color}
                strokeWidth={1.8}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-1 flex flex-wrap gap-2">
        {AGENTS.map((a) => (
          <span key={a.key} className="flex items-center gap-1 text-[9px] text-muted-foreground">
            <span className="h-1.5 w-3 rounded-full" style={{ background: a.color }} />
            {a.name} {last[a.key].toFixed(1)}
          </span>
        ))}
      </div>

      <div className="mt-2 overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-[9px]">
          <thead className="bg-white/5 text-muted-foreground">
            <tr>
              <th className="px-2 py-1 text-left font-medium">#</th>
              <th className="px-2 py-1 text-left font-medium">Agent</th>
              <th className="px-2 py-1 text-right font-medium">收益</th>
              <th className="px-2 py-1 text-right font-medium">胜率</th>
              <th className="px-2 py-1 text-right font-medium">回撤</th>
              <th className="px-2 py-1 text-right font-medium">夏普</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((a, i) => (
              <tr key={a.key} className="border-t border-white/5">
                <td className="px-2 py-1">
                  {i === 0 ? <Trophy className="h-2.5 w-2.5 text-amber-300" /> : <span className="num text-muted-foreground">{i + 1}</span>}
                </td>
                <td className="px-2 py-1">
                  <span style={{ color: a.color }}>{a.name}</span>
                  <span className="ml-1 text-muted-foreground">{a.type}</span>
                </td>
                <td className={cn("num px-2 py-1 text-right", a.ret >= 0 ? "text-rose-400" : "text-emerald-400")}>
                  +{a.ret}%
                </td>
                <td className="num px-2 py-1 text-right text-muted-foreground">{a.win}%</td>
                <td className="num px-2 py-1 text-right text-emerald-400">{a.mdd}%</td>
                <td className="num px-2 py-1 text-right text-cyan-300">{a.sharpe}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-2 flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-2.5 py-1.5 text-[9px]">
        <span className="text-muted-foreground">
          总管理资金 <span className="num text-foreground">{fmtNum(AGENTS.reduce((s, a) => s + a.capital, 0))} NMS</span>
        </span>
        <span className="text-muted-foreground">评分 = 夏普 × 0.5 + 收益 × 0.3 − 回撤 × 0.2</span>
      </div>

      <Button
        className="mt-2 w-full"
        size="sm"
        variant="outline"
        onClick={() => {
          setRound((r) => r + 1);
          toast.success(`第 ${round + 1} 轮竞技开始，Agent 参数已按适应度进化`);
        }}
      >
        <Zap className="h-3.5 w-3.5" /> 开始新一轮竞技
      </Button>
    </SectionCard>
  );
}
