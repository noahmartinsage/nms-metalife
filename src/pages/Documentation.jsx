import React, { useState } from "react";
import { BookOpen, Database, FileText, Layers, Link2, Server } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import MarkdownView from "@/components/docs/MarkdownView";
import promptDoc from "@/docs/reproduction-prompt.md?raw";
import techDesign from "@/docs/tech-design.md?raw";
import { ENTITY_ORDER, SCHEMAS } from "@/api/schemas";
import { navItems } from "@/Layout";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

const ENTITY_LABEL = {
  UserBalance: "用户余额",
  WalletAccount: "钱包账户",
  MerchantStore: "商家门店",
  PromotionLevel: "晋升等级",
  PaymentOrder: "支付订单",
  NFTItem: "NFT 资产",
  Transaction: "链上交易",
  LiquidityPool: "流动性池",
  RedPacket: "红包",
  DataAsset: "数据资产",
  DAORegion: "DAO 区划",
  ChatMessage: "聊天消息",
  TradingStrategy: "交易策略",
};

export default function Documentation() {
  const [entity, setEntity] = useState("UserBalance");
  const schema = SCHEMAS[entity];

  return (
    <div className="space-y-4">
      <PageHeader
        icon={FileText}
        title="文档中心"
        subtitle="系统文档 · 数据模型 · API 参考 · 复现指南"
        badge={<Badge variant="default">V13.0</Badge>}
      />

      <Tabs defaultValue="model">
        <TabsList>
          <TabsTrigger value="model">数据模型</TabsTrigger>
          <TabsTrigger value="api">API 参考</TabsTrigger>
          <TabsTrigger value="pages">页面清单</TabsTrigger>
          <TabsTrigger value="guide">复现指南</TabsTrigger>
        </TabsList>

        <TabsContent value="model">
          <div className="grid gap-3 lg:grid-cols-[220px_1fr]">
            <SectionCard title="13 个实体" icon={Database} desc="按依赖顺序创建">
              <div className="space-y-0.5">
                {ENTITY_ORDER.map((name, i) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setEntity(name)}
                    className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-[11px] transition-colors ${
                      entity === name ? "bg-cyan-400/10 text-cyan-200" : "text-muted-foreground hover:bg-white/5"
                    }`}
                  >
                    <span className="truncate">
                      {i + 1}. {name}
                    </span>
                    <span className="num text-[9px] text-muted-foreground">
                      {Object.keys(SCHEMAS[name].properties).length}
                    </span>
                  </button>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              title={entity}
              desc={`${ENTITY_LABEL[entity]} · ${Object.keys(schema.properties).length} 个字段`}
              icon={Layers}
              actions={<Badge variant="outline">JSON Schema</Badge>}
            >
              <div className="max-h-[520px] overflow-auto rounded-xl border border-white/10">
                <table className="w-full text-[10px]">
                  <thead className="sticky top-0 bg-[#0d1526] text-muted-foreground">
                    <tr>
                      <th className="px-2 py-1.5 text-left font-medium">字段</th>
                      <th className="px-2 py-1.5 text-left font-medium">类型</th>
                      <th className="px-2 py-1.5 text-left font-medium">约束 / 默认</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(schema.properties).map(([k, v]) => (
                      <tr key={k} className="border-t border-white/5">
                        <td className="num px-2 py-1.5 text-cyan-200">{k}</td>
                        <td className="px-2 py-1.5 text-muted-foreground">{v.type}</td>
                        <td className="px-2 py-1.5 text-muted-foreground/80">
                          {v.enum ? v.enum.join(" | ") : v.format || (v.default !== undefined ? `默认 ${v.default}` : "—")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-[10px] text-muted-foreground">
                必填：{schema.required.join(", ")}
              </p>
            </SectionCard>
          </div>
        </TabsContent>

        <TabsContent value="api">
          <div className="grid gap-3 lg:grid-cols-2">
            <SectionCard title="实体 API" icon={Server} desc="与 Base44 SDK 完全一致的调用契约">
              <MarkdownView
                content={[
                  "```js",
                  'import { base44 } from "@/api/base44Client";',
                  "",
                  "// 列表（排序 / 条数）",
                  'await base44.entities.NFTItem.list("-created_date", 50);',
                  "",
                  "// 条件查询",
                  'await base44.entities.UserBalance.filter({ user_email }, "-created_date", 1);',
                  "",
                  "// 单条 / 新建 / 更新 / 删除",
                  "await base44.entities.NFTItem.get(id);",
                  "await base44.entities.NFTItem.create({ name, nft_type, price });",
                  "await base44.entities.NFTItem.update(id, { is_for_sale: true });",
                  "await base44.entities.NFTItem.delete(id);",
                  "",
                  "// 实时订阅（WebSocket 实体变更推送）",
                  "const unsub = base44.entities.NFTItem.subscribe(({ entity }) => {});",
                  "```",
                ].join("\n")}
              />
            </SectionCard>

            <SectionCard title="集成服务" icon={Link2} desc="InvokeLLM / UploadFile / SendEmail 等">
              <MarkdownView
                content={[
                  "```js",
                  "// AI 调用",
                  "await base44.integrations.Core.InvokeLLM({ prompt });",
                  "",
                  "// 文件上传",
                  "await base44.integrations.Core.UploadFile({ file });",
                  "",
                  "// 发送邮件",
                  'await base44.integrations.Core.SendEmail({ to, subject, body });',
                  "",
                  "// 生成图片 / 语音 / 视频",
                  "await base44.integrations.Core.GenerateImage({ prompt });",
                  "```",
                  "",
                  "> 本项目为提示词复现版，集成服务在本地以模拟实现返回，接口签名保持一致。",
                ].join("\n")}
              />
            </SectionCard>
          </div>
        </TabsContent>

        <TabsContent value="pages">
          <SectionCard title="页面清单" icon={BookOpen} desc={`${navItems.length} 个主导航 + 全部路由`}>
            <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
              {navItems.map((n) => (
                <Link
                  key={n.page}
                  to={createPageUrl(n.page)}
                  className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-1.5 text-[11px] hover:border-cyan-400/30"
                >
                  <span>{n.name}</span>
                  <span className="num text-[9px] text-muted-foreground">{createPageUrl(n.page)}</span>
                </Link>
              ))}
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="guide">
          <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
            <SectionCard title="提示词复现文档" icon={FileText} desc="将本文档输入 AI 开发助手即可从零复现">
              <div className="max-h-[560px] overflow-y-auto pr-1">
                <MarkdownView content={promptDoc} />
              </div>
            </SectionCard>
            <SectionCard title="技术架构设计文档" icon={Layers} desc="模块技术实现详解">
              <div className="max-h-[560px] overflow-y-auto pr-1">
                <MarkdownView content={techDesign} />
              </div>
            </SectionCard>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
