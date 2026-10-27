import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Boxes,
  Coins,
  Gavel,
  Globe,
  Landmark,
  Layers,
  Rocket,
  Shield,
  Sparkles,
  Wallet,
} from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { Badge } from "@/components/ui/badge";
import { TOKENS } from "@/lib/promotionData";
import { useEntityList } from "@/hooks/useEntity";
import { fmtNum } from "@/lib/format";
import { createPageUrl } from "@/utils";

const GROUPS = [
  {
    title: "交易与资产",
    icon: Coins,
    items: [
      ["DEX 交易所", "订单簿 + AMM", "DEXTrading"],
      ["AI 商城", "RWA · NFT", "NFTMarket"],
      ["DeFi 挖矿", "流动性 + 质押", "DeFi"],
      ["预测市场", "AI 托管", "PredictionMarket"],
      ["C2C 法币", "担保交易", "OTC"],
      ["定期存款", "12-25% 年化", "FixedDeposit"],
    ],
  },
  {
    title: "身份与社交",
    icon: Globe,
    items: [
      ["元 Social", "P2P 加密社交", "Social"],
      ["社区动态", "消费即分享", "Champions"],
      ["用户动态", "链上行为流", "UserActivity"],
      ["元名片", "DID 身份", "Profile"],
      ["短视频", "内容即资产", "ShortVideo"],
      ["数字版权", "确权与分账", "DigitalRights"],
    ],
  },
  {
    title: "生态与治理",
    icon: Gavel,
    items: [
      ["DAO 治理", "区划 DAO", "Social"],
      ["量子公链", "L1-L4 架构", "QuantumChain"],
      ["链上 Agent", "Agent 经济", "OnChainAgent"],
      ["奇点", "生态终局", "Singularity"],
      ["生命科学", "健康数据资产", "LifeScience"],
      ["云存储", "Hypercore", "CloudStorage"],
      ["元 Life", "生活生态", "MetaLife"],
    ],
  },
];

export default function Discover() {
  const { data: regions } = useEntityList("DAORegion", {}, "-dao_fund", 10);
  const { data: assets } = useEntityList("DataAsset", {}, "-created_date", 10);

  return (
    <div className="space-y-4">
      <PageHeader
        icon={Layers}
        title="发现"
        subtitle="全生态功能导航 · RWA 权证 · DAO 资产池 · 四代币体系"
        badge={<Badge variant="default">V13.0</Badge>}
      />

      <SectionCard title="四代币体系" icon={Coins} desc="NMS / ACS / YSE / GCP">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {TOKENS.map((t) => (
            <div key={t.symbol} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: t.color }}>
                  <span className="h-2 w-2 rounded-full" style={{ background: t.color }} />
                  {t.symbol}
                </span>
                <span className="num text-[9px] text-muted-foreground">{t.supply}</span>
              </div>
              <p className="mt-1 text-[11px]">{t.name}</p>
              <p className="mt-0.5 text-[9px] leading-relaxed text-muted-foreground">{t.use}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-3">
        {GROUPS.map((g) => {
          const Icon = g.icon;
          return (
            <SectionCard key={g.title} title={g.title} icon={Icon}>
              <div className="grid grid-cols-2 gap-1.5">
                {g.items.map(([name, desc, page]) => (
                  <Link
                    key={name + page}
                    to={createPageUrl(page)}
                    className="group rounded-xl border border-white/5 bg-white/[0.02] p-2 transition-colors hover:border-cyan-400/30"
                  >
                    <p className="flex items-center justify-between text-[10px] font-medium">
                      {name}
                      <ArrowRight className="h-2.5 w-2.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </p>
                    <p className="mt-0.5 truncate text-[9px] text-muted-foreground">{desc}</p>
                  </Link>
                ))}
              </div>
            </SectionCard>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="RWA 权证" icon={Boxes} desc="已确权资产凭证 · 可交易 / 可抵押" action={null}>
          <div className="space-y-1.5">
            {assets.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-1.5">
                <div className="min-w-0">
                  <p className="truncate text-[10px] font-medium">{a.asset_name}</p>
                  <p className="num text-[9px] text-muted-foreground">
                    {a.nft_token_id} · {a.data_size} · {a.asset_type}
                  </p>
                </div>
                <div className="text-right">
                  <p className="num text-[10px] text-cyan-300">{fmtNum(a.estimated_value)}</p>
                  <p className="text-[9px] text-muted-foreground">{a.is_listed ? "已挂单" : "持有"}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="DAO 资产池" icon={Landmark} desc="按区划聚合治理资金">
          <div className="space-y-1.5">
            {regions.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-1.5">
                <div>
                  <p className="text-[10px] font-medium">{r.region_name}</p>
                  <p className="text-[9px] text-muted-foreground">{fmtNum(r.member_count, 0)} 成员</p>
                </div>
                <span className="num text-[10px] text-emerald-300">{fmtNum(r.dao_fund)}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {[
          { t: "启动你的生态", d: "购买礼包、开通商家、发布 RWA", icon: Rocket, page: "Home", c: "from-cyan-500/15" },
          { t: "安全与合规", d: "多签 · 审计 · 量子签名", icon: Shield, page: "Monitor", c: "from-emerald-500/15" },
          { t: "Web4.0 钱包", d: "AI + ZK · 自托管多链", icon: Wallet, page: "Wallet", c: "from-violet-500/15" },
        ].map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.t}
              to={createPageUrl(c.page)}
              className={`rounded-2xl border border-white/10 bg-gradient-to-br ${c.c} to-transparent p-3.5`}
            >
              <Icon className="h-4 w-4 text-cyan-300" />
              <p className="mt-1.5 flex items-center gap-1 text-xs font-semibold">
                {c.t} <Sparkles className="h-3 w-3 text-amber-300" />
              </p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">{c.d}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
