import React, { useMemo } from "react";
import { Activity, Receipt, Sparkles, TrendingUp, Users } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { SectionCard, EmptyState } from "@/components/common/SectionCard";
import { StatCard } from "@/components/common/StatCard";
import { Badge } from "@/components/ui/badge";
import { useEntityList } from "@/hooks/useEntity";
import { useSession } from "@/hooks/useSession";
import { fmtNum, fmtDate, timeAgo } from "@/lib/format";
import { DataErrorBanner } from "@/components/common/ModuleState";

const TIMELINE = [
  { type: "consume", text: "在「元味小馆」消费 ¥268，获得 268 NMS", time: 0.5 },
  { type: "nft", text: "铸造实物 NFT「西湖龙井·明前特级」", time: 0.5 },
  { type: "promote", text: "晋升至黑金卡 M3，释放周期缩短至 552 天", time: 3 },
  { type: "reward", text: "收到直推奖励 120 NMS（来自 lin.xiaoyu）", time: 8 },
  { type: "dao", text: "参与西湖区 DAO 提案投票", time: 26 },
  { type: "consume", text: "在「星野咖啡」消费 ¥88，获得 88 NMS", time: 48 },
  { type: "stake", text: "质押 5,000 NMS，90 天期，年化 16%", time: 72 },
  { type: "signin", text: "连续签到 27 天，累计奖励 480 NMS", time: 120 },
];

const ICONS = { consume: Receipt, nft: Sparkles, promote: TrendingUp, reward: Users, dao: Users, stake: TrendingUp, signin: Activity };

export default function UserActivity() {
  const { balance, user } = useSession();
  const { data: orders, loading, error, refresh } = useEntityList("PaymentOrder", { user_email: user?.email }, "-created_date", 20);

  const events = useMemo(
    () =>
      TIMELINE.map((t, i) => ({
        ...t,
        id: `ev_${i}`,
        at: new Date(Date.now() - t.time * 3600000).toISOString(),
      })),
    []
  );

  return (
    <div className="space-y-4">
      <DataErrorBanner error={error} loading={loading} onRetry={refresh} />

      <PageHeader
        icon={Activity}
        title="用户动态"
        subtitle="链上行为流 · 消费 / 晋升 / 奖励 / 治理"
        badge={<Badge variant="outline">最近 7 天</Badge>}
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard label="累计消费" value={fmtNum(balance?.total_consumption || 0)} unit="元" icon={Receipt} accent="cyan" />
        <StatCard label="累计收益" value={fmtNum(balance?.total_rewards || 0)} unit="NMS" icon={TrendingUp} accent="emerald" />
        <StatCard label="团队人数" value={(balance?.team_size || 0).toLocaleString("zh-CN")} icon={Users} accent="violet" />
        <StatCard label="连续签到" value={balance?.sign_in_days || 0} unit="天" icon={Activity} accent="amber" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <SectionCard title="行为时间线" icon={Activity} desc={`${events.length} 条记录`}>
          <div className="relative space-y-2 pl-4">
            <span className="absolute left-1 top-1 bottom-1 w-px bg-white/10" />
            {events.map((e) => {
              const Icon = ICONS[e.type] || Activity;
              return (
                <div key={e.id} className="relative">
                  <span className="absolute -left-3.5 top-1 grid h-5 w-5 place-items-center rounded-full border border-white/10 bg-[#0d1526]">
                    <Icon className="h-2.5 w-2.5 text-cyan-300" />
                  </span>
                  <div className="rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-1.5">
                    <p className="text-[10px] leading-relaxed">{e.text}</p>
                    <p className="mt-0.5 text-[9px] text-muted-foreground">{timeAgo(e.at)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard title="我的消费订单" icon={Receipt} desc={`${orders.length} 笔`}>
          {orders.length === 0 ? (
            <EmptyState title="暂无消费记录" />
          ) : (
            <div className="space-y-1">
              {orders.map((o) => (
                <div key={o.id} className="flex items-center justify-between border-b border-white/5 py-1.5 text-[10px] last:border-0">
                  <div className="min-w-0">
                    <p className="truncate">{o.merchant_name}</p>
                    <p className="num text-[9px] text-muted-foreground">{fmtDate(o.created_date, true)}</p>
                  </div>
                  <div className="text-right">
                    <p className="num">¥{fmtNum(Number(o.amount))}</p>
                    <p className="text-[9px] text-emerald-300">+{fmtNum(o.user_reward)} NMS</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
