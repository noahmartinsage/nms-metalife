import React, { useMemo, useState } from "react";
import { Pickaxe, RefreshCw, Server, Zap } from "lucide-react";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { fmtNum } from "@/lib/format";
import { cn } from "@/lib/utils";

const POOLS = [
  { key: "nms", name: "NMS 主池", hash: 8.6, miners: 2480, apy: 18.6, risk: 32, coin: "NMS" },
  { key: "eth", name: "ETH 池", hash: 4.2, miners: 1284, apy: 9.4, risk: 46, coin: "ETH" },
  { key: "polygon", name: "Polygon 池", hash: 2.8, miners: 862, apy: 12.8, risk: 54, coin: "POL" },
  { key: "yse", name: "YSE 收益池", hash: 1.6, miners: 426, apy: 24.2, risk: 71, coin: "YSE" },
];

const NODES = [
  ["NMS-Node-01", "华东·杭州", 128640, 50000, 98, "正常"],
  ["NMS-Node-02", "华东·上海", 118420, 42000, 96, "正常"],
  ["NMS-Node-03", "华南·深圳", 96480, 38000, 94, "正常"],
  ["NMS-Node-04", "华北·北京", 88260, 32000, 91, "正常"],
  ["NMS-Node-05", "西南·成都", 64280, 24000, 87, "正常"],
  ["NMS-Node-06", "华中·武汉", 42680, 18000, 78, "降权"],
  ["NMS-Node-07", "海外·新加坡", 38640, 16000, 93, "正常"],
  ["NMS-Node-08", "海外·法兰克福", 26480, 12000, 89, "正常"],
];

const STRATEGIES = [
  { key: "yield", label: "收益优先", desc: "按 APY 排序分配算力" },
  { key: "risk", label: "风险优先", desc: "规避风险评分 > 50 的池" },
  { key: "balance", label: "均衡", desc: "APY × (1 − 风险/100) 综合评分" },
];

/** 量子矿池与全网算力调度 */
export default function QuantumMiningPool() {
  const [strategy, setStrategy] = useState("balance");
  const [busy, setBusy] = useState(false);
  const [applied, setApplied] = useState(null);

  const alloc = useMemo(() => {
    const scored = POOLS.map((p) => {
      let score = 0;
      if (strategy === "yield") score = p.apy;
      else if (strategy === "risk") score = Math.max(0, 100 - p.risk) * 0.5;
      else score = p.apy * (1 - p.risk / 100);
      return { ...p, score };
    });
    const total = scored.reduce((s, p) => s + p.score, 0) || 1;
    return scored.map((p) => ({ ...p, pct: Math.round((p.score / total) * 1000) / 10 }));
  }, [strategy]);

  const totalHash = POOLS.reduce((s, p) => s + p.hash, 0);

  const apply = () => {
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      setApplied(alloc);
      toast.success("算力已按策略重新分配，切换耗时 1.8s");
    }, 750);
  };

  return (
    <SectionCard
      title="量子矿池 · 算力调度"
      desc={`全网算力 ${totalHash.toFixed(1)} PH/s · ${fmtNum(5052, 0)} 矿工`}
      icon={Pickaxe}
      actions={<Badge variant="success">ML-DSA-65</Badge>}
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {POOLS.map((p) => (
          <div key={p.key} className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
            <p className="truncate text-[10px] text-muted-foreground">{p.name}</p>
            <p className="num mt-0.5 text-sm font-semibold text-cyan-300">{p.hash} PH/s</p>
            <p className="num text-[9px] text-muted-foreground">
              APY {p.apy}% · 风险 {p.risk}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-1">
        {STRATEGIES.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => {
              setStrategy(s.key);
              setApplied(null);
            }}
            className={cn(
              "flex-1 rounded-lg border px-2 py-1.5 text-[10px] transition-colors",
              strategy === s.key
                ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-200"
                : "border-white/10 text-muted-foreground"
            )}
            title={s.desc}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="mt-2 space-y-1.5">
        {(applied || alloc).map((p) => (
          <div key={p.key}>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground">{p.name}</span>
              <span className="num">
                {p.pct}% · {(totalHash * p.pct) / 100 >= 0 ? ((totalHash * p.pct) / 100).toFixed(2) : 0} PH/s
              </span>
            </div>
            <Progress
              value={p.pct}
              className="mt-0.5 h-1"
              indicatorClassName={p.risk > 60 ? "bg-gradient-to-r from-amber-400 to-rose-400" : undefined}
            />
          </div>
        ))}
      </div>

      <Button className="mt-2 w-full" size="sm" onClick={apply} disabled={busy}>
        <RefreshCw className={cn("h-3.5 w-3.5", busy && "animate-spin")} /> {busy ? "调度中…" : "执行全网算力调度"}
      </Button>

      <div className="mt-3">
        <p className="mb-1 flex items-center gap-1 text-[10px] font-medium">
          <Server className="h-3 w-3 text-cyan-300" /> 共识节点（PoS + AI 验证）
        </p>
        <div className="max-h-44 overflow-y-auto rounded-xl border border-white/10">
          <table className="w-full text-[9px]">
            <thead className="sticky top-0 bg-[#0d1526] text-muted-foreground">
              <tr>
                <th className="px-2 py-1 text-left font-medium">节点</th>
                <th className="px-2 py-1 text-right font-medium">出块</th>
                <th className="px-2 py-1 text-right font-medium">质押</th>
                <th className="px-2 py-1 text-right font-medium">AI 评分</th>
              </tr>
            </thead>
            <tbody>
              {NODES.map(([name, region, blocks, stake, score, status]) => (
                <tr key={name} className="border-t border-white/5">
                  <td className="px-2 py-1">
                    <span className="num">{name}</span>
                    <span className="ml-1 text-muted-foreground">{region}</span>
                  </td>
                  <td className="num px-2 py-1 text-right">{fmtNum(blocks, 0)}</td>
                  <td className="num px-2 py-1 text-right text-muted-foreground">{fmtNum(stake, 0)}</td>
                  <td className="px-2 py-1 text-right">
                    <span className={status === "降权" ? "text-amber-300" : "text-emerald-300"}>
                      {score} {status === "降权" ? "↓" : ""}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-1 flex items-center gap-1 text-[9px] text-muted-foreground">
          <Zap className="h-2.5 w-2.5" /> AI 评分 &lt; 80 的节点自动降权，出块收益按评分加权
        </p>
      </div>
    </SectionCard>
  );
}
