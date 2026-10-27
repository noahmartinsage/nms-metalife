import React, { useMemo, useState } from "react";
import { ArrowDownUp, Fuel, Repeat, Settings2 } from "lucide-react";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/components/ui/toast";
import { base44 } from "@/api/base44Client";
import { fmtNum, mockQuantumSignature, sanitizeAmount } from "@/lib/format";
import { useEntityList } from "@/hooks/useEntity";

const TOKENS = [
  { symbol: "NMS", color: "#22c55e" },
  { symbol: "ACS", color: "#06b6d4" },
  { symbol: "YSE", color: "#a855f7" },
  { symbol: "GCP", color: "#f59e0b" },
  { symbol: "USDT", color: "#26a17b" },
];

/** 一键兑换（AMM 恒定乘积 · 5 币互兑 · 0 Gas） */
export default function SwapInterface({ balance }) {
  const { data: pools } = useEntityList("LiquidityPool", {}, "created_date", 10);
  const [from, setFrom] = useState("NMS");
  const [to, setTo] = useState("ACS");
  const [amount, setAmount] = useState("1000");
  const [slippage, setSlippage] = useState(0.5);
  const [busy, setBusy] = useState(false);

  const pool = useMemo(() => {
    return (
      pools.find(
        (p) =>
          (p.token_a === from && p.token_b === to) || (p.token_a === to && p.token_b === from)
      ) || pools[0]
    );
  }, [pools, from, to]);

  const [reserveIn, reserveOut] = useMemo(() => {
    if (!pool) return [0, 0];
    const inIsA = pool.token_a === from;
    return inIsA ? [pool.reserve_a, pool.reserve_b] : [pool.reserve_b, pool.reserve_a];
  }, [pool, from]);

  const amtIn = Number(amount) || 0;
  const fee = (pool?.fee_percent ?? 0.3) / 100;
  const out = reserveIn > 0 ? (amtIn * (1 - fee) * reserveOut) / (reserveIn + amtIn * (1 - fee)) : 0;
  const rate = amtIn > 0 ? out / amtIn : 0;
  const minOut = out * (1 - slippage / 100);
  const impact = reserveIn > 0 ? (amtIn / reserveIn) * 100 : 0;
  const available = balance?.available_nms || 0;

  const flip = () => {
    setFrom(to);
    setTo(from);
  };

  const swap = async () => {
    if (amtIn <= 0) {
      toast.error("请输入兑换数量");
      return;
    }
    if (from === "NMS" && amtIn > available) {
      toast.error("可用 NMS 不足");
      return;
    }
    setBusy(true);
    try {
      await base44.entities.Transaction.create({
        tx_hash: `0x${Math.random().toString(16).slice(2).padEnd(40, "0")}`,
        block_number: 18492000 + Math.floor(Math.random() * 5000),
        from_address: balance?.user_email || "demo",
        to_address: "NMS-AMM-POOL",
        amount: amtIn,
        token_type: from,
        status: "confirmed",
        gas_fee: 0,
        quantum_signature: mockQuantumSignature(),
        signature_time_ms: Date.now(),
      });
      toast.success(`兑换成功：${fmtNum(amtIn)} ${from} → ${fmtNum(out, 4)} ${to}`);
    } catch (e) {
      toast.error("兑换失败");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SectionCard
      title="一键兑换"
      desc="AMM 恒定乘积做市 · 5 币互兑 · 0 Gas"
      icon={Repeat}
      actions={<Badge variant="success">滑点 {slippage}%</Badge>}
    >
      <div className="space-y-2">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">支付</span>
            <span className="text-[10px] text-muted-foreground">
              可用 {fmtNum(available)} NMS
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <Input
              type="number"
              min="0"
              step="any"
              value={amount}
              onChange={(e) => setAmount(sanitizeAmount(e.target.value))}
              className="h-9 flex-1 border-0 bg-transparent px-0 text-lg font-semibold focus-visible:ring-0"
            />
            <select
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="h-8 rounded-lg border border-white/10 bg-white/[0.06] px-2 text-xs"
            >
              {TOKENS.map((t) => (
                <option key={t.symbol} value={t.symbol} className="bg-[#0d1526]">
                  {t.symbol}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-1 flex gap-1">
            {[25, 50, 75, 100].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setAmount(String(((available * p) / 100).toFixed(2)))}
                className="flex-1 rounded-md border border-white/10 py-0.5 text-[9px] text-muted-foreground hover:text-foreground"
              >
                {p}%
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={flip}
            className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 bg-[#0d1526] text-muted-foreground hover:text-cyan-300"
            aria-label="切换币种"
          >
            <ArrowDownUp className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <span className="text-[10px] text-muted-foreground">预计获得</span>
          <div className="mt-1 flex items-center gap-2">
            <span className="num flex-1 truncate text-lg font-semibold text-emerald-300">
              {out ? fmtNum(out, 4) : "—"}
            </span>
            <select
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="h-8 rounded-lg border border-white/10 bg-white/[0.06] px-2 text-xs"
            >
              {TOKENS.map((t) => (
                <option key={t.symbol} value={t.symbol} className="bg-[#0d1526]">
                  {t.symbol}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-0.5 rounded-xl border border-white/10 bg-black/20 p-2.5 text-[10px]">
          <div className="flex justify-between">
            <span className="text-muted-foreground">汇率</span>
            <span className="num">
              1 {from} ≈ {rate ? rate.toFixed(4) : "—"} {to}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">最小获得（含滑点）</span>
            <span className="num">{fmtNum(minOut, 4)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">价格影响</span>
            <span className={`num ${impact > 5 ? "text-rose-300" : "text-emerald-300"}`}>
              {impact.toFixed(2)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">流动性池</span>
            <span className="num text-muted-foreground">{pool?.pool_name || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Fuel className="h-3 w-3" /> Gas
            </span>
            <span className="num text-emerald-300">0（平台补贴）</span>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-white/10 px-2.5 py-1.5">
          <Settings2 className="h-3 w-3 shrink-0 text-muted-foreground" />
          <span className="shrink-0 text-[10px] text-muted-foreground">滑点</span>
          <Slider value={slippage} min={0.1} max={5} step={0.1} onValueChange={setSlippage} />
          <span className="num w-9 shrink-0 text-right text-[10px]">{slippage}%</span>
        </div>

        <Button className="w-full" onClick={swap} disabled={busy || !out}>
          {busy ? "兑换中…" : `兑换 ${from} → ${to}`}
        </Button>
      </div>
    </SectionCard>
  );
}
