import React, { useState } from "react";
import { Coins, Landmark, Lock, PiggyBank, TrendingUp } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { SectionCard, DataRow } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/textarea";
import { Select, SelectOption } from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import LiquidityManager from "@/components/defi/LiquidityManager";
import { useSession } from "@/hooks/useSession";
import { useEntityList } from "@/hooks/useEntity";
import { fmtNum, sanitizeAmount } from "@/lib/format";
import { base44 } from "@/api/base44Client";

export default function DeFi() {
  const { balance, refresh } = useSession();
  const { data: pools } = useEntityList("LiquidityPool", {}, "-apy", 20);
  const [term, setTerm] = useState("90");
  const [amount, setAmount] = useState("5000");
  const [busy, setBusy] = useState(false);

  const totalTvl = pools.reduce((s, p) => s + (p.tvl || 0), 0);
  const avgApy = pools.length ? pools.reduce((s, p) => s + (p.apy || 0), 0) / pools.length : 0;
  const rate = term === "30" ? 0.12 : term === "90" ? 0.16 : term === "180" ? 0.21 : 0.25;
  const est = (Number(amount) || 0) * rate * (Number(term) / 365);

  const stake = async () => {
    const amt = Number(amount) || 0;
    if (amt <= 0) {
      toast.error("请输入质押数量");
      return;
    }
    if (amt > (balance?.available_nms || 0)) {
      toast.error("可用 NMS 不足");
      return;
    }
    setBusy(true);
    try {
      await base44.entities.UserBalance.update(balance.id, {
        available_nms: (balance.available_nms || 0) - amt,
        locked_nms: (balance.locked_nms || 0) + amt,
      });
      await base44.entities.Transaction.create({
        tx_hash: `0x${Math.random().toString(16).slice(2).padEnd(40, "0")}`,
        block_number: 18492000 + Math.floor(Math.random() * 5000),
        from_address: balance.user_email,
        to_address: "NMS-STAKING",
        amount: amt,
        token_type: "NMS",
        status: "confirmed",
        gas_fee: 0,
      });
      toast.success(`质押成功，${term} 天后可赎回`);
      refresh();
    } catch (e) {
      toast.error("质押失败");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        icon={TrendingUp}
        title="DeFi 金融"
        subtitle="流动性挖矿 · 定期质押（12-25% 年化）· YSE 收益分配 · 释放加速叠加"
        badge={<Badge variant="success">0 Gas</Badge>}
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard label="全网 TVL" value={fmtNum(totalTvl)} unit="ACS" icon={Landmark} accent="cyan" />
        <StatCard label="平均 APY" value={avgApy.toFixed(1)} unit="%" icon={TrendingUp} accent="emerald" />
        <StatCard label="流动性池" value={pools.length} unit="个" icon={PiggyBank} accent="violet" />
        <StatCard label="已质押" value={fmtNum(balance?.locked_nms || 0)} unit="NMS" icon={Lock} accent="amber" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <LiquidityManager balance={balance} />

        <SectionCard title="定期质押" desc="锁仓期越长年化越高，到期自动赎回" icon={PiggyBank}>
          <div className="space-y-2">
            <div>
              <Label>质押数量（NMS）</Label>
              <Input
                className="mt-1"
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
                    onClick={() => setAmount(String((((balance?.available_nms || 0) * p) / 100).toFixed(2)))}
                    className="flex-1 rounded-md border border-white/10 py-0.5 text-[9px] text-muted-foreground hover:text-foreground"
                  >
                    {p}%
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>锁仓期限</Label>
              <Select className="mt-1" value={term} onChange={(e) => setTerm(e.target.value)}>
                <SelectOption value="30">30 天 · 12% 年化</SelectOption>
                <SelectOption value="90">90 天 · 16% 年化</SelectOption>
                <SelectOption value="180">180 天 · 21% 年化</SelectOption>
                <SelectOption value="365">365 天 · 25% 年化</SelectOption>
              </Select>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
              <DataRow label="预计收益" value={`${fmtNum(est)} NMS`} valueClass="text-emerald-300" />
              <DataRow label="到期日" value={new Date(Date.now() + Number(term) * 86400000).toLocaleDateString("zh-CN")} />
              <DataRow label="释放加速" value="质押期间 +0.2x 叠加" valueClass="text-violet-300" />
            </div>
            <Button className="w-full" variant="success" onClick={stake} disabled={busy}>
              <Coins className="h-4 w-4" /> {busy ? "质押中…" : "确认质押"}
            </Button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
