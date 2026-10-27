import React from "react";
import { Users } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { Badge } from "@/components/ui/badge";
import CommunityFeed from "@/components/social/CommunityFeed";
import P2PSocialHub from "@/components/social/P2PSocialHub";
import { useReferral } from "@/hooks/useReferral";

export default function Champions() {
  const { referralCode } = useReferral();
  return (
    <div className="space-y-4">
      <PageHeader
        icon={Users}
        title="社区动态"
        subtitle="消费即分享 · 晋升心得 · DAO 提案 · 红包雨"
        badge={<Badge variant="success">实时</Badge>}
      />
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <CommunityFeed />
        <P2PSocialHub referralCode={referralCode} />
      </div>
    </div>
  );
}
