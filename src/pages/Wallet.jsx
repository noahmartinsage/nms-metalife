import React, { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Coins, LayoutGrid, QrCode, Receipt, Wallet as WalletIcon } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { SectionCard, EmptyState, DataRow } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import NMSPriceChart from "@/components/wallet/NMSPriceChart";
import WalletReleaseProgress from "@/components/wallet/WalletReleaseProgress";
import ReleaseScheduleModal from "@/components/wallet/ReleaseScheduleModal";
import EarningsDetailModal from "@/components/wallet/EarningsDetailModal";
import TransferDialog from "@/components/wallet/TransferDialog";
import ReceiveQRCode from "@/components/wallet/ReceiveQRCode";
import P2PWalletHub from "@/components/wallet/P2PWalletHub";
import AgenticWallet from "@/components/wallet/AgenticWallet";
import { useSession } from "@/hooks/useSession";
import { useEntityList } from "@/hooks/useEntity";
import { fmtNum, fmtDate, shortHash } from "@/lib/format";

const ACCOUNT_LABEL = {
  main: "主账户",
  savings: "储蓄",
  trading: "交易",
  staking: "质押",
  spending: "消费",
};

export default function Wallet() {
  const { balance, accounts, user, refresh } = useSession();
  const { data: nfts } = useEntityList("NFTItem", { owner_email: user?.email }, "-created_date", 50);
  const { data: txs } = useEntityList("Transaction", {}, "-created_date", 12);
  const [tab, setTab] = useState("assets");
  const [transferOpen, setTransferOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [earningsOpen, setEarningsOpen] = useState(false);

  const totalNms =
    (balance?.available_nms || 0) + (balance?.pending_release_nms || 0) + (balance?.locked_nms || 0);

  return (
    <div className="space-y-4">
      <PageHeader
        icon={WalletIcon}
        title="钱包"
        subtitle="五子账户 · 9×9×9 释放 · P2P 账本 · Agentic 钱包"
        badge={<Badge variant="default">0 Gas</Badge>}
        actions={
          <>
            <Button size="sm" variant="outline" onClick={() => setReceiveOpen(true)}>
              <QrCode className="h-3.5 w-3.5" /> 收款
            </Button>
            <Button size="sm" onClick={() => setTransferOpen(true)}>
              <ArrowUpRight className="h-3.5 w-3.5" /> 转账
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <NMSPriceChart holding={totalNms} />
        <WalletReleaseProgress balance={balance} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
        <div className="space-y-4">
          <SectionCard
            title="我的资产"
            desc={`总持仓 ${fmtNum(totalNms)} NMS`}
            icon={Coins}
            actions={
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => setScheduleOpen(true)}>
                  释放计划
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEarningsOpen(true)}>
                  收益明细
                </Button>
              </div>
            }
          >
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList>
                <TabsTrigger value="assets">子账户</TabsTrigger>
                <TabsTrigger value="nft">NFT ({nfts.length})</TabsTrigger>
                <TabsTrigger value="tx">账单</TabsTrigger>
              </TabsList>

              <TabsContent value="assets">
                <div className="grid gap-2 sm:grid-cols-2">
                  {accounts.map((a) => (
                    <div key={a.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-xs font-medium">
                          <LayoutGrid className="h-3.5 w-3.5 text-cyan-300" />
                          {ACCOUNT_LABEL[a.account_type] || a.account_name}
                        </span>
                        {a.is_nfc_enabled && <Badge variant="success">NFC</Badge>}
                      </div>
                      <p className="num mt-1.5 text-lg font-semibold">{fmtNum(a.nms_balance)}</p>
                      <p className="text-[10px] text-muted-foreground">NMS · {shortHash(a.address)}</p>
                      <div className="mt-2 flex gap-2 text-[10px] text-muted-foreground">
                        <span>ACS {fmtNum(a.acs_balance)}</span>
                        <span>YSE {fmtNum(a.yse_balance)}</span>
                        <span>GCP {fmtNum(a.gcp_balance)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="nft">
                {nfts.length === 0 ? (
                  <EmptyState title="暂无 NFT 资产" desc="在 AI 商城消费即可自动铸造实物 NFT" />
                ) : (
                  <div className="space-y-1.5">
                    {nfts.slice(0, 8).map((n) => (
                      <div key={n.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-medium">{n.name}</p>
                          <p className="text-[9px] text-muted-foreground">
                            {n.nft_type === "physical"
                              ? "实物"
                              : n.nft_type === "store"
                                ? "门店"
                                : n.nft_type === "node"
                                  ? "节点"
                                  : "个人"}{" "}
                            · 版税 {n.royalty_percent}% · 交易 {n.trade_count} 次
                          </p>
                        </div>
                        <span className="num text-[11px] text-cyan-300">{fmtNum(n.price)} NMS</span>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="tx">
                <div className="space-y-1">
                  {txs.map((t) => (
                    <div key={t.id} className="flex items-center gap-2 border-b border-white/5 py-1.5 last:border-0">
                      <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/5">
                        {t.status === "confirmed" ? (
                          <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <ArrowUpRight className="h-3.5 w-3.5 text-amber-400" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px]">
                          {t.token_type} · {shortHash(t.tx_hash)}
                        </p>
                        <p className="text-[9px] text-muted-foreground">
                          {fmtDate(t.created_date, true)} · Gas {t.gas_fee}
                        </p>
                      </div>
                      <span className="num text-[11px]">{fmtNum(t.amount)}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </SectionCard>

          <SectionCard title="释放与分红摘要" icon={Receipt}>
            <DataRow label="待释放 NMS" value={fmtNum(balance?.pending_release_nms || 0)} />
            <DataRow label="锁仓 NMS" value={fmtNum(balance?.locked_nms || 0)} valueClass="text-amber-300" />
            <DataRow label="NFT 分红累计" value={fmtNum(balance?.nft_dividends_total || 0)} valueClass="text-violet-300" />
            <DataRow label="版税收入累计" value={fmtNum(balance?.royalty_earnings_total || 0)} valueClass="text-emerald-300" />
            <DataRow
              label="当前释放周期"
              value={`${balance?.release_days || 999} 天 · ${balance?.release_speed_factor || 1}x`}
            />
          </SectionCard>
        </div>

        <div className="space-y-4">
          <P2PWalletHub address={accounts[0]?.address} />
          <AgenticWallet />
        </div>
      </div>

      <TransferDialog open={transferOpen} onOpenChange={setTransferOpen} accounts={accounts} onDone={refresh} />
      <ReceiveQRCode
        open={receiveOpen}
        onOpenChange={setReceiveOpen}
        address={accounts[0]?.address}
        accountName={accounts[0]?.account_name}
      />
      <ReleaseScheduleModal open={scheduleOpen} onOpenChange={setScheduleOpen} balance={balance} />
      <EarningsDetailModal open={earningsOpen} onOpenChange={setEarningsOpen} balance={balance} />
    </div>
  );
}
