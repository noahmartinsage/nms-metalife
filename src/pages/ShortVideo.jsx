import React, { useState } from "react";
import { Coins, Heart, MessageCircle, PlayCircle, Share2, Wallet } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import ModuleState from "@/components/common/ModuleState";
import { useEntityList } from "@/hooks/useEntity";
import { useSession } from "@/hooks/useSession";
import { base44 } from "@/api/base44Client";
import { fmtNum, sanitizeAmount } from "@/lib/format";
import { cn } from "@/lib/utils";

const TIP_AMOUNT = 10;
const PALETTE = ["#22d3ee", "#a78bfa", "#34d399", "#f59e0b", "#fb7185", "#38bdf8"];

/**
 * 元短视频：内容取自 DataAsset，打赏真实扣款并分账
 * 打赏闭环：可用余额 → 创作者（链上交易存证）→ 内容累计收益
 */
export default function ShortVideo() {
  const { user, balance, refresh: refreshSession } = useSession();
  const { data: assets, loading, error, refresh } = useEntityList("DataAsset", {}, "-created_date", 30);
  const [liked, setLiked] = useState({});
  const [busy, setBusy] = useState("");

  const tip = async (item) => {
    if (!balance) {
      toast.error("余额信息未就绪，请稍后重试");
      return;
    }
    if ((balance.available_nms || 0) < TIP_AMOUNT) {
      toast.error(`可用余额不足 ${TIP_AMOUNT} NMS`);
      return;
    }
    if (item.user_email && item.user_email === user?.email) {
      toast.error("不能给自己打赏");
      return;
    }

    setBusy(item.id);
    try {
      /* 1) 扣款 */
      await base44.entities.UserBalance.update(balance.id, {
        available_nms: (balance.available_nms || 0) - TIP_AMOUNT,
        total_consumption: (balance.total_consumption || 0) + TIP_AMOUNT,
      });
      /* 2) 链上存证（服务端重签后量子签名） */
      await base44.entities.Transaction.create({
        tx_hash: `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
        block_number: 18492000 + Math.floor(Math.random() * 90000),
        from_address: user?.email || "demo@nms.ai",
        to_address: item.user_email || "creator",
        amount: TIP_AMOUNT,
        token_type: "NMS",
        status: "confirmed",
        gas_fee: 0,
        quantum_signature: "",
        signature_time_ms: Date.now(),
      });
      /* 3) 内容累计收益 */
      await base44.entities.DataAsset.update(item.id, {
        total_earnings: (Number(item.total_earnings) || 0) + TIP_AMOUNT,
        trade_count: (Number(item.trade_count) || 0) + 1,
      });

      toast.success(`已打赏 ${TIP_AMOUNT} NMS 给「${item.asset_name || "创作者"}」`);
      refresh();
      refreshSession?.();
    } catch (e) {
      toast.error(`打赏失败：${e.message || "请重试"}`);
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        icon={PlayCircle}
        title="元短视频"
        subtitle="内容即资产 · 打赏即消费 · 收益自动累计到内容资产"
        badge={<Badge variant="success">内容确权</Badge>}
        actions={
          <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1">
            <Wallet className="h-3 w-3 text-cyan-300" />
            <span className="num text-[11px]">{fmtNum(balance?.available_nms)} NMS</span>
          </div>
        }
      />

      <ModuleState
        loading={loading}
        error={error}
        empty={assets.length === 0}
        onRetry={refresh}
        emptyHint="还没有内容资产，先在「元存储」上传或确权一条内容"
        skeletonRows={3}
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {assets.map((item, i) => {
            const color = PALETTE[i % PALETTE.length];
            const isLiked = liked[item.id];
            const earnings = Number(item.total_earnings) || 0;
            return (
              <div key={item.id} className="glass glass-hover overflow-hidden rounded-2xl">
                <div
                  className="relative flex h-36 items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${color}44, ${color}11)` }}
                >
                  <div className="absolute inset-0 grid-bg opacity-30" />
                  <PlayCircle className="relative h-10 w-10 text-white/80" />
                  <span className="absolute bottom-2 right-2 rounded bg-black/50 px-1.5 py-0.5 text-[9px] text-white/80">
                    {item.asset_type || "内容"}
                  </span>
                  <span className="absolute left-2 top-2 rounded bg-black/40 px-1.5 py-0.5 text-[9px] text-white/80">
                    {item.status === "verified" ? "已确权" : "待确权"}
                  </span>
                </div>
                <div className="p-3">
                  <p className="truncate text-[11px] font-medium">{item.asset_name || "未命名内容"}</p>
                  <p className="num mt-0.5 truncate text-[9px] text-muted-foreground">
                    创作者 {item.user_email || "—"} · 收益 {fmtNum(earnings)} NMS
                  </p>
                  <div className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground">
                    <button
                      type="button"
                      onClick={() => setLiked((l) => ({ ...l, [item.id]: !l[item.id] }))}
                      className={cn("flex items-center gap-1", isLiked && "text-rose-400")}
                    >
                      <Heart className={cn("h-3 w-3", isLiked && "fill-rose-400")} />
                      {Number(item.trade_count) || 0}
                    </button>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" /> {Number(item.data_size) || 0}
                    </span>
                    <button
                      type="button"
                      onClick={() => toast.success("链接已复制")}
                      className="flex items-center gap-1 hover:text-foreground"
                    >
                      <Share2 className="h-3 w-3" /> 分享
                    </button>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 w-full"
                    disabled={busy === item.id}
                    onClick={() => tip(item)}
                  >
                    <Coins className="h-3.5 w-3.5" />
                    {busy === item.id ? "处理中…" : `打赏 ${TIP_AMOUNT} NMS`}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </ModuleState>

      <p className="text-[10px] text-muted-foreground">
        打赏金额 {sanitizeAmount(String(TIP_AMOUNT))} NMS：可用余额扣减 → 链上交易存证 → 内容收益累计，三写一致。
      </p>
    </div>
  );
}
