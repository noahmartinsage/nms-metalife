import React, { useMemo, useState } from "react";
import { Image as ImageIcon, Plus, Store, TrendingUp } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { SectionCard, EmptyState } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import NFTGrid from "@/components/nft/NFTGrid";
import NFTDetailDrawer from "@/components/nft/NFTDetailDrawer";
import NFTSynthesisSystem from "@/components/nft/NFTSynthesisSystem";
import PersonalNFTPublish from "@/components/nft/PersonalNFTPublish";
import ConsumptionProofMint from "@/components/nft/ConsumptionProofMint";
import RWANFTListingModal from "@/components/merchant/RWANFTListingModal";
import { useEntityList } from "@/hooks/useEntity";
import { useSession } from "@/hooks/useSession";
import { fmtNum } from "@/lib/format";

export default function NFTMarket() {
  const { balance, user, refresh } = useSession();
  const { data: nfts, loading } = useEntityList("NFTItem", {}, "-created_date", 100);
  const [active, setActive] = useState(null);
  const [rwaOpen, setRwaOpen] = useState(false);

  const mine = useMemo(() => nfts.filter((n) => n.owner_email === user?.email), [nfts, user]);
  const forSale = useMemo(() => nfts.filter((n) => n.is_for_sale), [nfts]);
  const totalValue = mine.reduce((s, n) => s + (n.price || 0), 0);

  return (
    <div className="space-y-4">
      <PageHeader
        icon={ImageIcon}
        title="AI 商城 · NFT 与 RWA"
        subtitle="四类 NFT（实物 / 门店 / 节点 / 个人）· 消费即铸造 · 永久版税四方分成 · 9×9×9 合成"
        badge={<Badge variant="purple">RWA 已融合</Badge>}
        actions={
          <Button size="sm" onClick={() => setRwaOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> RWA 上架
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          ["我的 NFT", `${mine.length} 个`, "text-cyan-300"],
          ["持仓估值", `${fmtNum(totalValue)} NMS`, "text-emerald-300"],
          ["在售商品", `${forSale.length} 个`, "text-violet-300"],
          ["合成维度", `${balance?.nft_synthesis_level || 0}/9`, "text-amber-300"],
        ].map(([k, v, c]) => (
          <div key={k} className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
            <p className="text-[10px] text-muted-foreground">{k}</p>
            <p className={`num mt-0.5 text-sm font-semibold ${c}`}>{v}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="market">
        <TabsList>
          <TabsTrigger value="market">AI 商城</TabsTrigger>
          <TabsTrigger value="secondary">二级市场</TabsTrigger>
          <TabsTrigger value="mine">我的 NFT</TabsTrigger>
          <TabsTrigger value="synth">合成</TabsTrigger>
          <TabsTrigger value="publish">发行 / 凭证</TabsTrigger>
        </TabsList>

        <TabsContent value="market">
          <SectionCard title="全部商品" desc="实物资产已通过 RWA 五步确权" icon={Store}>
            <NFTGrid items={nfts} loading={loading} onSelect={setActive} />
          </SectionCard>
        </TabsContent>

        <TabsContent value="secondary">
          <SectionCard
            title="二级市场"
            desc="成交自动结算 10% 永久版税（四方各 2.5%）"
            icon={TrendingUp}
          >
            {forSale.length === 0 ? (
              <EmptyState title="暂无挂单" desc="在「我的 NFT」中可将资产挂单出售" />
            ) : (
              <NFTGrid items={forSale} onSelect={setActive} />
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="mine">
          <SectionCard title="我的 NFT" desc={`共 ${mine.length} 个，估值 ${fmtNum(totalValue)} NMS`} icon={ImageIcon}>
            {mine.length === 0 ? (
              <EmptyState title="你还没有 NFT" desc="扫码消费即可自动铸造实物 NFT" />
            ) : (
              <NFTGrid items={mine} onSelect={setActive} />
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="synth">
          <NFTSynthesisSystem nfts={nfts} balance={balance} onDone={refresh} />
        </TabsContent>

        <TabsContent value="publish">
          <div className="grid gap-4 lg:grid-cols-2">
            <PersonalNFTPublish balance={balance} onDone={refresh} />
            <ConsumptionProofMint balance={balance} onDone={refresh} />
          </div>
        </TabsContent>
      </Tabs>

      <NFTDetailDrawer
        nft={active}
        open={!!active}
        onOpenChange={(v) => !v && setActive(null)}
        onBought={refresh}
      />
      <RWANFTListingModal open={rwaOpen} onOpenChange={setRwaOpen} balance={balance} onDone={refresh} />
    </div>
  );
}
