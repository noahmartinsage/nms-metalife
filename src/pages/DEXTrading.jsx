import React, { useMemo, useState } from "react";
import { ArrowLeftRight, CandlestickChart as CandleIcon, Layers, Repeat } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import CandlestickChart from "@/components/dex/CandlestickChart";
import OrderBook from "@/components/dex/OrderBook";
import TradePanel from "@/components/dex/TradePanel";
import RecentTrades from "@/components/dex/RecentTrades";
import SwapInterface from "@/components/dex/SwapInterface";
import AITradingAssistant from "@/components/dex/AITradingAssistant";
import { candleSeries, NMS_GUIDE_PRICE } from "@/lib/market";
import { useSession } from "@/hooks/useSession";
import { cn } from "@/lib/utils";
import { fmtNum } from "@/lib/format";

const PERIODS = [
  { label: "1m", minutes: 1, count: 60 },
  { label: "5m", minutes: 5, count: 60 },
  { label: "15m", minutes: 15, count: 60 },
  { label: "1H", minutes: 60, count: 60 },
  { label: "4H", minutes: 240, count: 60 },
  { label: "1D", minutes: 1440, count: 60 },
  { label: "1W", minutes: 10080, count: 40 },
];

export default function DEXTrading() {
  const { balance, refresh } = useSession();
  const [period, setPeriod] = useState(3);
  const candles = useMemo(
    () => candleSeries(PERIODS[period].count, PERIODS[period].minutes, NMS_GUIDE_PRICE, period + 11),
    [period]
  );
  const last = candles[candles.length - 1];
  const change = ((last.close - candles[0].open) / candles[0].open) * 100;

  return (
    <div className="space-y-4">
      <PageHeader
        icon={CandleIcon}
        title="DEX 交易所"
        subtitle="CLOB 订单簿（Hyperliquid L2）+ AMM 一键兑换（Lighter）· 多周期 K 线 · 1-125x 杠杆 · 0 Gas"
        badge={<Badge variant="success">0 Gas</Badge>}
        actions={
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="num text-lg font-bold">{last.close.toFixed(4)}</span>
            <span className={cn("num text-[11px]", change >= 0 ? "text-rose-400" : "text-emerald-400")}>
              {change >= 0 ? "+" : ""}
              {change.toFixed(2)}%
            </span>
            <Badge variant="outline">NMS/ACS</Badge>
          </div>
        }
      />

      <Tabs defaultValue="book">
        <TabsList>
          <TabsTrigger value="book">
            <Layers className="mr-1 inline h-3 w-3" /> 订单簿
          </TabsTrigger>
          <TabsTrigger value="swap">
            <Repeat className="mr-1 inline h-3 w-3" /> 一键兑换
          </TabsTrigger>
          <TabsTrigger value="perp">
            <ArrowLeftRight className="mr-1 inline h-3 w-3" /> 永续合约
          </TabsTrigger>
        </TabsList>

        <TabsContent value="book">
          <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr_1fr]">
            <SectionCard
              title="NMS / ACS"
              desc={`24h 成交额 ${fmtNum(24_800_000)} ACS · 持仓量 ${fmtNum(8_640_000)}`}
              icon={CandleIcon}
              actions={
                <div className="flex gap-0.5">
                  {PERIODS.map((p, i) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setPeriod(i)}
                      className={cn(
                        "rounded px-1 py-0.5 text-[9px]",
                        period === i ? "bg-cyan-400/15 text-cyan-200" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              }
            >
              <CandlestickChart candles={candles} height={252} />
            </SectionCard>
            <OrderBook mid={last.close} />
            <TradePanel mid={last.close} balance={balance} onDone={refresh} />
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <RecentTrades />
            <AITradingAssistant />
          </div>
        </TabsContent>

        <TabsContent value="swap">
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <SwapInterface balance={balance} />
            <AITradingAssistant />
          </div>
        </TabsContent>

        <TabsContent value="perp">
          <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
            <SectionCard title="NMS 永续" desc="0 资金费率 · AI 风控自动止损" icon={CandleIcon}>
              <CandlestickChart candles={candles} height={252} />
              <div className="mt-2 grid grid-cols-4 gap-2 text-center">
                {[
                  ["标记价格", last.close.toFixed(4)],
                  ["指数价格", (last.close * 0.999).toFixed(4)],
                  ["资金费率", "0.0000%"],
                  ["下次结算", "07:59:59"],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-lg border border-white/10 bg-white/[0.03] py-1.5">
                    <p className="num text-[11px] font-medium">{v}</p>
                    <p className="text-[9px] text-muted-foreground">{k}</p>
                  </div>
                ))}
              </div>
            </SectionCard>
            <TradePanel mid={last.close} balance={balance} onDone={refresh} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
