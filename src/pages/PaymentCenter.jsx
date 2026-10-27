import React, { useState } from "react";
import { CreditCard, Plus, QrCode, Receipt, ScanLine, Send, Store } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { SectionCard, EmptyState } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ScanPayModal from "@/components/payment/ScanPayModal";
import PaymentResultModal from "@/components/payment/PaymentResultModal";
import MerchantDashboard from "@/components/payment/MerchantDashboard";
import TransferDialog from "@/components/wallet/TransferDialog";
import RWANFTListingModal from "@/components/merchant/RWANFTListingModal";
import { useSession } from "@/hooks/useSession";
import { useEntityList } from "@/hooks/useEntity";
import { fmtNum, fmtDate } from "@/lib/format";
import { calcPaymentSplit } from "@/lib/engine";

export default function PaymentCenter() {
  const { balance, accounts, user, refresh } = useSession();
  const { data: orders } = useEntityList("PaymentOrder", { user_email: user?.email }, "-created_date", 20);
  const { data: stores } = useEntityList("MerchantStore", { owner_email: "merchant0@nms.ai" }, "-created_date", 10);
  const [payOpen, setPayOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [rwaOpen, setRwaOpen] = useState(false);
  const [result, setResult] = useState(null);

  const sample = calcPaymentSplit(100, 10);

  return (
    <div className="space-y-4">
      <PageHeader
        icon={CreditCard}
        title="支付中心"
        subtitle="元Pay · 扫码付 / 收款 / 转账 · 消费即铸造，链上即时结算"
        badge={<Badge variant="success">0 Gas</Badge>}
        actions={
          <>
            <Button size="sm" variant="outline" onClick={() => setTransferOpen(true)}>
              <Send className="h-3.5 w-3.5" /> 转账
            </Button>
            <Button size="sm" onClick={() => setPayOpen(true)}>
              <ScanLine className="h-3.5 w-3.5" /> 扫码支付
            </Button>
          </>
        }
      />

      <Tabs defaultValue="user">
        <TabsList>
          <TabsTrigger value="user">用户端</TabsTrigger>
          <TabsTrigger value="merchant">商家端</TabsTrigger>
          <TabsTrigger value="rule">分红规则</TabsTrigger>
        </TabsList>

        <TabsContent value="user">
          <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
            <div className="space-y-4">
              <SectionCard title="快捷支付" icon={QrCode} desc="扫码识别商家 → 输入金额 → DID 打赏 → 链上结算">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayOpen(true)}
                    className="flex flex-col items-center gap-2 rounded-xl border border-cyan-400/25 bg-gradient-to-br from-cyan-500/15 to-transparent p-4 transition-transform hover:-translate-y-0.5"
                  >
                    <ScanLine className="h-6 w-6 text-cyan-300" />
                    <span className="text-xs font-medium">扫码付</span>
                    <span className="text-[10px] text-muted-foreground">1:1 返 NMS</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransferOpen(true)}
                    className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-transform hover:-translate-y-0.5"
                  >
                    <Send className="h-6 w-6 text-emerald-300" />
                    <span className="text-xs font-medium">转账</span>
                    <span className="text-[10px] text-muted-foreground">五子账户互转</span>
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                  <span className="text-[11px] text-muted-foreground">可用余额</span>
                  <span className="num text-sm font-semibold text-emerald-300">
                    {fmtNum(balance?.available_nms || 0)} NMS
                  </span>
                </div>
              </SectionCard>

              <SectionCard title="我的消费订单" icon={Receipt} desc={`${orders.length} 笔`}>
                {orders.length === 0 ? (
                  <EmptyState title="暂无消费记录" desc="扫码消费后自动生成订单与 NFT 凭证" />
                ) : (
                  <div className="space-y-1">
                    {orders.slice(0, 8).map((o) => (
                      <div key={o.id} className="flex items-center gap-2 border-b border-white/5 py-1.5 last:border-0">
                        <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/5">
                          <Store className="h-3.5 w-3.5 text-cyan-300" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[11px] font-medium">{o.merchant_name}</p>
                          <p className="num text-[9px] text-muted-foreground">
                            {o.order_no} · {fmtDate(o.created_date, true)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="num text-[11px]">¥{fmtNum(o.amount)}</p>
                          <p className="text-[9px] text-emerald-300">+{fmtNum(o.user_reward)} NMS</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            </div>

            <SectionCard title="商家端入口" icon={Store} desc="门店收款 · RWA 上架 · 分红池管理">
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start" onClick={() => setRwaOpen(true)}>
                  <Plus className="h-4 w-4" /> RWA 资产上架（5 步确权）
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => setPayOpen(true)}>
                  <QrCode className="h-4 w-4" /> 二维码收款
                </Button>
              </div>
              <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-[10px] text-muted-foreground">示例：单笔 ¥100 消费的分红结构</p>
                <div className="mt-1.5 space-y-0.5 text-[10px]">
                  {[
                    ["消费者 1:1 返利", `+${sample.userReward} NMS`],
                    ["商家打赏成本（10%）", `-${sample.merchantConsumed} NMS`],
                    ["商家双倍返还", `+${sample.merchantReturn} NMS`],
                    ["VIP 推荐人 20%", `+${sample.vipReward} NMS`],
                    ["级差 72.9%", `+${sample.levelDiffReward} NMS`],
                    ["杰出贡献 7.1%", `+${sample.contributorReward} NMS`],
                    ["NFT 分红池", `+${sample.nftPoolAdd} NMS`],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-muted-foreground">{k}</span>
                      <span className="num">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>
          </div>
        </TabsContent>

        <TabsContent value="merchant">
          <MerchantDashboard stores={stores.length ? stores : []} />
        </TabsContent>

        <TabsContent value="rule">
          <SectionCard title="消费分红模型" icon={Receipt} desc="规范 7.1 · 单笔 ¥100 消费">
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                ["消费者 +100 NMS", "1:1 返利，进入 9×9×9 释放池", "text-emerald-300"],
                ["商家成本 -10 NMS", "打赏比例 10%，可调 5-30%", "text-rose-300"],
                ["商家返还 +20 NMS", "双倍返还至商家分红池", "text-emerald-300"],
                ["VIP 推荐人 +20 NMS", "永久 20%，不限层级", "text-cyan-300"],
                ["极差奖励 72.9%", "M1-M9 每级 8.1%", "text-violet-300"],
                ["杰出贡献 7.1%", "DAO 投票分配", "text-amber-300"],
                ["NFT 分红池 +10 NMS", "实物 NFT / 门店 NFT 各 50%", "text-fuchsia-300"],
                ["永久版税 10%", "推荐人/商家/节点/平台各 2.5%", "text-sky-300"],
              ].map(([t, d, c]) => (
                <div key={t} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <p className={`text-xs font-semibold ${c}`}>{t}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{d}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </TabsContent>
      </Tabs>

      <ScanPayModal
        open={payOpen}
        onOpenChange={setPayOpen}
        balance={balance}
        onComplete={(r) => {
          setResult(r);
          refresh();
        }}
      />
      <PaymentResultModal open={!!result} onOpenChange={(v) => !v && setResult(null)} result={result} />
      <TransferDialog open={transferOpen} onOpenChange={setTransferOpen} accounts={accounts} onDone={refresh} />
      <RWANFTListingModal open={rwaOpen} onOpenChange={setRwaOpen} balance={balance} onDone={refresh} />
    </div>
  );
}
