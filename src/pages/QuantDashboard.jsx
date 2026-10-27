import React from "react";
import { BarChart3, Bot, FlaskConical, Network, ShieldAlert, Target } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import StrategyStudio from "@/components/quant/StrategyStudio";
import AlphaSystem from "@/components/quant/AlphaSystem";
import AICircuitBreaker from "@/components/quant/AICircuitBreaker";
import CrossChainRebalancer from "@/components/quant/CrossChainRebalancer";
import BacktestPanel from "@/components/quant/BacktestPanel";
import AITradingAssistant from "@/components/dex/AITradingAssistant";
import { useEntityList } from "@/hooks/useEntity";
import { fmtNum } from "@/lib/format";

export default function QuantDashboard() {
  const { data: strategies, refresh } = useEntityList("TradingStrategy", {}, "-created_date", 20);

  const active = strategies.filter((s) => s.status === "active").length;
  const totalPnl = strategies.reduce((a, s) => a + (s.pnl || 0), 0);
  const capital = strategies.reduce((a, s) => a + (s.allocated_capital || 0), 0);
  const avgWin = strategies.length
    ? strategies.reduce((a, s) => a + (s.win_rate || 0), 0) / strategies.length
    : 0;

  return (
    <div className="space-y-4">
      <PageHeader
        icon={BarChart3}
        title="AI 量化中心"
        subtitle="Minara-AI 策略生成 · Alpha 六因子 · 自动风控熔断 · 跨链再平衡 · 多智能体竞技"
        badge={<Badge variant="purple">Minara-AI</Badge>}
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard label="运行中策略" value={active} unit={`/ ${strategies.length}`} icon={Target} accent="cyan" />
        <StatCard
          label="累计盈亏"
          value={fmtNum(totalPnl)}
          unit="NMS"
          icon={BarChart3}
          accent={totalPnl >= 0 ? "rose" : "emerald"}
        />
        <StatCard label="管理资金" value={fmtNum(capital)} unit="NMS" icon={Network} accent="violet" />
        <StatCard label="平均胜率" value={avgWin.toFixed(1)} unit="%" icon={ShieldAlert} accent="amber" />
      </div>

      <Tabs defaultValue="strategy">
        <TabsList>
          <TabsTrigger value="strategy">策略工作室</TabsTrigger>
          <TabsTrigger value="alpha">Alpha 六因子</TabsTrigger>
          <TabsTrigger value="risk">风控熔断</TabsTrigger>
          <TabsTrigger value="cross">跨链调度</TabsTrigger>
          <TabsTrigger value="backtest">回测</TabsTrigger>
          <TabsTrigger value="ai">AI 引擎</TabsTrigger>
        </TabsList>

        <TabsContent value="strategy">
          <div className="grid gap-4 lg:grid-cols-2">
            <StrategyStudio strategies={strategies} onChanged={refresh} />
            <AlphaSystem />
          </div>
        </TabsContent>

        <TabsContent value="alpha">
          <AlphaSystem />
        </TabsContent>

        <TabsContent value="risk">
          <div className="grid gap-4 lg:grid-cols-2">
            <AICircuitBreaker />
            <BacktestPanel />
          </div>
        </TabsContent>

        <TabsContent value="cross">
          <div className="grid gap-4 lg:grid-cols-2">
            <CrossChainRebalancer />
            <AITradingAssistant />
          </div>
        </TabsContent>

        <TabsContent value="backtest">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <BacktestPanel />
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <p className="flex items-center gap-1.5 text-sm font-semibold">
                <FlaskConical className="h-4 w-4 text-cyan-300" /> 进化优化
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                遗传算法对策略参数做 200 代进化，适应度函数 = 夏普 × 0.5 + 年化收益 × 0.3 − 最大回撤 × 0.2。
              </p>
              <div className="mt-2 space-y-1">
                {[
                  ["第 50 代", "适应度 1.82"],
                  ["第 120 代", "适应度 2.34"],
                  ["第 200 代", "适应度 2.71（最优）"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between rounded-lg bg-white/5 px-2 py-1 text-[10px]">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="num text-cyan-300">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="ai">
          <div className="grid gap-4 lg:grid-cols-2">
            <AITradingAssistant />
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <p className="flex items-center gap-1.5 text-sm font-semibold">
                <Bot className="h-4 w-4 text-violet-300" /> Minara-AI 引擎
              </p>
              <div className="mt-2 space-y-1.5">
                {[
                  ["策略生成", "已生成 128 个候选策略"],
                  ["回测验证", "通过 42 个，胜率 > 65%"],
                  ["在线运行", `${active} 个策略实时执行`],
                  ["风控干预", "本月 3 次自动熔断"],
                  ["模型版本", "Minara-AI v4.2（在线学习）"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-white/5 py-1 text-[10px] last:border-0">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="text-right text-foreground">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
