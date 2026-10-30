import React from "react";
import { MessageCircle } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import CommunityFeed from "@/components/social/CommunityFeed";
import DAORegionChat from "@/components/social/DAORegionChat";
import P2PSocialHub from "@/components/social/P2PSocialHub";
import DIDEncryptedChat from "@/components/social/DIDEncryptedChat";
import GovernancePanel from "@/components/governance/GovernancePanel";
import P2PNetworkPanel from "@/components/p2p/P2PNetworkPanel";
import { useReferral } from "@/hooks/useReferral";

export default function Social() {
  const { referralCode } = useReferral();

  return (
    <div className="space-y-4">
      <PageHeader
        icon={MessageCircle}
        title="元 Social"
        subtitle="P2P 端对端加密社交 · DID 身份 · 区划 DAO · 红包雨 · 精英圈层"
        badge={<Badge variant="success">ML-DSA-65 E2E</Badge>}
      />

      <Tabs defaultValue="feed">
        <TabsList>
          <TabsTrigger value="feed">社区动态</TabsTrigger>
          <TabsTrigger value="dao">DAO 聊天</TabsTrigger>
          <TabsTrigger value="gov">DAO 治理</TabsTrigger>
          <TabsTrigger value="chat">加密聊天</TabsTrigger>
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
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <P2PSocialHub referralCode={referralCode} />
            <P2PNetworkPanel />
          </div>
        </TabsContent>

        <TabsContent value="gov">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <GovernancePanel />
            <DIDEncryptedChat />
          </div>
        </TabsContent>

        <TabsContent value="chat">
          <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
            <DIDEncryptedChat />
            <P2PSocialHub referralCode={referralCode} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
