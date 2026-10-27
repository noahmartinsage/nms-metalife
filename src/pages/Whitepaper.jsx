import React, { useState } from "react";
import { BookOpen, Download, FileText } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import MarkdownView from "@/components/docs/MarkdownView";
import whitepaper from "@/docs/whitepaper.md?raw";
import techWhitepaper from "@/docs/tech-whitepaper.md?raw";
import { toast } from "@/components/ui/toast";

export default function Whitepaper() {
  const [tab, setTab] = useState("wp");

  const download = () => {
    const content = tab === "wp" ? whitepaper : techWhitepaper;
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = tab === "wp" ? "NMS-whitepaper-V13.0.md" : "NMS-tech-whitepaper-V11.0.md";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("文档已下载");
  };

  return (
    <div className="space-y-4">
      <PageHeader
        icon={BookOpen}
        title="白皮书"
        subtitle="NMS MetaLife 公链生态白皮书 V13.0 · 技术架构白皮书 V11.0"
        badge={<Badge variant="purple">官方文档</Badge>}
        actions={
          <Button size="sm" variant="outline" onClick={download}>
            <Download className="h-3.5 w-3.5" /> 下载 Markdown
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="wp">生态白皮书 V13.0</TabsTrigger>
          <TabsTrigger value="tech">技术架构白皮书 V11.0</TabsTrigger>
        </TabsList>

        <TabsContent value="wp">
          <SectionCard title="NMS MetaLife — 公链生态白皮书" desc="23 个章节 · 代币经济 · RWA · AI 风控 · DAO" icon={FileText}>
            <div className="max-h-[70vh] overflow-y-auto pr-2">
              <MarkdownView content={whitepaper} />
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="tech">
          <SectionCard title="NMS MetaLife — 技术架构白皮书" desc="四层架构 · 模块实现 · 复现参考" icon={FileText}>
            <div className="max-h-[70vh] overflow-y-auto pr-2">
              <MarkdownView content={techWhitepaper} />
            </div>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
