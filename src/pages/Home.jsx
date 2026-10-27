import React from "react";
import { Link } from "react-router-dom";
import { Bot, Home as HomeIcon, Sparkles, Users } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import BalanceOverview from "@/components/home/BalanceOverview";
import SignInCard from "@/components/home/SignInCard";
import VIPGiftPackage from "@/components/home/VIPGiftPackage";
import NMSIntro from "@/components/home/NMSIntro";
import MallEntrance from "@/components/home/MallEntrance";
import OnChainAssetDashboard from "@/components/dashboard/OnChainAssetDashboard";
import NearbyMerchants from "@/components/merchant/NearbyMerchants";
import ReferralSystem from "@/components/referral/ReferralSystem";
import TeamGrowthChart from "@/components/referral/TeamGrowthChart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/useSession";
import { createPageUrl } from "@/utils";

export default function Home() {
  const { user, balance, refresh } = useSession();

  return (
    <div className="space-y-4">
      <PageHeader
        icon={HomeIcon}
        title={`你好，${user?.full_name || "NMS 用户"}`}
        subtitle="消费即分红 · 共同富裕的 Web3 生活生态。今日生态已为你结算 9×9×9 释放与版税分红。"
        badge={<Badge variant="success">{balance?.major_level || "普通用户"}</Badge>}
        actions={
          <>
            <Link to={createPageUrl("AIAssistant")}>
              <Button variant="outline" size="sm">
                <Bot className="h-3.5 w-3.5" /> AI 管家
              </Button>
            </Link>
            <Link to={createPageUrl("Champions")}>
              <Button size="sm">
                <Users className="h-3.5 w-3.5" /> 社区动态
              </Button>
            </Link>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
        <div className="space-y-4">
          <BalanceOverview balance={balance} />
          <MallEntrance />
          <VIPGiftPackage balance={balance} onDone={refresh} />
          <NMSIntro />
        </div>

        <div className="space-y-4">
          <SignInCard balance={balance} onDone={refresh} />
          <OnChainAssetDashboard />
          <NearbyMerchants compact />
          <TeamGrowthChart />
          <ReferralSystem compact />
          <div className="rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 to-violet-500/5 p-4">
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-cyan-300" /> 消费即铸造
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              在线下商家扫码消费，1:1 获得 NMS 并自动铸造 RWA 实物 NFT，永久享 10% 版税四方分成（推荐人 / 商家 / 节点 / 平台各 2.5%）。
            </p>
            <Link to={createPageUrl("PaymentCenter")} className="mt-2 inline-block text-[11px] text-cyan-300">
              立即扫码消费 →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
