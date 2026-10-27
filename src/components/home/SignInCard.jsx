import React, { useState } from "react";
import confetti from "canvas-confetti";
import { CalendarCheck, Flame, Gift } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { base44 } from "@/api/base44Client";
import { fmtNum } from "@/lib/format";

const today = () => new Date().toISOString().slice(0, 10);

/** 签到打卡（连续签到奖励递增） */
export default function SignInCard({ balance, onDone }) {
  const [busy, setBusy] = useState(false);
  const signedToday = balance?.last_sign_in === today();
  const streak = balance?.sign_in_days || 0;
  const reward = 5 + Math.min(45, Math.floor(streak / 3) * 5);

  const signIn = async () => {
    if (!balance?.id || busy) return;
    setBusy(true);
    try {
      await base44.entities.UserBalance.update(balance.id, {
        sign_in_days: signedToday ? streak : streak + 1,
        last_sign_in: today(),
        available_nms: (balance.available_nms || 0) + (signedToday ? 0 : reward),
        total_rewards: (balance.total_rewards || 0) + (signedToday ? 0 : reward),
      });
      if (!signedToday) {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 }, colors: ["#22d3ee", "#34d399", "#a78bfa"] });
        toast.success(`签到成功，获得 ${reward} NMS`);
      }
      onDone?.();
    } catch (e) {
      toast.error("签到失败，请稍后重试");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-amber-400/25 bg-amber-400/10 text-amber-300">
              <CalendarCheck className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold">每日签到</p>
              <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Flame className="h-3 w-3 text-amber-400" /> 连续 {streak} 天
              </p>
            </div>
          </div>
          <Button size="sm" onClick={signIn} disabled={signedToday || busy} variant={signedToday ? "secondary" : "default"}>
            <Gift className="h-3.5 w-3.5" />
            {signedToday ? "今日已签" : `签到 +${reward}`}
          </Button>
        </div>
        <div className="mt-3 flex justify-between gap-1">
          {Array.from({ length: 7 }, (_, i) => {
            const active = i < Math.min(7, streak % 7 === 0 && streak > 0 ? 7 : streak % 7);
            return (
              <div
                key={i}
                className={`flex-1 rounded-lg border py-1.5 text-center text-[10px] ${
                  active
                    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                    : "border-white/10 bg-white/[0.03] text-muted-foreground"
                }`}
              >
                <p>D{i + 1}</p>
                <p className="num">{5 + i * 5}</p>
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground">
          累计签到奖励已发放 <span className="num text-emerald-300">{fmtNum(balance?.total_rewards || 0)}</span> NMS
        </p>
      </CardContent>
    </Card>
  );
}
