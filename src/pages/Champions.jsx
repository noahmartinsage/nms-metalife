import React from "react";
import { MessageSquare, Users } from "lucide-react";
import ModuleShell from "@/components/common/ModuleShell";
import { SectionCard } from "@/components/common/SectionCard";
import { Badge } from "@/components/ui/badge";
import P2PSocialHub from "@/components/social/P2PSocialHub";
import { useReferral } from "@/hooks/useReferral";

/**
 * 社区动态：内容取自 ChatMessage（真实持久化 + P2P 同步）
 * 之前用 CommunityFeed 静态组件，现改为真实消息流，并保留 P2P 社交入口。
 */
export default function Champions() {
  const { referralCode } = useReferral();

  return (
    <ModuleShell
      icon={Users}
      title="社区动态"
      subtitle="消费即分享 · 晋升心得 · DAO 提案 · 红包雨，全部来自真实消息流"
      badge={<Badge variant="success">实时</Badge>}
      entity="ChatMessage"
      limit={60}
      searchKeys={["content", "sender_email", "region_code"]}
      emptyHint="还没有社区消息，去「加密聊天」发第一条"
      metrics={[
        { label: "消息总数", get: (r) => r.length, tone: "cyan" },
        {
          label: "参与人数",
          get: (r) => new Set(r.map((x) => x.sender_email).filter(Boolean)).size,
          tone: "emerald",
        },
        {
          label: "会话数",
          get: (r) => new Set(r.map((x) => x.region_code).filter(Boolean)).size,
          tone: "violet",
        },
        {
          label: "今日消息",
          get: (r) =>
            r.filter((x) => (x.created_date || "").slice(0, 10) === new Date().toISOString().slice(0, 10)).length,
          tone: "amber",
        },
      ]}
      columns={[
        {
          key: "sender_email",
          label: "发布者",
          render: (r) => <span className="num text-[10px] text-cyan-200">{r.sender_email || "—"}</span>,
        },
        {
          key: "content",
          label: "内容",
          render: (r) => <span className="line-clamp-2 text-[11px]">{r.content || "（空）"}</span>,
        },
        {
          key: "region_code",
          label: "会话",
          render: (r) => <span className="num text-[9px] text-muted-foreground">{r.region_code || "—"}</span>,
        },
        {
          key: "message_type",
          label: "类型",
          render: (r) => <Badge variant="outline">{r.message_type || "text"}</Badge>,
        },
        {
          key: "created_date",
          label: "时间",
          align: "right",
          render: (r) => (
            <span className="num text-[9px] text-muted-foreground">
              {(r.created_date || "").slice(5, 16).replace("T", " ")}
            </span>
          ),
        },
      ]}
    >
      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <SectionCard title="P2P 社交" desc="推荐码与关系链" icon={MessageSquare}>
          <P2PSocialHub referralCode={referralCode} />
        </SectionCard>
        <SectionCard title="社区规则" desc="内容与激励口径" icon={Users}>
          <div className="space-y-1 text-[10px] leading-relaxed text-muted-foreground">
            {[
              "动态与聊天共用 ChatMessage 实体，经 P2P 通道跨端实时同步",
              "内容发布不消耗 Gas，打赏与红包走支付通道结算",
              "推荐关系以推荐码绑定，奖励按 9×9×9 矩阵层级结算",
              "违规内容由 DAO 仲裁 3/5 多签裁定",
            ].map((t) => (
              <div key={t} className="flex items-start gap-1.5 rounded-lg bg-white/[0.02] px-2 py-1.5">
                <span className="mt-0.5 text-[10px] text-emerald-300">●</span>
                {t}
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </ModuleShell>
  );
}
