import React, { useState } from "react";
import { BadgeCheck, Coins, Layers, ShieldCheck, ShoppingCart, Sparkles, TrendingUp } from "lucide-react";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { base44 } from "@/api/base44Client";
import { calcRoyaltySplit } from "@/lib/engine";
import { fmtNum, mockQuantumSignature, shortHash } from "@/lib/format";
import { useSession } from "@/hooks/useSession";
import NFTArt, { RARITY_META } from "./NFTArt";

/** NFT 详情（购买 → 版税自动结算） */
export default function NFTDetailDrawer({ nft, open, onOpenChange, onBought }) {
  const { balance, user } = useSession();
  const [busy, setBusy] = useState(false);
  if (!nft) return null;

  const royalty = calcRoyaltySplit(nft.price, nft.royalty_percent || 10);
  const sellerReceives = nft.price - royalty.total;
  const isOwner = nft.owner_email === user?.email;
  const rarity = RARITY_META[nft.rarity] || RARITY_META.common;

  const buy = async () => {
    if (!balance?.id) return;
    if ((balance.available_nms || 0) < nft.price) {
      toast.error("可用 NMS 不足，请先充值或释放积分");
      return;
    }
    setBusy(true);
    try {
      await base44.entities.NFTItem.update(nft.id, {
        owner_email: user.email,
        owner_address: `0x${Math.random().toString(16).slice(2).padEnd(40, "0")}`,
        is_for_sale: false,
        trade_count: (nft.trade_count || 0) + 1,
        total_royalty_earned: (nft.total_royalty_earned || 0) + royalty.total,
      });
      await base44.entities.UserBalance.update(balance.id, {
        available_nms: (balance.available_nms || 0) - nft.price,
      });
      await base44.entities.Transaction.create({
        tx_hash: `0x${Math.random().toString(16).slice(2).padEnd(40, "0")}`,
        block_number: 18492000 + Math.floor(Math.random() * 5000),
        from_address: balance.user_email,
        to_address: nft.owner_email,
        amount: nft.price,
        token_type: "NMS",
        status: "confirmed",
        gas_fee: 0,
        quantum_signature: mockQuantumSignature(),
        signature_time_ms: Date.now(),
      });
      toast.success(`购买成功，版税 ${fmtNum(royalty.total)} NMS 已四方结算`);
      onOpenChange(false);
      onBought?.();
    } catch (e) {
      toast.error("购买失败");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <div className="flex gap-3">
          <NFTArt nft={nft} className="h-24 w-24 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2 pr-6">
              <h2 className="text-sm font-semibold leading-tight">{nft.name}</h2>
              <span className="shrink-0 text-[10px]" style={{ color: rarity.color }}>
                {rarity.label}
              </span>
            </div>
            <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
              {nft.merchant_name || "NMS 生态"} · {nft.token_id} · {nft.category}
            </p>
            <p className="num mt-1.5 text-lg font-bold text-cyan-300">{fmtNum(nft.price)} NMS</p>
            <div className="mt-1 flex flex-wrap gap-1">
              <Badge variant="success">
                <ShieldCheck className="h-2.5 w-2.5" /> RWA 已确权
              </Badge>
              <Badge variant="purple">版税 {nft.royalty_percent}%</Badge>
              {nft.synthesis_level > 0 && <Badge variant="outline">合成 S{nft.synthesis_level}</Badge>}
            </div>
          </div>
        </div>

        <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">{nft.description}</p>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
            <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Coins className="h-3 w-3" /> 版税四方分配（10%）
            </p>
            <div className="mt-1 space-y-0.5 text-[10px]">
              {[
                ["推荐人 2.5%", royalty.referrer],
                ["商家 2.5%", royalty.merchant],
                ["节点 2.5%", royalty.node],
                ["平台 2.5%", royalty.platform],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="num">{fmtNum(v)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
            <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <TrendingUp className="h-3 w-3" /> 资产信息
            </p>
            <div className="mt-1 space-y-0.5 text-[10px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">原值</span>
                <span className="num">¥{fmtNum(nft.original_value)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">成交次数</span>
                <span className="num">{nft.trade_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">累计版税</span>
                <span className="num text-emerald-300">{fmtNum(nft.total_royalty_earned)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">累计分红</span>
                <span className="num text-violet-300">{fmtNum(nft.dividend_earned)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-[10px]">
          <span className="flex items-center gap-1 text-muted-foreground">
            <Layers className="h-3 w-3" /> 持有者 {shortHash(nft.owner_address)}
          </span>
          <span className="num text-muted-foreground">
            卖家实收 {fmtNum(sellerReceives)} NMS
          </span>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
          {isOwner ? (
            <Button variant="secondary" disabled>
              <BadgeCheck className="h-4 w-4" /> 你已持有
            </Button>
          ) : (
            <Button onClick={buy} disabled={busy || !nft.is_for_sale}>
              <ShoppingCart className="h-4 w-4" /> {nft.is_for_sale ? (busy ? "结算中…" : "立即购买") : "未挂单"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { Sparkles };
