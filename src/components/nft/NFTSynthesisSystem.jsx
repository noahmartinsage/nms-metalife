import React, { useMemo, useState } from "react";
import { ArrowRight, Combine, Layers, Sparkles } from "lucide-react";
import { SectionCard, EmptyState } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { base44 } from "@/api/base44Client";
import { fmtNum } from "@/lib/format";
import { cn } from "@/lib/utils";
import NFTArt from "./NFTArt";

const RARITY_ORDER = ["common", "rare", "epic", "legendary"];

/** NFT 合成系统（9×9×9 矩阵 · 3 合 1 升级） */
export default function NFTSynthesisSystem({ nfts = [], balance, onDone }) {
  const [picked, setPicked] = useState([]);
  const [busy, setBusy] = useState(false);

  const owned = useMemo(() => nfts.filter((n) => n.owner_email === balance?.user_email), [nfts, balance]);

  const toggle = (id) => {
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= 3 ? p : [...p, id]));
  };

  const selected = owned.filter((n) => picked.includes(n.id));
  const canSynth = selected.length === 3 && new Set(selected.map((s) => s.rarity)).size === 1;

  const synthesize = async () => {
    if (!canSynth) {
      toast.error("需选择 3 个同稀有度 NFT");
      return;
    }
    setBusy(true);
    try {
      const base = selected[0];
      const nextRarity = RARITY_ORDER[Math.min(3, RARITY_ORDER.indexOf(base.rarity) + 1)];
      const totalPrice = selected.reduce((s, n) => s + n.price, 0);
      await base44.entities.NFTItem.create({
        name: `${base.name.split("·")[0]} · 合成 S${(base.synthesis_level || 0) + 1}`,
        description: `由 3 个 ${base.rarity} 级 NFT 合成，释放维度 +1，版税与分红权益按合成等级叠加。`,
        nft_type: base.nft_type,
        category: base.category,
        price: Math.round(totalPrice * 1.25),
        original_value: totalPrice,
        royalty_percent: 10,
        owner_email: balance?.user_email,
        creator_email: base.creator_email,
        merchant_id: base.merchant_id,
        merchant_name: base.merchant_name,
        token_id: `#S${Math.floor(Math.random() * 9000 + 1000)}`,
        rarity: nextRarity,
        is_for_sale: false,
        trade_count: 0,
        total_royalty_earned: 0,
        dividend_earned: 0,
        synthesis_level: (base.synthesis_level || 0) + 1,
        synthesized_from: picked,
      });
      await Promise.all(picked.map((id) => base44.entities.NFTItem.delete(id)));
      if (balance?.id) {
        await base44.entities.UserBalance.update(balance.id, {
          nft_synthesis_level: Math.min(9, (balance.nft_synthesis_level || 0) + 1),
        });
      }
      toast.success(`合成成功！NFT 合成维度 +1（${nextRarity}）`);
      setPicked([]);
      onDone?.();
    } catch (e) {
      toast.error("合成失败");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SectionCard
      title="NFT 合成矩阵"
      desc="3 个同级 NFT 合成 1 个高阶 NFT，NFT 合成维度 +1（最高 9 级）"
      icon={Combine}
      actions={<Badge variant="purple">当前 {balance?.nft_synthesis_level || 0}/9 级</Badge>}
    >
      <div className="flex gap-1">
        {Array.from({ length: 9 }, (_, i) => {
          const on = i < (balance?.nft_synthesis_level || 0);
          return (
            <div
              key={i}
              className={cn(
                "flex-1 rounded-lg border py-1 text-center text-[9px]",
                on ? "border-violet-400/40 bg-violet-400/15 text-violet-200" : "border-white/10 text-muted-foreground"
              )}
            >
              S{i + 1}
            </div>
          );
        })}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => {
          const n = selected[i];
          return (
            <div
              key={i}
              className={cn(
                "grid h-20 place-items-center rounded-xl border border-dashed",
                n ? "border-transparent" : "border-white/15 bg-white/[0.02]"
              )}
            >
              {n ? <NFTArt nft={n} className="h-20 w-full" /> : <Layers className="h-5 w-5 text-muted-foreground/50" />}
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
        <span>3 个同级</span>
        <ArrowRight className="h-3 w-3" />
        <span className="flex items-center gap-1 text-violet-300">
          <Sparkles className="h-3 w-3" /> 1 个高阶（价值 +25%）
        </span>
      </div>

      <div className="mt-3">
        {owned.length === 0 ? (
          <EmptyState title="暂无可合成 NFT" desc="消费铸造或二级市场购买后可参与合成" />
        ) : (
          <div className="grid max-h-52 grid-cols-4 gap-1.5 overflow-y-auto sm:grid-cols-6">
            {owned.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => toggle(n.id)}
                className={cn(
                  "rounded-lg border p-1 text-left transition-colors",
                  picked.includes(n.id)
                    ? "border-violet-400/60 bg-violet-400/10"
                    : "border-white/10 bg-white/[0.02] hover:border-white/25"
                )}
              >
                <NFTArt nft={n} className="h-12 w-full" />
                <p className="mt-0.5 truncate text-[9px]">{n.name}</p>
                <p className="num text-[8px] text-muted-foreground">{fmtNum(n.price)}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      <Button className="mt-3 w-full" onClick={synthesize} disabled={!canSynth || busy}>
        <Combine className="h-4 w-4" />
        {busy ? "合成中…" : canSynth ? `合成 3 个 NFT（${selected[0]?.rarity}）` : "请选择 3 个同稀有度 NFT"}
      </Button>
    </SectionCard>
  );
}
