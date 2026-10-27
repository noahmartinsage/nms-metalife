import React, { useState } from "react";
import { Coins, Droplets, Plus, TrendingUp } from "lucide-react";
import { SectionCard, EmptyState } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { base44 } from "@/api/base44Client";
import { fmtNum, sanitizeAmount } from "@/lib/format";
import { useEntityList } from "@/hooks/useEntity";
import { cn } from "@/lib/utils";

/** 流动性挖矿管理 */
export default function LiquidityManager({ balance }) {
  const { data: pools, refresh } = useEntityList("LiquidityPool", {}, "-apy", 20);
  const [active, setActive] = useState(null);
  const [amountA, setAmountA] = useState("1000");
  const [amountB, setAmountB] = useState("420");
  const [busy, setBusy] = useState(false);

  const add = async () => {
    if (!active) return;
    const a = Number(amountA) || 0;
    const b = Number(amountB) || 0;
    if (a <= 0 || b <= 0) {
      toast.error("请输入有效数量");
      return;
    }
    setBusy(true);
    try {
      await base44.entities.LiquidityPool.update(active.id, {
        reserve_a: (active.reserve_a || 0) + a,
        reserve_b: (active.reserve_b || 0) + b,
        tvl: (active.tvl || 0) + a + b,
      });
      toast.success(`已添加流动性，获得 LP 代币 ${fmtNum(Math.sqrt(a * b), 2)}`);
      setActive(null);
      refresh();
    } catch (e) {
      toast.error("添加失败");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <SectionCard
        title="流动性池"
        desc="AMM 做市 · 手续费 0.1-0.35% · YSE 额外激励"
        icon={Droplets}
        actions={<Badge variant="success">{pools.length} 个池</Badge>}
      >
        {pools.length === 0 ? (
          <EmptyState title="暂无流动性池" />
        ) : (
          <div className="space-y-1.5">
            {pools.map((p) => (
              <div key={p.id} className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-cyan-400/10 text-[9px] font-bold text-cyan-200">
                  LP
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-medium">{p.pool_name}</p>
                  <p className="num text-[9px] text-muted-foreground">
                    TVL {fmtNum(p.tvl)} · 24h {fmtNum(p.volume_24h)} · 费率 {p.fee_percent}%
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="num text-[11px] font-semibold text-emerald-300">{p.apy}%</p>
                  <p className="text-[9px] text-muted-foreground">APY</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setActive(p)}>
                  <Plus className="h-3 w-3" /> 添加
                </Button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <Dialog open={!!active} onOpenChange={(v) => !v && setActive(null)}>
        {active && (
          <DialogContent onClose={() => setActive(null)} className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-cyan-300" /> 添加流动性 · {active.pool_name}
              </DialogTitle>
              <DialogDescription>
                当前年化 {active.apy}%，按比例注入双边资产可获得 LP 代币并参与 YSE 挖矿
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <div>
                <Label>{active.token_a} 数量</Label>
                <Input
                  className="mt-1"
                  type="number"
                  min="0"
                  step="any"
                  value={amountA}
                  onChange={(e) => setAmountA(sanitizeAmount(e.target.value))}
                />
              </div>
              <div>
                <Label>{active.token_b} 数量</Label>
                <Input
                  className="mt-1"
                  type="number"
                  min="0"
                  step="any"
                  value={amountB}
                  onChange={(e) => setAmountB(sanitizeAmount(e.target.value))}
                />
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">预计获得 LP</span>
                  <span className="num">
                    {fmtNum(Math.sqrt((Number(amountA) || 0) * (Number(amountB) || 0)), 2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">预计年化收益</span>
                  <span className="num text-emerald-300">
                    {fmtNum(((Number(amountA) || 0) + (Number(amountB) || 0)) * (active.apy / 100))} / 年
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">可用 NMS</span>
                  <span className="num">{fmtNum(balance?.available_nms || 0)}</span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => setActive(null)}>
                取消
              </Button>
              <Button onClick={add} disabled={busy}>
                <TrendingUp className="h-4 w-4" /> {busy ? "注入中…" : "确认添加"}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}

export { cn };
