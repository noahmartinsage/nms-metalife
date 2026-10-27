import React from "react";
import { Coins, Gift, PiggyBank, Receipt, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { fmtNum } from "@/lib/format";

const SOURCES = [
  { key: "消费返利", icon: Receipt, ratio: 0.46, color: "#22d3ee" },
  { key: "版税分成", icon: Sparkles, ratio: 0.18, color: "#a855f7" },
  { key: "NFT 分红", icon: Gift, ratio: 0.16, color: "#f59e0b" },
  { key: "推荐级差", icon: Coins, ratio: 0.14, color: "#34d399" },
  { key: "DeFi 收益", icon: PiggyBank, ratio: 0.06, color: "#fb7185" },
];

/** 收益明细弹窗 */
export default function EarningsDetailModal({ open, onOpenChange, balance }) {
  const total = balance?.total_rewards || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-amber-300" /> 收益明细
          </DialogTitle>
          <DialogDescription>累计收益 {fmtNum(total)} NMS，按来源拆解如下</DialogDescription>
        </DialogHeader>

        <div className="space-y-2.5">
          {SOURCES.map((s) => {
            const Icon = s.icon;
            const amount = total * s.ratio;
            return (
              <div key={s.key}>
                <div className="mb-1 flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Icon className="h-3.5 w-3.5" style={{ color: s.color }} /> {s.key}
                  </span>
                  <span className="num font-medium">{fmtNum(amount)}</span>
                </div>
                <Progress
                  value={s.ratio * 100}
                  className="h-1.5"
                  indicatorClassName="transition-all"
                  style={{ background: "rgba(255,255,255,0.08)" }}
                />
                <div className="mt-0.5 text-right text-[9px] text-muted-foreground">
                  占比 {(s.ratio * 100).toFixed(0)}%
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <p className="text-[10px] text-muted-foreground">NFT 分红累计</p>
            <p className="num mt-0.5 text-sm font-semibold text-violet-300">
              {fmtNum(balance?.nft_dividends_total || 0)}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <p className="text-[10px] text-muted-foreground">版税收入累计</p>
            <p className="num mt-0.5 text-sm font-semibold text-amber-300">
              {fmtNum(balance?.royalty_earnings_total || 0)}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
