import React, { useMemo, useState } from "react";
import { Bot, Brain, ThumbsDown, ThumbsUp, TrendingUp, Wallet } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { StatCard } from "@/components/common/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { useSession } from "@/hooks/useSession";
import { fmtNum, sanitizeAmount } from "@/lib/format";
import { cn } from "@/lib/utils";

const MARKETS = [
  { id: "m1", q: "NMS 价格在 2026 Q4 前突破 1.00 ACS？", yes: 62, confidence: 0.74, volume: 2_840_000, end: "2026-12-31" },
  { id: "m2", q: "西湖区 DAO 商家补贴比例上调至 12%？", yes: 78, confidence: 0.81, volume: 486_000, end: "2026-11-15" },
  { id: "m3", q: "RWA 确权资产年内突破 10,000 项？", yes: 45, confidence: 0.52, volume: 1_260_000, end: "2026-12-31" },
  { id: "m4", q: "NMS 公链 TPS 突破 50,000？", yes: 34, confidence: 0.41, volume: 920_000, end: "2027-03-31" },
];

/** 7 日概率走势（确定性波动，用于迷你折线） */
const probTrend = (yes) => {
  const deltas = [-9, -5, -7, -2, 3, 1, 0];
  return deltas.map((d) => Math.max(4, Math.min(96, yes + d)));
};

