import React from "react";
import { MessageCircle } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import CommunityFeed from "@/components/social/CommunityFeed";
import DAORegionChat from "@/components/social/DAORegionChat";
import P2PSocialHub from "@/components/social/P2PSocialHub";
import { useReferral } from "@/hooks/useReferral";

export default function Social() {
  const { referralCode } = useReferral();

  return (
    <div className="space-y-4">
      <PageHeader
        icon={MessageCircle}
        title="元 Social"
        subtitle="P2P 端对端加密社交 · DID 身份 · 区划 DAO · 红包雨 · 精英圈层"
        badge={<Badge variant="success">Kyber-768 E2E</Badge>}
      />

      <Tabs defaultValue="feed">
        <TabsList>
          <TabsTrigger value="feed">社区动态</TabsTrigger>
          <TabsTrigger value="dao">DAO 聊天</TabsTrigger>
          <TabsTrigger value="p2p">P2P 社交</TabsTrigger>
        </TabsList>

        <TabsContent value="feed">
          <CommunityFeed />
        </TabsContent>

        <TabsContent value="dao">
          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <DAORegionChat />
            <P2PSocialHub referralCode={referralCode} />
          </div>
        </TabsContent>

        <TabsContent value="p2p">
          <P2PSocialHub referralCode={referralCode} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
