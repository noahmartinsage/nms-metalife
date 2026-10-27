import React, { useState } from "react";
import { Copy, Link2, QrCode, Share2, Users, UserPlus, Layers, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { useReferral } from "@/hooks/useReferral";
import { MATRIX_LAYERS } from "@/lib/promotionData";
import ReferralQRCode from "./ReferralQRCode";

/** 统一推荐系统（全站唯一推荐码来源：useReferral） */
export default function ReferralSystem({ compact = false }) {
  const { referralCode, referralLink, balance } = useReferral();
  const [copied, setCopied] = useState("");

  const copy = async (text, tag) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(tag);
      toast.success(tag === "code" ? "推荐码已复制" : "推荐链接已复制");
      setTimeout(() => setCopied(""), 1600);
    } catch (e) {
      toast.error("复制失败，请手动选择文本");
    }
  };

  return (
    <Card className="neon-border overflow-hidden">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Share2 className="h-4 w-4 text-cyan-300" />
              <h3 className="text-sm font-semibold">我的推荐网络</h3>
              <Badge variant="success">9×9×9 矩阵</Badge>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              直推 20%，2 层 10%，3 层 5%……9 层累计可覆盖 16,376 人
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => copy(referralLink, "link")}>
            {copied === "link" ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
            分享链接
          </Button>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-[auto_1fr]">
          <div className="flex items-center gap-3">
            <ReferralQRCode value={referralLink} size={compact ? 108 : 128} />
            <div className="space-y-2">
              <div>
                <p className="text-[10px] text-muted-foreground">推荐码</p>
                <button
                  type="button"
                  onClick={() => copy(referralCode, "code")}
                  className="num flex items-center gap-1.5 rounded-lg border border-cyan-400/25 bg-cyan-400/10 px-2.5 py-1 text-sm font-bold tracking-wider text-cyan-200"
                >
                  {referralCode}
                  {copied === "code" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
              <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <QrCode className="h-3 w-3" /> 扫码注册自动绑定
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "团队总人数", value: balance?.team_size ?? 0, icon: Users },
              { label: "直推人数", value: balance?.direct_referrals ?? 0, icon: UserPlus },
              { label: "矩阵层级", value: MATRIX_LAYERS.length, icon: Layers },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
                  <Icon className="h-3.5 w-3.5 text-cyan-300" />
                  <p className="num mt-1.5 text-base font-semibold">{s.value.toLocaleString("zh-CN")}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        {!compact && (
          <div className="mt-4 space-y-1.5">
            {MATRIX_LAYERS.map((l) => {
              const filled = Math.min(l.count, Math.round((balance?.team_size || 0) / 160));
              const pct = Math.min(100, (filled / l.count) * 100);
              return (
                <div key={l.layer} className="flex items-center gap-2">
                  <span className="w-10 shrink-0 text-[10px] text-muted-foreground">{l.label}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${Math.max(pct, 2)}%`, background: l.color }}
                    />
                  </div>
                  <span className="num w-12 shrink-0 text-right text-[10px] text-muted-foreground">
                    {filled}/{l.count}
                  </span>
                  <span className="num w-9 shrink-0 text-right text-[10px] text-emerald-300">{l.pct}%</span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
