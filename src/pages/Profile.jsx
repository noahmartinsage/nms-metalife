import React, { useState } from "react";
import { Award, Bell, Crown, Settings, ShieldCheck, User, Users } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { SectionCard, DataRow } from "@/components/common/SectionCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Avatar } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import PromotionLevelCard from "@/components/promotion/PromotionLevelCard";
import ReferralSystem from "@/components/referral/ReferralSystem";
import TeamGrowthChart from "@/components/referral/TeamGrowthChart";
import { PROMOTION_TIERS, findTier } from "@/lib/promotionData";
import { resolveUserGrade } from "@/lib/engine";
import { useSession } from "@/hooks/useSession";
import { fmtNum, shortAddr } from "@/lib/format";
import { base44 } from "@/api/base44Client";
import { toast } from "@/components/ui/toast";

const ACHIEVEMENTS = [
  { name: "首单消费", desc: "完成首次扫码消费", done: true, icon: "🛒" },
  { name: "连续签到 7 天", desc: "签到不间断", done: true, icon: "🔥" },
  { name: "团队破千", desc: "团队人数 ≥ 1,000", done: true, icon: "👥" },
  { name: "合成大师", desc: "NFT 合成维度 ≥ 5", done: false, icon: "💎" },
  { name: "RWA 先锋", desc: "确权 10 项资产", done: false, icon: "🏛" },
  { name: "M9 合伙人", desc: "晋升至黑金卡 M9", done: false, icon: "👑" },
];

export default function Profile() {
  const { user, balance, refresh } = useSession();
  const tier = findTier(balance?.major_level || "普通用户");
  const grade = resolveUserGrade(balance?.total_consumption || 0);
  const [notify, setNotify] = useState(true);
  const [privacy, setPrivacy] = useState(false);

  const nextTier = PROMOTION_TIERS[Math.min(13, tier.order + 1)];
  const progress = nextTier.team ? Math.min(100, ((balance?.team_size || 0) / nextTier.team) * 100) : 100;

  return (
    <div className="space-y-4">
      <PageHeader icon={User} title="个人中心" subtitle="等级 · 推荐网络 · 成就 · 设置" />

      <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-4">
          <div className="neon-border relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-cyan-500/15 blur-3xl" />
            <div className="flex items-center gap-3">
              <Avatar name={user?.full_name} size={54} />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-sm font-semibold">
                  {user?.full_name}
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                </p>
                <p className="num truncate text-[10px] text-muted-foreground">{shortAddr(user?.email, 14, 10)}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  <Badge variant="warning">
                    <Crown className="h-2.5 w-2.5" /> {tier.level}
                  </Badge>
                  <Badge variant="success">{grade.label}</Badge>
                  <Badge variant="outline">{balance?.user_type || "普通用户"}</Badge>
                </div>
              </div>
            </div>

            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">晋升进度 → {nextTier.level}</span>
                <span className="num text-cyan-300">{progress.toFixed(1)}%</span>
              </div>
              <Progress value={progress} />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <DataRow label="可用 NMS" value={fmtNum(balance?.available_nms || 0)} />
              <DataRow label="待释放" value={fmtNum(balance?.pending_release_nms || 0)} />
              <DataRow label="团队人数" value={(balance?.team_size || 0).toLocaleString("zh-CN")} />
              <DataRow label="累计消费" value={`¥${fmtNum(balance?.total_consumption || 0)}`} />
            </div>

            <Button
              className="mt-3 w-full"
              variant="outline"
              size="sm"
              onClick={async () => {
                await base44.auth.updateMe({ full_name: user?.full_name });
                toast.success("资料已同步");
                refresh();
              }}
            >
              <Settings className="h-3.5 w-3.5" /> 编辑资料
            </Button>
          </div>

          <SectionCard title="设置" icon={Settings}>
            <div className="flex items-center justify-between border-b border-white/5 py-2">
              <span className="flex items-center gap-1.5 text-[11px]">
                <Bell className="h-3.5 w-3.5 text-cyan-300" /> 释放与分红通知
              </span>
              <Switch checked={notify} onCheckedChange={setNotify} />
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="flex items-center gap-1.5 text-[11px]">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" /> 隐私模式（隐藏资产）
              </span>
              <Switch checked={privacy} onCheckedChange={setPrivacy} />
            </div>
          </SectionCard>
        </div>

        <div className="space-y-4">
          <Tabs defaultValue="levels">
            <TabsList>
              <TabsTrigger value="levels">晋升等级</TabsTrigger>
              <TabsTrigger value="achievements">成就</TabsTrigger>
              <TabsTrigger value="team">团队</TabsTrigger>
            </TabsList>

            <TabsContent value="levels">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {PROMOTION_TIERS.map((t) => (
                  <PromotionLevelCard
                    key={t.level}
                    tier={t}
                    current={t.level === tier.level}
                    compact={t.order > 6}
                    onClick={() => toast.message(`${t.level}：${t.priv}`)}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="achievements">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {ACHIEVEMENTS.map((a) => (
                  <div
                    key={a.name}
                    className={`rounded-xl border p-2.5 text-center ${
                      a.done ? "border-amber-400/30 bg-amber-400/[0.07]" : "border-white/10 bg-white/[0.02] opacity-60"
                    }`}
                  >
                    <span className="text-lg">{a.icon}</span>
                    <p className="mt-0.5 text-[10px] font-medium">{a.name}</p>
                    <p className="text-[9px] text-muted-foreground">{a.desc}</p>
                    <p className={`mt-0.5 text-[9px] ${a.done ? "text-amber-300" : "text-muted-foreground"}`}>
                      {a.done ? "已解锁" : "未解锁"}
                    </p>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="team">
              <div className="space-y-3">
                <TeamGrowthChart />
                <SectionCard title="团队矩阵" icon={Users} desc="9 层矩阵人数分布">
                  <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
                    {[
                      ["直推", 8],
                      ["2 层", 32],
                      ["3 层", 128],
                      ["4 层", 256],
                      ["5 层", 512],
                    ].map(([k, v]) => (
                      <div key={k} className="rounded-lg border border-white/10 bg-white/[0.03] py-1.5 text-center">
                        <p className="num text-[11px] font-semibold text-cyan-300">{v}</p>
                        <p className="text-[9px] text-muted-foreground">{k}</p>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </div>
            </TabsContent>
          </Tabs>

          <ReferralSystem compact />

          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              <Award className="h-4 w-4 text-amber-300" /> 我的权益
            </p>
            <ul className="mt-1.5 space-y-1 text-[10px] text-muted-foreground">
              <li>· 直推奖励 {tier.reward}% · 级差奖励 {tier.diff}%</li>
              <li>· 释放周期 {balance?.release_days || 999} 天（{balance?.release_speed_factor || 1}x）</li>
              <li>· 特权：{tier.priv}</li>
              <li>· 团队矩阵：{MATRIX_LABEL(balance)}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function MATRIX_LABEL(balance) {
  return `${balance?.direct_referrals || 0} 直推 / ${balance?.team_size || 0} 总人数`;
}
