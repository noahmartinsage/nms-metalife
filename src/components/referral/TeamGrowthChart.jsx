import React, { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TrendingUp } from "lucide-react";
import { SectionCard } from "@/components/common/SectionCard";
import { Progress } from "@/components/ui/progress";
import { findTier, PROMOTION_TIERS } from "@/lib/promotionData";
import { useReferral } from "@/hooks/useReferral";

/** 团队增长可视化（规范 8.20） */
export default function TeamGrowthChart() {
  const { balance } = useReferral();

  const data = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const m = i + 1;
        return {
          month: `${m}月`,
          users: Math.round(38 * Math.pow(1.42, i)),
          merchants: Math.round(4 * Math.pow(1.28, i)),
        };
      }),
    []
  );

  const tier = findTier(balance?.major_level || "普通用户");
  const nextTier = PROMOTION_TIERS[Math.min(PROMOTION_TIERS.length - 1, tier.order + 1)];
  const teamProgress = nextTier.team ? Math.min(100, ((balance?.team_size || 0) / nextTier.team) * 100) : 100;
  const consumeProgress = nextTier.consume
    ? Math.min(100, ((balance?.total_consumption || 0) / nextTier.consume) * 100)
    : 100;

  return (
    <SectionCard
      title="团队增长"
      desc={`当前 ${tier.level} → 下一里程碑 ${nextTier.level}`}
      icon={TrendingUp}
      actions={
        <span className="num rounded-lg bg-emerald-400/10 px-2 py-0.5 text-[11px] text-emerald-300">
          +{(((balance?.team_size || 0) / Math.max(1, balance?.team_size || 1)) * 100).toFixed(0)}%
        </span>
      }
    >
      <div className="h-[168px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
            <defs>
              <linearGradient id="tgu" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.55} />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="tgm" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={44} />
            <Tooltip
              contentStyle={{
                background: "rgba(13,21,38,0.96)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
                fontSize: 12,
              }}
              labelStyle={{ color: "#cbd5e1" }}
            />
            <Area type="monotone" dataKey="users" name="用户团队" stroke="#22d3ee" fill="url(#tgu)" strokeWidth={2} />
            <Area
              type="monotone"
              dataKey="merchants"
              name="商家团队"
              stroke="#a78bfa"
              fill="url(#tgm)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 space-y-2.5">
        <div>
          <div className="mb-1 flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">团队人数</span>
            <span className="num text-muted-foreground">
              {(balance?.team_size || 0).toLocaleString("zh-CN")} / {nextTier.team.toLocaleString("zh-CN")}
            </span>
          </div>
          <Progress value={teamProgress} />
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">累计消费</span>
            <span className="num text-muted-foreground">
              ¥{(balance?.total_consumption || 0).toLocaleString("zh-CN")} / {nextTier.consume.toLocaleString("zh-CN")}
            </span>
          </div>
          <Progress value={consumeProgress} indicatorClassName="bg-gradient-to-r from-violet-400 to-fuchsia-400" />
        </div>
      </div>
    </SectionCard>
  );
}
