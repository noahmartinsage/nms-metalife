import React from "react";
import { ArrowUpRight, Coins, Lock, Timer, TrendingUp, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { fmtNum, fmtPct } from "@/lib/format";
import { calcReleaseProgress, calcThreeDimension } from "@/lib/engine";
import { TOKENS } from "@/lib/promotionData";
import { createPageUrl } from "@/utils";

/** 首页余额总览 */
export default function BalanceOverview({ balance }) {
  const pending = balance?.pending_release_nms || 0;
  const releaseDays = balance?.release_days || 999;
  const progress = calcReleaseProgress({ pendingNms: pending, releaseDays, elapsedDays: Math.round(releaseDays * 0.32) });
  const dims = calcThreeDimension({
    consumption: balance?.consumption_level,
    referral: balance?.referral_level,
    nft: balance?.nft_synthesis_level,
  });

  const tokenBalances = {
    NMS: balance?.available_nms || 0,
    ACS: balance?.acs_balance || 0,
    YSE: balance?.yse_balance || 0,
    GCP: balance?.gcp_balance || 0,
  };

  return (
    <Card className="neon-border relative overflow-hidden">
      <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-cyan-500/15 blur-3xl" />
      <CardContent className="relative p-4 sm:p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Wallet className="h-3 w-3" /> 可用余额
            </p>
            <div className="mt-1 flex items-end gap-2">
              <span className="num text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {fmtNum(balance?.available_nms || 0)}
              </span>
              <span className="pb-1 text-xs text-muted-foreground">NMS</span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              约 ¥{fmtNum((balance?.available_nms || 0) * 0.42)} · 指导价 0.42 ACS
            </p>
          </div>
          <Link
            to={createPageUrl("Wallet")}
            className="flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            钱包 <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
            <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Timer className="h-3 w-3" /> 待释放
            </p>
            <p className="num mt-1 text-sm font-semibold text-cyan-300">{fmtNum(pending)}</p>
            <p className="text-[10px] text-muted-foreground">
              日释放 {fmtNum(progress.dailyRelease, 4)} · {progress.remainingDays} 天
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
            <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Lock className="h-3 w-3" /> 锁仓中
            </p>
            <p className="num mt-1 text-sm font-semibold text-amber-300">{fmtNum(balance?.locked_nms || 0)}</p>
            <p className="text-[10px] text-muted-foreground">NFT 发布 / 保证金冻结</p>
          </div>
        </div>

        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground">
              9×9×9 释放进度 · {dims.total}/27 级 · 加速 {dims.speed}x
            </span>
            <span className="num text-cyan-300">{fmtPct(progress.percent, 1)}</span>
          </div>
          <Progress value={progress.percent} />
        </div>

        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {TOKENS.map((t) => (
            <div key={t.symbol} className="rounded-lg border border-white/10 bg-black/20 px-2 py-1.5">
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: t.color }} />
                <span className="text-[10px] text-muted-foreground">{t.symbol}</span>
              </div>
              <p className="num mt-0.5 truncate text-[11px] font-semibold">{fmtNum(tokenBalances[t.symbol] || 0)}</p>
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <Badge variant="success">
            <TrendingUp className="h-2.5 w-2.5" /> 消费即分红
          </Badge>
          <Badge variant="purple">
            <Coins className="h-2.5 w-2.5" /> 永久版税 10%
          </Badge>
          <Badge variant="outline">0 Gas</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
