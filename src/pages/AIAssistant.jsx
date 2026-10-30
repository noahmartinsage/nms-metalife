import React, { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Bot,
  Boxes,
  Brain,
  Coins,
  Cpu,
  Database,
  Gavel,
  Globe,
  LineChart,
  Lock,
  Pickaxe,
  Rocket,
  Shield,
  Sparkles,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import AISmartSearch from "@/components/ai-assistant/AISmartSearch";
import ReleaseStrategyAdvisor from "@/components/ai-assistant/ReleaseStrategyAdvisor";
import ZKAuditPanel from "@/components/ai-assistant/ZKAuditPanel";
import { useSession } from "@/hooks/useSession";
import { fmtNum } from "@/lib/format";
import { cn } from "@/lib/utils";

/** 32 项 AI 能力（按功能域分组） */
const DOMAINS = [
  { key: "asset", label: "资产管理", icon: Wallet },
  { key: "trade", label: "交易策略", icon: LineChart },
  { key: "bridge", label: "跨链桥", icon: Globe },
  { key: "audit", label: "安全审计", icon: Shield },
  { key: "gov", label: "治理", icon: Gavel },
  { key: "rwa", label: "RWA", icon: Boxes },
  { key: "data", label: "数据分析", icon: Database },
  { key: "ai", label: "AI 核心", icon: Brain },
  { key: "mine", label: "挖矿", icon: Pickaxe },
  { key: "social", label: "社交", icon: Users },
  { key: "econ", label: "自治经济", icon: Rocket },
];

const FEATURES = [
  { name: "财富总览", domain: "asset", desc: "四代币 + NFT + DeFi 全资产聚合视图", metrics: [["总资产", "168,420 NMS"], ["年化", "18.6%"], ["风险", "中低"]] },
  { name: "NFT 持仓", domain: "asset", desc: "按类型/稀有度/合成等级聚合估值", metrics: [["持仓", "10 个"], ["估值", "32,860 NMS"], ["版税", "1,320 NMS"]] },
  { name: "AI 代理钱包", domain: "asset", desc: "Agent 权限隔离，无资产转移权", metrics: [["Agent", "4 个"], ["ZK 证明", "已启用"], ["私钥", "本地"]] },
  { name: "资产保险", domain: "asset", desc: "量子资产保险，赔付上限 80%", metrics: [["保额", "50,000 NMS"], ["费率", "0.8%"], ["状态", "生效中"]] },
  { name: "策略推荐", domain: "trade", desc: "基于 Alpha 六因子推荐仓位", metrics: [["推荐", "加仓 20%"], ["置信度", "86%"], ["止损", "-3.5%"]] },
  { name: "策略构建器", domain: "trade", desc: "可视化拖拽编排交易逻辑", metrics: [["节点", "12 个"], ["模板", "24 套"], ["回测", "已通过"]] },
  { name: "量化回测", domain: "trade", desc: "90 天历史回放与滑点建模", metrics: [["收益", "+18.6%"], ["回撤", "-6.2%"], ["夏普", "2.14"]] },
  { name: "跨链桥", domain: "bridge", desc: "多链资产一键桥接", metrics: [["通道", "4 条"], ["延迟", "12 min"], ["费", "0"]] },
  { name: "LayerZero 桥", domain: "bridge", desc: "全链互操作协议接入", metrics: [["链", "12 条"], ["成功率", "99.8%"], ["状态", "正常"]] },
  { name: "量子桥", domain: "bridge", desc: "抗量子签名保护的跨链通道", metrics: [["算法", "ML-DSA-65"], ["覆盖", "100%"], ["审计", "通过"]] },
  { name: "量子隐私审计与看板", domain: "audit", desc: "密钥强度 / 签名覆盖 / 迁移进度", metrics: [["等级", "L5"], ["覆盖", "100%"], ["风险", "18/100"]] },
  { name: "量子合约管理", domain: "audit", desc: "合约版本、权限与升级治理", metrics: [["合约", "18 个"], ["高危", "0"], ["待复审", "1"]] },
  { name: "ZK 智能审计", domain: "audit", desc: "RWA 多签审计 5 步 + VC 凭证", metrics: [["步骤", "5"], ["多签", "3/5"], ["凭证", "可分享"]] },
  { name: "治理看板", domain: "gov", desc: "提案、投票率与执行进度", metrics: [["提案", "24"], ["投票率", "62%"], ["通过", "18"]] },
  { name: "增强治理", domain: "gov", desc: "委托投票 + 二次方投票", metrics: [["委托人", "1,284"], ["权重", "GCP"], ["状态", "运行中"]] },
  { name: "链上 DAO 助手", domain: "gov", desc: "自动起草提案与合规校验", metrics: [["草稿", "6"], ["校验", "通过"], ["语言", "中/英"]] },
  { name: "RWA 代币化中心", domain: "rwa", desc: "实物确权 → 上链 → 交易全流程", metrics: [["已确权", "1,284"], ["待审", "12"], ["冻结", "10%"]] },
  { name: "NFT 借贷", domain: "rwa", desc: "以 NFT 抵押借出 ACS", metrics: [["LTV", "60%"], ["利率", "8.4%"], ["可用", "32,000"]] },
  { name: "NFT 跨链合成", domain: "rwa", desc: "跨链 NFT 材料合成高阶资产", metrics: [["材料", "3 个"], ["目标", "epic"], ["成功率", "92%"]] },
  { name: "数据分析看板", domain: "data", desc: "消费、释放、团队多维分析", metrics: [["指标", "48 项"], ["刷新", "30s"], ["导出", "CSV"]] },
  { name: "宏观监控", domain: "data", desc: "利率、流动性、跨市场联动", metrics: [["指标", "16 项"], ["预警", "1"], ["更新", "实时"]] },
  { name: "价格提醒", domain: "data", desc: "自定义阈值推送", metrics: [["规则", "8 条"], ["触发", "3 次"], ["通道", "站内"]] },
  { name: "进化 AI 内核", domain: "ai", desc: "策略自学习与参数进化", metrics: [["代次", "200"], ["适应度", "2.71"], ["版本", "v4.2"]] },
  { name: "AI 生命演化", domain: "ai", desc: "数字分身行为演化与记忆", metrics: [["分身", "1 个"], ["记忆", "12,480"], ["活跃", "是"]] },
  { name: "语音 AI 助手", domain: "ai", desc: "中文语音识别与播报", metrics: [["语种", "zh-CN"], ["延迟", "0.8s"], ["状态", "就绪"]] },
  { name: "释放策略顾问", domain: "ai", desc: "4 条路径优化 9×9×9 释放", metrics: [["路径", "P1-P4"], ["最快", "31 天"], ["当前", "552 天"]] },
  { name: "量子矿池", domain: "mine", desc: "抗量子签名挖矿池", metrics: [["算力", "8.6 PH/s"], ["矿工", "2,480"], ["产出", "YSE"]] },
  { name: "全网算力调度", domain: "mine", desc: "按收益动态分配算力", metrics: [["节点", "128"], ["效率", "94%"], ["切换", "自动"]] },
  { name: "Agent 社交广场", domain: "social", desc: "AI Agent 之间的协作与交易", metrics: [["Agent", "486"], ["协作", "1,240"], ["评分", "4.8"]] },
  { name: "OpenClaw 团队", domain: "social", desc: "多 Agent 协同工作流", metrics: [["成员", "12"], ["任务", "86"], ["完成率", "92%"]] },
  { name: "自治经济", domain: "econ", desc: "通缩/通胀参数自动调节", metrics: [["销毁", "1.28 亿"], ["通胀", "0.8%"], ["状态", "健康"]] },
  { name: "上线成功度", domain: "econ", desc: "生态健康度与增长预测", metrics: [["健康度", "92"], ["增长", "+18.6%"], ["留存", "43%"]] },
];

export default function AIAssistant() {
  const { balance } = useSession();
  const [domain, setDomain] = useState("asset");
  const [selected, setSelected] = useState(FEATURES[0].name);

  const list = useMemo(() => FEATURES.filter((f) => f.domain === domain), [domain]);
  const current = FEATURES.find((f) => f.name === selected) || list[0];

  return (
    <div className="space-y-4">
      <PageHeader
        icon={Bot}
        title="AI 管家"
        subtitle="32 项 AI 能力 · Minara-AI 驱动 · 资产 / 策略 / 风控 / 治理 / RWA 全域覆盖"
        badge={<Badge variant="purple">{FEATURES.length} 项能力</Badge>}
        actions={<Badge variant="success">可用 NMS {fmtNum(balance?.available_nms || 0)}</Badge>}
      />

      <AISmartSearch />

      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <SectionCard title="能力矩阵" desc="按功能域分组，点击查看详情" icon={Sparkles}>
          <div className="flex flex-wrap gap-1">
            {DOMAINS.map((d) => {
              const Icon = d.icon;
              return (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => {
                    setDomain(d.key);
                    const first = FEATURES.find((f) => f.domain === d.key);
                    if (first) setSelected(first.name);
                  }}
                  className={cn(
                    "flex shrink-0 items-center gap-1 rounded-lg border px-2 py-1 text-[10px] transition-colors",
                    domain === d.key
                      ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-200"
                      : "border-white/10 text-muted-foreground"
                  )}
                >
                  <Icon className="h-3 w-3" /> {d.label}
                </button>
              );
            })}
          </div>

          <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {list.map((f) => (
              <button
                key={f.name}
                type="button"
                onClick={() => setSelected(f.name)}
                className={cn(
                  "rounded-xl border p-2 text-left transition-colors",
                  selected === f.name
                    ? "border-cyan-400/40 bg-cyan-400/[0.07]"
                    : "border-white/5 bg-white/[0.02] hover:border-white/20"
                )}
              >
                <p className="truncate text-[10px] font-medium">{f.name}</p>
                <p className="mt-0.5 line-clamp-2 text-[9px] leading-snug text-muted-foreground">{f.desc}</p>
              </button>
            ))}
          </div>
        </SectionCard>

        <SectionCard title={current?.name} desc={current?.desc} icon={Activity}>
          <div className="grid grid-cols-3 gap-1.5">
            {current?.metrics.map(([k, v]) => (
              <div key={k} className="rounded-lg border border-white/10 bg-white/[0.03] py-1.5 text-center">
                <p className="num text-[11px] font-semibold text-cyan-300">{v}</p>
                <p className="text-[9px] text-muted-foreground">{k}</p>
              </div>
            ))}
          </div>
          <div className="mt-2 rounded-xl border border-white/10 bg-black/20 p-2.5">
            <p className="text-[10px] leading-relaxed text-muted-foreground">
              Minara-AI 已就绪。该能力在演示环境中提供入口、状态与指标；生产环境由 Base44 集成服务
              （InvokeLLM / UploadFile / SendEmail）与链上协议层提供实际执行。
            </p>
          </div>
          <div className="mt-2 flex gap-1.5">
            <Button size="sm" className="flex-1" onClick={() => setSelected(list[0]?.name)}>
              <Zap className="h-3.5 w-3.5" /> 立即执行
            </Button>
            <Button size="sm" variant="outline" onClick={() => setDomain("audit")}>
              <AlertTriangle className="h-3.5 w-3.5" /> 风控
            </Button>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ReleaseStrategyAdvisor balance={balance} />
        <ZKAuditPanel />
      </div>

      <Tabs defaultValue="about">
        <TabsList>
          <TabsTrigger value="about">关于 AI 管家</TabsTrigger>
          <TabsTrigger value="policy">安全边界</TabsTrigger>
        </TabsList>
        <TabsContent value="about">
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-[11px] leading-relaxed text-muted-foreground">
            AI 管家由 Minara-AI 框架驱动，覆盖资产管理、交易策略、跨链桥、安全审计、治理、RWA、数据分析、
            AI 核心、挖矿、社交与自治经济 11 个功能域共 32 项能力。所有 AI 输出均标注置信度，涉及资金操作需二次确认。
          </div>
        </TabsContent>
        <TabsContent value="policy">
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <ul className="space-y-1.5 text-[11px] text-muted-foreground">
              <li className="flex items-center gap-1.5">
                <Lock className="h-3 w-3 text-cyan-300" /> Agent 无资产转移权，仅可执行白名单策略
              </li>
              <li className="flex items-center gap-1.5">
                <Shield className="h-3 w-3 text-emerald-300" /> 所有动作生成 ZK 证明并上链存证
              </li>
              <li className="flex items-center gap-1.5">
                <Cpu className="h-3 w-3 text-violet-300" /> 私钥永不离开本地设备，模型不接触私钥
              </li>
              <li className="flex items-center gap-1.5">
                <Coins className="h-3 w-3 text-amber-300" /> 单笔超过 5,000 NMS 需人工二次确认
              </li>
            </ul>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
