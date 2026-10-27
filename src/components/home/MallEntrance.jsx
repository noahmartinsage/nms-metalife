import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Store, QrCode, Gift, Coins, Landmark, Sparkles, CreditCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { createPageUrl } from "@/utils";

const ENTRIES = [
  { name: "AI 商城", desc: "RWA 实物 / 门店股权", icon: Store, page: "NFTMarket", color: "from-cyan-500/20 to-sky-500/5 text-cyan-300" },
  { name: "扫码支付", desc: "DID 打赏 · 链上结算", icon: QrCode, page: "PaymentCenter", color: "from-emerald-500/20 to-teal-500/5 text-emerald-300" },
  { name: "红包雨", desc: "商家红包 · 社区分红", icon: Gift, page: "Social", color: "from-rose-500/20 to-pink-500/5 text-rose-300" },
  { name: "DeFi 挖矿", desc: "年化 12-25%", icon: Coins, page: "DeFi", color: "from-amber-500/20 to-orange-500/5 text-amber-300" },
  { name: "DAO 治理", desc: "区划 DAO · 提案投票", icon: Landmark, page: "Discover", color: "from-violet-500/20 to-fuchsia-500/5 text-violet-300" },
  { name: "AI 管家", desc: "32 项智能能力", icon: Sparkles, page: "AIAssistant", color: "from-sky-500/20 to-indigo-500/5 text-sky-300" },
  { name: "C2C 法币", desc: "8 币种 · 担保交易", icon: CreditCard, page: "OTC", color: "from-teal-500/20 to-emerald-500/5 text-teal-300" },
];

/** 商城 / 功能入口 */
export default function MallEntrance() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">生态入口</h3>
          <Link to={createPageUrl("Discover")} className="flex items-center gap-0.5 text-[11px] text-cyan-300">
            全部 <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-7">
          {ENTRIES.map((e) => {
            const Icon = e.icon;
            return (
              <Link
                key={e.page}
                to={createPageUrl(e.page)}
                className="group flex flex-col items-center gap-1.5 rounded-xl border border-white/5 bg-white/[0.02] p-2 text-center transition-all hover:-translate-y-0.5 hover:border-white/15"
              >
                <span className={`grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br ${e.color}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-[10px] font-medium leading-tight">{e.name}</span>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
