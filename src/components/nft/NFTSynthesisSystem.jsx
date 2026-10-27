import React, { useMemo, useState } from "react";
import { ArrowRight, Combine, Layers, Plus, Sparkles } from "lucide-react";
import { SectionCard, EmptyState } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { base44 } from "@/api/base44Client";
import { fmtNum } from "@/lib/format";
import { cn } from "@/lib/utils";
import NFTArt from "./NFTArt";

const RARITY_ORDER = ["common", "rare", "epic", "legendary"];
const TONGBAO_COST = 800;
const isTongbao = (n) => n?.name?.includes("合成通宝");

/**
 * NFT 合成系统（白皮书 5.3）
 * 规则：2 张同店 NFT + 1 张合成通宝 → 更高等级 NFT
 * 9×9×9 矩阵共 729 种组合
 */
export default function NFTSynthesisSystem({ nfts = [], balance, onDone }) {
  const [picked, setPicked] = useState([]);
  const [busy, setBusy] = useState(false);

  const owned = useMemo(() => nfts.filter((n) => n.owner_email === balance?.user_email), [nfts, balance]);
  const tongbaos = owned.filter(isTongbao);
  const materials = owned.filter((n) => !isTongbao(n));

  const selected = owned.filter((n) => picked.includes(n.id));
  const pickedMaterials = selected.filter((n) => !isTongbao(n));
  const pickedTongbao = selected.filter(isTongbao);

  const sameStore =
    pickedMaterials.length === 2 &&
    (pickedMaterials[0].merchant_id
      ? pickedMaterials[0].merchant_id === pickedMaterials[1].merchant_id
      : pickedMaterials[0].nft_type === pickedMaterials[1].nft_type);

  const canSynth = pickedMaterials.length === 2 && pickedTongbao.length === 1 && sameStore;

  const toggle = (n) => {
    setPicked((p) => {
      if (p.includes(n.id)) return p.filter((x) => x !== n.id);
      if (p.length >= 3) {
        toast.error("最多选择 3 个：2 张同店 NFT + 1 张合成通宝");
        return p;
      }
      return [...p, n.id];
    });
  };

  const mintTongbao = async () => {
    if ((balance?.available_nms || 0) < TONGBAO_COST) {
      toast.error(`可用 NMS 不足，铸造需 ${TONGBAO_COST} NMS`);
      return;
    }
    setBusy(true);
    try {
      await base44.entities.NFTItem.create({
        name: `合成通宝 #${Math.floor(Math.random() * 9000 + 1000)}`,
        description: `合成通宝：NFT 合成的必需材料，与 2 张同店 NFT 一起可合成更高等级 NFT。`,
        nft_type: "personal",
        category: "其他",
        price: TONGBAO_COST,
        original_value: TONGBAO_COST,
        royalty_percent: 10,
        owner_email: balance?.user_email,
        creator_email: balance?.user_email,
        token_id: `#T${Math.floor(Math.random() * 9000 + 1000)}`,
        is_for_sale: false,
        rarity: "common",
        trade_count: 0,
        total_royalty_earned: 0,
        dividend_earned: 0,
        synthesis_level: 0,
      });
      await base44.entities.UserBalance.update(balance.id, {
        available_nms: (balance.available_nms || 0) - TONGBAO_COST,
      });
      toast.success("合成通宝铸造成功");
      onDone?.();
    } catch (e) {
      toast.error("铸造失败");
    } finally {
      setBusy(false);
    }
  };

  const synthesize = async () => {
    if (!canSynth) {
      toast.error("需 2 张同店 NFT + 1 张合成通宝");
      return;
    }
    setBusy(true);
    try {
      const base = pickedMaterials[0];
      const nextRarity = RARITY_ORDER[Math.min(3, RARITY_ORDER.indexOf(base.rarity) + 1)];
      const totalPrice = pickedMaterials.reduce((s, n) => s + n.price, 0);
      await base44.entities.NFTItem.create({
        name: `${(base.merchant_name || base.name).split("·")[0]} · 合成 S${(base.synthesis_level || 0) + 1}`,
        description: `由 2 张同店 NFT + 1 张合成通宝合成，稀有度提升至 ${nextRarity}，分红率与释放维度同步提升。`,
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
      toast.success(`合成成功！稀有度提升至 ${nextRarity}，NFT 合成维度 +1`);
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
      desc="2 张同店 NFT + 1 张合成通宝 → 高阶 NFT · 9×9×9 共 729 种组合"
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
          const expectTongbao = i === 2;
          return (
            <div
              key={i}
              className={cn(
                "grid h-20 place-items-center rounded-xl border border-dashed",
                n ? "border-transparent" : "border-white/15 bg-white/[0.02]"
              )}
            >
              {n ? (
                <NFTArt nft={n} className="h-20 w-full" />
              ) : (
                <div className="text-center">
                  {expectTongbao ? (
                    <Plus className="mx-auto h-4 w-4 text-violet-300/60" />
                  ) : (
                    <Layers className="mx-auto h-4 w-4 text-muted-foreground/50" />
                  )}
                  <p className="mt-0.5 text-[8px] text-muted-foreground">
                    {expectTongbao ? "合成通宝" : `同店材料 ${i + 1}`}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
        <span>2 同店 + 1 通宝</span>
        <ArrowRight className="h-3 w-3" />
        <span className="flex items-center gap-1 text-violet-300">
          <Sparkles className="h-3 w-3" /> 高阶 NFT（价值 +25%）
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Button size="sm" variant="outline" onClick={mintTongbao} disabled={busy}>
          <Plus className="h-3 w-3" /> 铸造合成通宝（{TONGBAO_COST} NMS）
        </Button>
        <span className="text-[9px] text-muted-foreground">已有 {tongbaos.length} 张通宝</span>
      </div>

      <div className="mt-2">
        {owned.length === 0 ? (
          <EmptyState title="暂无可合成 NFT" desc="消费铸造或二级市场购买后可参与合成" />
        ) : (
          <div className="grid max-h-56 grid-cols-4 gap-1.5 overflow-y-auto sm:grid-cols-6">
            {owned.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => toggle(n)}
                className={cn(
                  "rounded-lg border p-1 text-left transition-colors",
                  picked.includes(n.id)
                    ? "border-violet-400/60 bg-violet-400/10"
                    : "border-white/10 bg-white/[0.02] hover:border-white/25"
                )}
              >
                <NFTArt nft={n} className="h-12 w-full" />
                <p className="mt-0.5 truncate text-[9px]">{n.name}</p>
                <p className="num text-[8px] text-muted-foreground">
                  {isTongbao(n) ? "通宝" : fmtNum(n.price)}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      <Button className="mt-3 w-full" onClick={synthesize} disabled={!canSynth || busy}>
        <Combine className="h-4 w-4" />
        {busy
          ? "合成中…"
          : canSynth
            ? `合成高阶 NFT（${pickedMaterials[0]?.rarity} → 升级）`
            : pickedMaterials.length === 2 && !sameStore
              ? "两张材料需来自同一门店"
              : "请选择 2 张同店 NFT + 1 张合成通宝"}
      </Button>
    </SectionCard>
  );
}
