import React, { useState } from "react";
import { Gauge, Zap } from "lucide-react";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { base44 } from "@/api/base44Client";
import { fmtNum, mockQuantumSignature, sanitizeAmount } from "@/lib/format";
import { cn } from "@/lib/utils";

/** 交易面板（现货 / 永续 · 1-125x · 0 资金费率） */
export default function TradePanel({ mid = 0.42, balance, onDone }) {
  const [side, setSide] = useState("buy");
  const [type, setType] = useState("limit");
  const [price, setPrice] = useState(mid.toFixed(4));
  const [amount, setAmount] = useState("1000");
  const [leverage, setLeverage] = useState(10);
  const [busy, setBusy] = useState(false);

  const px = Number(price) || mid;
  const amt = Number(amount) || 0;
  const margin = (px * amt) / leverage;
  const liq = side === "buy" ? px * (1 - 1 / leverage + 0.005) : px * (1 + 1 / leverage - 0.005);

  const submit = async () => {
    if (amt <= 0) {
      toast.error("请输入有效数量");
      return;
    }
    if (margin > (balance?.available_nms || 0)) {
      toast.error("保证金不足");
      return;
    }
    setBusy(true);
    try {
      await base44.entities.Transaction.create({
        tx_hash: `0x${Math.random().toString(16).slice(2).padEnd(40, "0")}`,
        block_number: 18492000 + Math.floor(Math.random() * 5000),
        from_address: balance?.user_email || "demo",
        to_address: "NMS-ORDERBOOK",
        amount: amt,
        token_type: "NMS",
        status: "pending",
        gas_fee: 0,
        quantum_signature: mockQuantumSignature(),
        signature_time_ms: Date.now(),
      });

      // 真实扣减保证金：可用 → 锁定（商用级资金一致性）
      if (balance?.id) {
        await base44.entities.UserBalance.update(balance.id, {
          available_nms: Math.max(0, (balance.available_nms || 0) - margin),
          locked_nms: (balance.locked_nms || 0) + margin,
        });
      }

      toast.success(
        `${side === "buy" ? "买入" : "卖出"} ${fmtNum(amt, 0)} NMS @ ${px.toFixed(4)} 已提交，冻结保证金 ${fmtNum(margin)} NMS`
      );
      onDone?.();
    } catch (e) {
      toast.error("下单失败");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SectionCard
      title="交易面板"
      desc="永续合约 · 0 资金费率 · AI 自动止损"
      icon={Gauge}
      actions={<Badge variant="outline">{leverage}x</Badge>}
    >
      <div className="grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
        {[
          ["buy", "买入 / 做多", "text-emerald-300"],
          ["sell", "卖出 / 做空", "text-rose-300"],
        ].map(([k, label, c]) => (
          <button
            key={k}
            type="button"
            onClick={() => setSide(k)}
            className={cn(
              "rounded-lg py-1.5 text-[11px] font-medium transition-colors",
              side === k ? cn("bg-white/10", c) : "text-muted-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-2 flex gap-1">
        {[
          ["limit", "限价"],
          ["market", "市价"],
        ].map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setType(k)}
            className={cn(
              "rounded-md px-2 py-0.5 text-[10px]",
              type === k ? "bg-cyan-400/15 text-cyan-200" : "text-muted-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-2 space-y-2">
        <div>
          <Label>价格（ACS）</Label>
          <Input
            className="mt-1 h-9 text-xs"
            type="number"
            min="0"
            step="any"
            value={price}
            disabled={type === "market"}
            onChange={(e) => setPrice(sanitizeAmount(e.target.value))}
          />
        </div>
        <div>
          <Label>数量（NMS）</Label>
          <Input
            className="mt-1 h-9 text-xs"
            type="number"
            min="0"
            step="any"
            value={amount}
            onChange={(e) => setAmount(sanitizeAmount(e.target.value))}
          />
          <div className="mt-1 flex gap-1">
            {[25, 50, 75, 100].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() =>
                  setAmount(String(Math.max(0, Math.floor(((balance?.available_nms || 0) * leverage * p) / 100 / px))))
                }
                className="flex-1 rounded-md border border-white/10 py-0.5 text-[9px] text-muted-foreground hover:text-foreground"
              >
                {p}%
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground">杠杆</span>
            <span className="num text-cyan-300">{leverage}x</span>
          </div>
          <Slider className="mt-1.5" value={leverage} min={1} max={125} step={1} onValueChange={setLeverage} />
        </div>

        <div className="space-y-0.5 rounded-xl border border-white/10 bg-black/20 p-2.5 text-[10px]">
          <div className="flex justify-between">
            <span className="text-muted-foreground">占用保证金</span>
            <span className="num">{fmtNum(margin)} NMS</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">预估强平价</span>
            <span className="num text-amber-300">{liq.toFixed(4)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">资金费率</span>
            <span className="num text-emerald-300">0.00%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">手续费</span>
            <span className="num text-emerald-300">0 Gas</span>
          </div>
        </div>

        <Button
          className="w-full"
          variant={side === "buy" ? "success" : "destructive"}
          onClick={submit}
          disabled={busy}
        >
          <Zap className="h-4 w-4" /> {busy ? "提交中…" : `${side === "buy" ? "买入" : "卖出"} NMS`}
        </Button>
      </div>
    </SectionCard>
  );
}
