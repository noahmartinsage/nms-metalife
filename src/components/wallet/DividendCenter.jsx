import React, { useMemo, useState } from "react";
import { Gift, Landmark, RefreshCw, TrendingUp, Wallet } from "lucide-react";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { base44 } from "@/api/base44Client";
import { fmtNum, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const KINDS = {
  consume: { label: "消费返利", color: "text-cyan-300", bg: "bg-cyan-400/10" },
  royalty: { label: "版税分成", color: "text-violet-300", bg: "bg-violet-400/10" },
  store: { label: "门店分红", color: "text-emerald-300", bg: "bg-emerald-400/10" },
  level: { label: "级差奖励", color: "text-amber-300", bg: "bg-amber-400/10" },
  nft: { label: "NFT 分红", color: "text-fuchsia-300", bg: "bg-fuchsia-400/10" },
};

/** 分红中心：明细 / 复投 / 提现 */
export default function DividendCenter({ balance, onDone }) {
  const [busy, setBusy] = useState(false);
  const [claimed, setClaimed] = useState(false);

  const total = balance?.total_rewards || 0;
  const pending = Math.round(total * 0.18);

  const ledger = useMemo(() => {
    const seed = [0.42, 0.18, 0.12, 0.09, 0.07, 0.05, 0.04, 0.03];
    const kinds = ["consume", "royalty", "store", "level", "nft", "consume", "royalty", "store"];
    return seed.map((ratio, i) => ({
      id: `dv_${i}`,
      kind: kinds[i],
      amount: Math.max(1, Math.round(total * ratio * 0.06)),
      at: new Date(Date.now() - (i + 1) * 3600 * 1000 * (i + 3)).toISOString(),
      status: i < 5 ? "settled" : "pending",
    }));
  }, [total]);

  const reinvest = async () => {
    if (!pending) {
      toast.error("暂无可复投分红");
      return;
    }
    setBusy(true);
    try {
      await base44.entities.UserBalance.update(balance.id, {
        available_nms: (balance.available_nms || 0) + pending,
        total_rewards: (balance.total_rewards || 0) + pending,
      });
      setClaimed(true);
      toast.success(`${fmtNum(pending)} NMS 已复投到可用余额，释放维度同步累加`);
      onDone?.();
    } catch (e) {
      toast.error("复投失败");
    } finally {
      setBusy(false);
    }
  };

  const withdraw = async () => {
    if (!pending) {
      toast.error("暂无可提现分红");
      return;
    }
    setBusy(true);
    try {
      await base44.entities.Transaction.create({
        tx_hash: `0x${Math.random().toString(16).slice(2).padEnd(40, "0")}`,
        block_number: 18492000 + Math.floor(Math.random() * 5000),
        from_address: "NMS-DIVIDEND-POOL",
        to_address: balance.user_email,
        amount: pending,
        token_type: "NMS",
        status: "confirmed",
        gas_fee: 0,
      });
      await base44.entities.UserBalance.update(balance.id, {
        available_nms: (balance.available_nms || 0) + pending,
        total_rewards: (balance.total_rewards || 0) + pending,
      });
      setClaimed(true);
      toast.success(`${fmtNum(pending)} NMS 已提现到主账户，0 Gas`);
      onDone?.();
    } catch (e) {
      toast.error("提现失败");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SectionCard
      title="分红中心"
      desc="消费返利 · 版税 · 门店分红 · 级差 · NFT 分红"
      icon={Gift}
      actions={<Badge variant={claimed ? "success" : "warning"}>{claimed ? "已结算" : "待结算"}</Badge>}
    >
      <div className="grid grid-cols-3 gap-1.5 text-center">
        {[
          ["累计分红", fmtNum(total), "text-emerald-300"],
          ["待结算", fmtNum(claimed ? 0 : pending), "text-amber-300"],
          ["本月新增", fmtNum(Math.round(total * 0.12)), "text-cyan-300"],
        ].map(([k, v, c]) => (
          <div key={k} className="rounded-lg border border-white/10 bg-white/[0.03] py-1.5">
            <p className={cn("num text-[11px] font-semibold", c)}>{v}</p>
            <p className="text-[9px] text-muted-foreground">{k}</p>
          </div>
        ))}
      </div>

      <div className="mt-2 max-h-44 space-y-0.5 overflow-y-auto">
        {ledger.map((row) => {
          const meta = KINDS[row.kind];
          return (
            <div key={row.id} className="flex items-center gap-2 rounded-lg bg-white/[0.02] px-2 py-1">
              <span className={cn("rounded px-1 py-0.5 text-[8px]", meta.bg, meta.color)}>{meta.label}</span>
              <span className="num min-w-0 flex-1 truncate text-[9px] text-muted-foreground">{timeAgo(row.at)}</span>
              <span className="num shrink-0 text-[10px] font-medium text-emerald-300">+{fmtNum(row.amount)}</span>
              <span
                className={cn(
                  "shrink-0 text-[8px]",
                  row.status === "settled" ? "text-emerald-400" : "text-amber-400"
                )}
              >
                {row.status === "settled" ? "已入账" : "待结算"}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-2 grid grid-cols-2 gap-1.5">
        <Button size="sm" variant="success" onClick={reinvest} disabled={busy}>
          <RefreshCw className="h-3 w-3" /> 一键复投
        </Button>
        <Button size="sm" variant="outline" onClick={withdraw} disabled={busy}>
          <Wallet className="h-3 w-3" /> 提现到账户
        </Button>
      </div>

      <div className="mt-1.5 flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-2 py-1 text-[9px]">
        <span className="flex items-center gap-1 text-muted-foreground">
          <Landmark className="h-2.5 w-2.5" /> 分红池由智能合约按日结算
        </span>
        <span className="flex items-center gap-1 text-emerald-300">
          <TrendingUp className="h-2.5 w-2.5" /> 0 Gas
        </span>
      </div>
    </SectionCard>
  );
}
