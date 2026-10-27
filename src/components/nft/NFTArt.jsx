import React from "react";
import { Boxes, Crown, Gem, Package, Sparkles, Store, User } from "lucide-react";
import { cn } from "@/lib/utils";

const TYPE_META = {
  physical: { label: "实物", icon: Package, from: "from-cyan-500/30", to: "to-sky-600/10", color: "#22d3ee" },
  store: { label: "门店", icon: Store, from: "from-emerald-500/30", to: "to-teal-600/10", color: "#34d399" },
  node: { label: "节点", icon: Boxes, from: "from-violet-500/30", to: "to-fuchsia-600/10", color: "#a78bfa" },
  personal: { label: "个人", icon: User, from: "from-amber-500/30", to: "to-orange-600/10", color: "#fbbf24" },
};

export const RARITY_META = {
  common: { label: "普通", color: "#94a3b8", icon: Sparkles },
  rare: { label: "稀有", color: "#38bdf8", icon: Gem },
  epic: { label: "史诗", color: "#a78bfa", icon: Sparkles },
  legendary: { label: "传说", color: "#fbbf24", icon: Crown },
};

/** NFT 视觉（纯 CSS 生成，无外部图片依赖） */
export default function NFTArt({ nft, className }) {
  const meta = TYPE_META[nft.nft_type] || TYPE_META.physical;
  const Icon = meta.icon;
  const rarity = RARITY_META[nft.rarity] || RARITY_META.common;

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br",
        meta.from,
        meta.to,
        className
      )}
    >
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div
        className="absolute -right-6 -top-6 h-20 w-20 rounded-full blur-2xl"
        style={{ background: `${rarity.color}55` }}
      />
      <Icon className="relative h-8 w-8" style={{ color: meta.color }} />
      <span
        className="absolute left-1.5 top-1.5 rounded-md px-1.5 py-0.5 text-[9px] font-medium backdrop-blur"
        style={{ background: `${rarity.color}22`, color: rarity.color }}
      >
        {rarity.label}
      </span>
      <span className="absolute bottom-1.5 right-1.5 rounded-md bg-black/40 px-1.5 py-0.5 text-[9px] text-white/80 backdrop-blur">
        {meta.label}
      </span>
      {nft.synthesis_level > 0 && (
        <span className="absolute right-1.5 top-1.5 rounded-md bg-violet-500/25 px-1.5 py-0.5 text-[9px] text-violet-200 backdrop-blur">
          S{nft.synthesis_level}
        </span>
      )}
    </div>
  );
}

export { TYPE_META };
