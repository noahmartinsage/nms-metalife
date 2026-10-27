import React from "react";
import { BadgeCheck, Gift, Sparkles, Timer, Zap } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fmtNum } from "@/lib/format";
import { buildReleaseSchedule, calcRoyaltySplit } from "@/lib/engine";
import { useSession } from "@/hooks/useSession";

/** 支付结果弹窗（元Pay 品牌 · 分红明细 · 释放计划 · 版税分配） */
export default function PaymentResultModal({ open, onOpenChange, result }) {
  const { balance } = useSession();
  const split = result?.split;
  const amount = split?.amount || 0;
  const royalty = calcRoyaltySplit(amount, 10);
  const schedule = buildReleaseSchedule({
    pendingNms: amount,
    releaseDays: balance?.release_days || 999,
    days: 7,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <div className="flex flex-col items-center pt-2 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-900 shadow-lg shadow-emerald-500/30">
            <BadgeCheck className="h-7 w-7" />
          </span>
          <p className="mt-2 text-xs text-muted-foreground">元Pay · 链上结算成功</p>
          <p className="num mt-1 text-3xl font-bold">¥{fmtNum(amount)}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{result?.merchant?.store_name}</p>
          <div className="mt-2 flex gap-1.5">
            <Badge variant="success">
              <Zap className="h-2.5 w-2.5" /> 0 Gas
            </Badge>
            <Badge variant="default">量子签名已存证</Badge>
          </div>
        </div>

        {split && (
          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <p className="mb-1.5 text-[11px] font-medium">分红拆解</p>
            {[
              ["消费者 1:1 返利", `+${fmtNum(split.userReward)} NMS`, "text-emerald-300"],
              ["商家打赏成本", `-${fmtNum(split.merchantConsumed)} NMS`, "text-rose-300"],
              ["商家双倍返还", `+${fmtNum(split.merchantReturn)} NMS`, "text-emerald-300"],
              ["VIP 推荐人 20%", `+${fmtNum(split.vipReward)} NMS`, "text-cyan-300"],
              ["级差奖励 72.9%", `+${fmtNum(split.levelDiffReward)} NMS`, "text-violet-300"],
              ["杰出贡献 7.1%", `+${fmtNum(split.contributorReward)} NMS`, "text-amber-300"],
              ["NFT 分红池", `+${fmtNum(split.nftPoolAdd)} NMS`, "text-fuchsia-300"],
            ].map(([k, v, c]) => (
              <div key={k} className="flex items-center justify-between py-0.5 text-[11px]">
                <span className="text-muted-foreground">{k}</span>
                <span className={`num font-medium ${c}`}>{v}</span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-2 grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Sparkles className="h-3 w-3" /> 永久版税四方分配
            </p>
            <div className="mt-1 space-y-0.5 text-[10px]">
              {[
                ["推荐人", royalty.referrer],
                ["商家", royalty.merchant],
                ["节点", royalty.node],
                ["平台", royalty.platform],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-muted-foreground">{k} 2.5%</span>
                  <span className="num">{fmtNum(v)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Gift className="h-3 w-3" /> 已铸造 NFT
            </p>
            <p className="mt-1 truncate text-[11px] font-medium">{result?.nft?.name || "消费凭证"}</p>
            <p className="num text-[10px] text-muted-foreground">
              {result?.nft?.token_id} · {result?.nft?.rarity}
            </p>
            <p className="mt-1 text-[10px] text-emerald-300">RWA 确权完成</p>
          </div>
        </div>

        <div className="mt-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Timer className="h-3 w-3" /> 7 日释放计划（{balance?.release_days || 999} 天周期）
          </p>
          <div className="mt-1.5 flex items-end gap-1">
            {schedule.map((s) => (
              <div key={s.day} className="flex-1">
                <div
                  className="mx-auto w-full rounded-t bg-gradient-to-t from-cyan-500/40 to-cyan-400/80"
                  style={{ height: `${Math.max(6, (s.amount / (schedule[6].amount || 1)) * 42)}px` }}
                />
                <p className="mt-0.5 text-center text-[8px] text-muted-foreground">D{s.day}</p>
              </div>
            ))}
          </div>
        </div>

        <Button className="mt-4 w-full" variant="success" onClick={() => onOpenChange(false)}>
          完成
        </Button>
      </DialogContent>
    </Dialog>
  );
}
