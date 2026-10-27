import React, { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/SectionCard";
import { fmtNum } from "@/lib/format";
import { cn } from "@/lib/utils";
import NFTArt from "./NFTArt";

const TYPES = [
  { key: "all", label: "全部" },
  { key: "physical", label: "实物" },
  { key: "store", label: "门店" },
  { key: "node", label: "节点" },
  { key: "personal", label: "个人" },
];

const RARITIES = [
  { key: "all", label: "全部稀有度" },
  { key: "legendary", label: "传说" },
  { key: "epic", label: "史诗" },
  { key: "rare", label: "稀有" },
  { key: "common", label: "普通" },
];

/** NFT 商品网格 */
export default function NFTGrid({ items = [], onSelect, loading }) {
  const [type, setType] = useState("all");
  const [rarity, setRarity] = useState("all");
  const [kw, setKw] = useState("");
  const [onlySale, setOnlySale] = useState(false);

  const list = useMemo(
    () =>
      items
        .filter((n) => (type === "all" ? true : n.nft_type === type))
        .filter((n) => (rarity === "all" ? true : n.rarity === rarity))
        .filter((n) => (onlySale ? n.is_for_sale : true))
        .filter((n) => (kw ? n.name.includes(kw) || (n.merchant_name || "").includes(kw) : true)),
    [items, type, rarity, kw, onlySale]
  );

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索 NFT / 商家"
            value={kw}
            onChange={(e) => setKw(e.target.value)}
            className="h-9 pl-8 text-xs"
          />
        </div>
        <div className="flex gap-1">
          <select
            value={rarity}
            onChange={(e) => setRarity(e.target.value)}
            className="h-9 rounded-xl border border-white/10 bg-white/[0.04] px-2 text-[11px] text-foreground"
          >
            {RARITIES.map((r) => (
              <option key={r.key} value={r.key} className="bg-[#0d1526]">
                {r.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setOnlySale((v) => !v)}
            className={cn(
              "flex h-9 items-center gap-1 rounded-xl border px-2.5 text-[11px] transition-colors",
              onlySale
                ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-200"
                : "border-white/10 text-muted-foreground"
            )}
          >
            <SlidersHorizontal className="h-3 w-3" /> 在售
          </button>
        </div>
      </div>

      <div className="scroll-x mt-2 gap-1">
        {TYPES.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setType(t.key)}
            className={cn(
              "shrink-0 rounded-lg px-2.5 py-1 text-[11px] transition-colors",
              type === t.key ? "bg-cyan-400/15 text-cyan-200" : "border border-white/10 text-muted-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="py-10 text-center text-xs text-muted-foreground">加载中…</p>
      ) : list.length === 0 ? (
        <div className="mt-3">
          <EmptyState title="没有符合条件的 NFT" desc="调整筛选条件试试" />
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4">
          {list.map((n) => (
            <Card
              key={n.id}
              onClick={() => onSelect?.(n)}
              className="cursor-pointer overflow-hidden transition-all hover:-translate-y-0.5 hover:border-cyan-400/30"
            >
              <CardContent className="p-2">
                <NFTArt nft={n} className="h-24 w-full" />
                <p className="mt-1.5 truncate text-[11px] font-medium">{n.name}</p>
                <p className="truncate text-[9px] text-muted-foreground">{n.merchant_name || "NMS 生态"}</p>
                <div className="mt-1 flex items-center justify-between">
                  <span className="num text-[11px] font-semibold text-cyan-300">{fmtNum(n.price)} NMS</span>
                  {n.is_for_sale ? (
                    <Badge variant="success">在售</Badge>
                  ) : (
                    <span className="text-[9px] text-muted-foreground">持有</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
