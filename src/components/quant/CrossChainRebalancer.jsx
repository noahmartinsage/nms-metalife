import React, { useState } from "react";
import { Network, RefreshCw } from "lucide-react";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { fmtNum } from "@/lib/format";

const CHAINS = [
  { key: "nms", name: "NMS Chain", apy: 18.6, color: "#22c55e" },
  { key: "eth", name: "Ethereum", apy: 6.4, color: "#818cf8" },
  { key: "polygon", name: "Polygon", apy: 12.8, color: "#a855f7" },
  { key: "bnb", name: "BNB Chain", apy: 9.2, color: "#fbbf24" },
];

/** 跨链资金再平衡 */
export default function CrossChainRebalancer({ total = 100000 }) {
  const [alloc, setAlloc] = useState({ nms: 40, eth: 20, polygon: 25, bnb: 15 });
  const [busy, setBusy] = useState(false);

  const sum = Object.values(alloc).reduce((a, b) => a + b, 0);
  const avgApy = CHAINS.reduce((s, c) => s + (alloc[c.key] / 100) * c.apy, 0);

  const rebalance = () => {
    if (sum !== 100) {
      toast.error("配置比例合计需为 100%");
      return;
    }
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      toast.success(`已通过 LayerZero 完成跨链调度，预计年化 ${avgApy.toFixed(2)}%`);
    }, 800);
  };

  return (
    <SectionCard
      title="跨链调度"
      desc="LayerZero · 按 APY 与风险评分自动再平衡"
      icon={Network}
      actions={<Badge variant={sum === 100 ? "success" : "warning"}>合计 {sum}%</Badge>}
    >
      <div className="space-y-2">
        {CHAINS.map((c) => (
          <div key={c.key}>
            <div className="flex items-center justify-between text-[10px]">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.color }} />
                {c.name} <span className="text-muted-foreground/60">APY {c.apy}%</span>
              </span>
              <span className="num">
                {alloc[c.key]}% · {fmtNum((total * alloc[c.key]) / 100)}
              </span>
            </div>
            <Slider
              className="mt-1"
              value={alloc[c.key]}
              min={0}
              max={100}
              step={5}
              onValueChange={(v) => setAlloc((a) => ({ ...a, [c.key]: v }))}
            />
          </div>
        ))}
      </div>

      <div className="mt-2 flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-[10px]">
        <span className="text-muted-foreground">组合预期年化</span>
        <span className="num text-xs font-semibold text-emerald-300">{avgApy.toFixed(2)}%</span>
      </div>

      <Button className="mt-2 w-full" onClick={rebalance} disabled={busy}>
        <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} /> {busy ? "调度中…" : "执行跨链再平衡"}
      </Button>
    </SectionCard>
  );
}