function Sparkline({ points, color = "#22d3ee" }) {
  const w = 100;
  const h = 26;
  const min = Math.min(...points) - 2;
  const max = Math.max(...points) + 2;
  const step = w / (points.length - 1);
  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(2)},${(h - ((p - min) / (max - min)) * h).toFixed(2)}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-5 flex-1">
      <path d={d} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export default function PredictionMarket() {
  const { balance, refresh } = useSession();
  const [marketId, setMarketId] = useState("m1");
  const [side, setSide] = useState("yes");
  const [amount, setAmount] = useState("100");
  const [auto, setAuto] = useState(false);
  const [positions, setPositions] = useState([]);

  const market = MARKETS.find((m) => m.id === marketId);
  const amt = Number(amount) || 0;
  const odds = side === "yes" ? market.yes / 100 : 1 - market.yes / 100;
  const payout = odds > 0 ? amt / odds : 0;
  const profit = payout - amt;

  const totalPnl = useMemo(
    () => positions.reduce((s, p) => s + (p.pnl || 0), 0),
    [positions]
  );

  const place = () => {
    if (amt <= 0) {
      toast.error("请输入投入金额");
      return;
    }
    if (amt > (balance?.available_nms || 0)) {
      toast.error("可用 NMS 不足");
      return;
    }
    const p = {
      id: `pos_${Date.now()}`,
      question: market.q,
      side,
      amount: amt,
      payout,
      pnl: profit,
      auto,
      created: new Date().toLocaleString("zh-CN"),
    };
    setPositions((prev) => [p, ...prev]);
    toast.success(`已下注 ${fmtNum(amt)} NMS · ${side === "yes" ? "YES" : "NO"}`);
    refresh();
  };

  return (
    <div className="space-y-4">
      <PageHeader
        icon={Brain}
        title="预测市场"
        subtitle="AI 托管止盈止损（85% 止盈 / 30% 止损）· 链上结算 · 0 Gas"
        badge={<Badge variant="purple">AI 托管</Badge>}
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard label="我的持仓" value={positions.length} unit="个" icon={Wallet} accent="cyan" />
        <StatCard label="浮动盈亏" value={fmtNum(totalPnl)} unit="NMS" icon={TrendingUp} accent={totalPnl >= 0 ? "rose" : "emerald"} />
        <StatCard label="参与市场" value={MARKETS.length} unit="个" icon={Brain} accent="violet" />
        <StatCard label="AI 托管" value={auto ? "开启" : "关闭"} icon={Bot} accent="amber" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-2">
          {MARKETS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMarketId(m.id)}
              className={cn(
                "w-full rounded-2xl border p-3 text-left transition-colors",
                marketId === m.id
                  ? "border-cyan-400/40 bg-cyan-400/[0.07]"
                  : "border-white/10 bg-white/[0.03] hover:border-white/25"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-[11px] font-medium leading-relaxed">{m.q}</p>
                <Badge variant="outline">{m.end}</Badge>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="w-8 shrink-0 text-[9px] text-emerald-300">YES</span>
                <Progress value={m.yes} className="h-1.5" />
                <span className="num w-9 shrink-0 text-right text-[10px] text-emerald-300">{m.yes}%</span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="w-8 shrink-0 text-[9px] text-rose-300">NO</span>
                <Progress value={100 - m.yes} className="h-1.5" indicatorClassName="bg-gradient-to-r from-rose-400 to-pink-400" />
                <span className="num w-9 shrink-0 text-right text-[10px] text-rose-300">{100 - m.yes}%</span>
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="shrink-0 text-[8px] text-muted-foreground">7 日概率</span>
                <Sparkline points={probTrend(m.yes)} color={m.yes >= 50 ? "#22d3ee" : "#94a3b8"} />
                <span className="num shrink-0 text-[8px] text-muted-foreground">
                  {probTrend(m.yes)[0]}% → {m.yes}%
                </span>
              </div>
              <p className="mt-1.5 flex items-center gap-2 text-[9px] text-muted-foreground">
                <span>成交额 {fmtNum(m.volume)} NMS</span>
                <span className="flex items-center gap-1 text-violet-300">
                  <Bot className="h-2.5 w-2.5" /> AI 置信度 {(m.confidence * 100).toFixed(0)}%
                </span>
              </p>
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <SectionCard title="下注" desc={market.q} icon={TrendingUp}>
            <div className="grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
              {[
                ["yes", "YES", "text-emerald-300"],
                ["no", "NO", "text-rose-300"],
              ].map(([k, label, c]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setSide(k)}
                  className={cn(
                    "flex items-center justify-center gap-1 rounded-lg py-1.5 text-[11px] font-medium",
                    side === k ? cn("bg-white/10", c) : "text-muted-foreground"
                  )}
                >
                  {k === "yes" ? <ThumbsUp className="h-3 w-3" /> : <ThumbsDown className="h-3 w-3" />} {label}
                </button>
              ))}
            </div>

            <div className="mt-2">
              <Label>投入金额（NMS）</Label>
              <Input
                className="mt-1"
                type="number"
                min="0"
                step="any"
                value={amount}
                onChange={(e) => setAmount(sanitizeAmount(e.target.value))}
              />
              <div className="mt-1 flex gap-1">
                {[50, 100, 500, 1000].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setAmount(String(v))}
                    className="flex-1 rounded-md border border-white/10 py-1 text-[10px] text-muted-foreground hover:text-foreground"
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-2 space-y-0.5 rounded-xl border border-white/10 bg-black/20 p-2.5 text-[10px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">当前赔率</span>
                <span className="num">{(1 / odds).toFixed(2)}x</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">命中收益</span>
                <span className="num text-emerald-300">{fmtNum(payout)} NMS</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">潜在盈利</span>
                <span className="num text-rose-400">+{fmtNum(profit)} NMS</span>
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-2">
              <span className="flex items-center gap-1.5 text-[11px]">
                <Bot className="h-3.5 w-3.5 text-violet-300" /> AI 托管
              </span>
              <Switch checked={auto} onCheckedChange={setAuto} />
            </div>
            {auto && (
              <p className="mt-1 text-[10px] text-muted-foreground">
                收益达 85% 自动止盈，亏损达 30% 自动止损
              </p>
            )}

            <Button className="mt-2 w-full" onClick={place}>
              <Wallet className="h-4 w-4" /> 确认下注
            </Button>
          </SectionCard>

          <SectionCard title="我的持仓" desc={`${positions.length} 个`}>
            {positions.length === 0 ? (
              <p className="py-6 text-center text-[11px] text-muted-foreground">暂无持仓</p>
            ) : (
              <div className="space-y-1">
                {positions.map((p) => (
                  <div key={p.id} className="rounded-lg border border-white/5 bg-white/[0.02] p-2">
                    <p className="line-clamp-1 text-[10px]">{p.question}</p>
                    <div className="mt-0.5 flex items-center justify-between text-[9px]">
                      <span className={p.side === "yes" ? "text-emerald-300" : "text-rose-300"}>
                        {p.side.toUpperCase()} · {fmtNum(p.amount)} NMS
                      </span>
                      <span className="num text-rose-400">+{fmtNum(p.pnl)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
