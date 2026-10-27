import React, { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Boxes, Coins, Gift, Receipt, Store, TrendingUp } from "lucide-react";
import { SectionCard, DataRow, EmptyState } from "@/components/common/SectionCard";
import { StatCard } from "@/components/common/StatCard";
import { Select, SelectOption } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { fmtNum, fmtDate } from "@/lib/format";
import { useEntityList } from "@/hooks/useEntity";
import MerchantQRCode from "./MerchantQRCode";

/** 商家仪表盘（收款 / 分红池 / NFT 发行） */
export default function MerchantDashboard({ stores = [] }) {
  const [storeId, setStoreId] = useState(stores[0]?.id || "");
  const store = stores.find((s) => s.id === storeId) || stores[0];
  const { data: orders } = useEntityList("PaymentOrder", { merchant_id: store?.id }, "-created_date", 50);

  const chart = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => ({
      day: `D-${6 - i}`,
      amount: Math.round(1200 + Math.sin(i * 1.3) * 620 + i * 180),
    }));
    return days;
  }, []);

  if (!store) return <EmptyState title="暂无门店" desc="请先提交商家入驻申请" icon={Store} />;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Store className="h-4 w-4 text-cyan-300" />
          <h3 className="text-sm font-semibold">商家仪表盘</h3>
          {store.is_verified ? <Badge variant="success">已认证</Badge> : <Badge variant="warning">待认证</Badge>}
        </div>
        <Select value={storeId} onChange={(e) => setStoreId(e.target.value)} className="h-8 w-44 text-xs">
          {stores.map((s) => (
            <SelectOption key={s.id} value={s.id}>
              {s.store_name}
            </SelectOption>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard label="累计销售额" value={fmtNum(store.total_sales)} unit="元" icon={TrendingUp} accent="emerald" />
        <StatCard label="累计交易" value={store.total_transactions} unit="笔" icon={Receipt} accent="cyan" />
        <StatCard label="分红池" value={fmtNum(store.dividend_pool)} unit="NMS" icon={Coins} accent="violet" />
        <StatCard label="红包池" value={fmtNum(store.lucky_packet_pool)} unit="NMS" icon={Gift} accent="amber" />
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
        <SectionCard title="近 7 日流水" icon={TrendingUp} desc={`打赏比例 ${store.tip_ratio}%`}>
          <div className="h-[140px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                <CartesianGrid stroke="rgba(148,163,184,0.1)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "rgba(13,21,38,0.96)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10,
                    fontSize: 11,
                  }}
                  formatter={(v) => [`¥${v}`, "流水"]}
                />
                <Bar dataKey="amount" fill="#34d399" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <MerchantQRCode store={store} />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <SectionCard title="资金池明细" icon={Boxes}>
          <DataRow label="打赏钱包余额" value={fmtNum(store.tip_wallet_balance)} />
          <DataRow label="分红池" value={fmtNum(store.dividend_pool)} valueClass="text-violet-300" />
          <DataRow label="实物 NFT 池" value={fmtNum(store.physical_nft_pool)} />
          <DataRow label="门店 NFT 池" value={fmtNum(store.store_nft_pool)} />
          <DataRow label="已销毁打赏" value={fmtNum(store.total_tips_burned)} valueClass="text-rose-300" />
          <DataRow
            label="门店 NFT 发行"
            value={`${store.store_nft_issued}/${store.store_nft_limit}`}
            hint="每个门店最多发行 100 份股权凭证"
          />
        </SectionCard>

        <SectionCard title="最近订单" icon={Receipt} desc={`${orders.length} 笔`}>
          {orders.length === 0 ? (
            <EmptyState title="暂无订单" />
          ) : (
            <div className="max-h-64 space-y-1 overflow-y-auto">
              {orders.slice(0, 10).map((o) => (
                <div key={o.id} className="flex items-center justify-between border-b border-white/5 py-1.5 text-[11px] last:border-0">
                  <div className="min-w-0">
                    <p className="num truncate">{o.order_no}</p>
                    <p className="text-[9px] text-muted-foreground">{fmtDate(o.created_date, true)}</p>
                  </div>
                  <div className="text-right">
                    <p className="num font-medium">¥{fmtNum(o.amount)}</p>
                    <p className="text-[9px] text-emerald-300">+{fmtNum(o.merchant_return)} NMS</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
