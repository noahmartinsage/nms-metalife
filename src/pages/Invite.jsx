import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, BadgeCheck, Copy, Download, Gift, Link2, QrCode, Share2, Users } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { SectionCard, DataRow } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import ReferralQRCode from "@/components/referral/ReferralQRCode";
import { MATRIX_LAYERS } from "@/lib/promotionData";
import { useReferral } from "@/hooks/useReferral";
import { fmtNum } from "@/lib/format";
import { createPageUrl } from "@/utils";

/** 推荐链接落地页（?ref=CODE）：绑定确认 + 二维码 + 团队数据 */
export default function Invite() {
  const [params] = useSearchParams();
  const { referralCode, balance } = useReferral();
  const [copied, setCopied] = useState("");
  const qrRef = useRef(null);

  const refFromUrl = (params.get("ref") || "").toUpperCase();
  const myCode = referralCode || "NMSDEMO";
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const inviteLink = `${origin}${createPageUrl("Invite")}?ref=${myCode}`;
  const registerLink = `${origin}${createPageUrl("Register")}?ref=${myCode}`;

  useEffect(() => {
    if (refFromUrl) localStorage.setItem("nms_ref_code", refFromUrl);
  }, [refFromUrl]);

  const copy = async (text, tag) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(tag);
      toast.success("已复制");
      setTimeout(() => setCopied(""), 1600);
    } catch (e) {
      toast.error("复制失败，请手动选择");
    }
  };

  const team = useMemo(
    () => [
      { label: "直推", value: balance?.direct_referrals ?? 0, rate: "20%" },
      { label: "间推", value: Math.max(0, (balance?.team_size || 0) - (balance?.direct_referrals || 0)), rate: "10%" },
      { label: "团队总人数", value: balance?.team_size ?? 0, rate: "—" },
    ],
    [balance]
  );

  /** 按层容量贪心填充，得到真实感的分层人数 */
  const layerDist = useMemo(() => {
    let rest = balance?.team_size || 0;
    return MATRIX_LAYERS.map((l) => {
      const filled = Math.min(l.count, Math.max(0, rest));
      rest -= filled;
      return { ...l, filled };
    });
  }, [balance]);

  return (
    <div className="space-y-4">
      <PageHeader
        icon={Share2}
        title="邀请好友"
        subtitle="分享链接或二维码，好友注册即自动绑定推荐关系，永久归因、链上可查"
        badge={<Badge variant="success">永久绑定</Badge>}
      />

      {refFromUrl && refFromUrl !== myCode && (
        <div className="glass glass-hover flex flex-wrap items-center justify-between gap-2 rounded-2xl p-3">
          <p className="flex items-center gap-1.5 text-[11px]">
            <BadgeCheck className="h-3.5 w-3.5 text-emerald-400" />
            你正在访问 <span className="num text-cyan-300">{refFromUrl}</span> 的邀请页，注册后将自动绑定该推荐人
          </p>
          <Link to={`${createPageUrl("Register")}?ref=${refFromUrl}`}>
            <Button size="sm">
              立即注册 <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <SectionCard title="我的邀请" desc="扫码或复制链接分享给好友" icon={QrCode}>
          <div className="flex flex-col items-center gap-2">
            <div ref={qrRef}>
              <ReferralQRCode value={inviteLink} size={168} />
            </div>
            <p className="num text-sm font-bold tracking-wider text-cyan-200">{myCode}</p>

            <div className="w-full space-y-1.5">
              <div className="flex gap-1">
                <Input readOnly value={inviteLink} className="h-8 text-[10px]" />
                <Button size="sm" variant="outline" onClick={() => copy(inviteLink, "invite")}>
                  {copied === "invite" ? <BadgeCheck className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
              <div className="flex gap-1">
                <Input readOnly value={registerLink} className="h-8 text-[10px]" />
                <Button size="sm" variant="outline" onClick={() => copy(registerLink, "register")}>
                  {copied === "register" ? <BadgeCheck className="h-3 w-3" /> : <Link2 className="h-3 w-3" />}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    const svg = qrRef.current?.querySelector("svg");
                    if (!svg) {
                      toast.error("二维码尚未生成");
                      return;
                    }
                    const blob = new Blob([new XMLSerializer().serializeToString(svg)], {
                      type: "image/svg+xml;charset=utf-8",
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `nms-invite-${myCode}.svg`;
                    a.click();
                    URL.revokeObjectURL(url);
                    toast.success("二维码已下载");
                  }}
                >
                  <Download className="h-3 w-3" /> 保存二维码
                </Button>
                <Link to={`${createPageUrl("Register")}?ref=${myCode}`}>
                  <Button size="sm" className="w-full">
                    <Gift className="h-3 w-3" /> 去注册
                  </Button>
                </Link>
              </div>
            </div>

            <div className="mt-3 w-full space-y-1.5">
              <p className="text-[10px] font-medium">邀请三步</p>
              {[
                ["① 分享", "发送链接或二维码给好友，附上你的推荐码"],
                ["② 注册", "好友通过链接注册，推荐关系自动上链绑定"],
                ["③ 分佣", "好友每笔消费，你实时获得 20% 推荐奖励"],
              ].map(([t, d]) => (
                <div key={t} className="flex items-start gap-2 rounded-lg bg-white/[0.02] px-2 py-1.5">
                  <span className="shrink-0 text-[10px] text-cyan-300">{t}</span>
                  <span className="text-[9px] leading-relaxed text-muted-foreground">{d}</span>
                </div>
              ))}
              <div className="rounded-lg border border-cyan-400/20 bg-cyan-400/5 px-2 py-1.5">
                <p className="text-[9px] text-muted-foreground">
                  收益预览：好友消费 <span className="num text-foreground">¥100</span> → 你获得{" "}
                  <span className="num text-emerald-300">20 NMS</span>，另计 9 层矩阵级差
                </p>
              </div>
            </div>
          </div>
        </SectionCard>

        <div className="space-y-4">
          <SectionCard title="我的团队" desc="9 层矩阵实时统计" icon={Users}>
            <div className="grid grid-cols-3 gap-1.5 text-center">
              {team.map((t) => (
                <div key={t.label} className="rounded-lg border border-white/10 bg-white/[0.03] py-1.5">
                  <p className="num text-[12px] font-semibold text-cyan-300">{fmtNum(t.value, 0)}</p>
                  <p className="text-[9px] text-muted-foreground">{t.label}</p>
                  <p className="num text-[8px] text-emerald-300">奖励 {t.rate}</p>
                </div>
              ))}
            </div>
            <div className="mt-2 space-y-1">
              {layerDist.slice(0, 5).map((l) => (
                <DataRow
                  key={l.layer}
                  label={l.label}
                  hint={`${l.pct}% · 上限 ${l.count} 人`}
                  value={`${l.filled} / ${l.count} 人`}
                />
              ))}
            </div>
          </SectionCard>

          <SectionCard title="邀请规则" desc="推荐关系与奖励口径" icon={Gift}>
            <ul className="space-y-1 text-[10px] leading-relaxed text-muted-foreground">
              <li>· 好友通过你的链接或二维码注册，自动写入 `referrer_email`，关系永久有效</li>
              <li>· 好友每笔消费，你获得消费额 <span className="text-cyan-300">20%</span> 的 VIP 推荐奖励</li>
              <li>· 矩阵 9 层递进：直推 20% → 2 层 10% → 3 层 5% → … → 9 层 0.2%</li>
              <li>· 好友购买礼包，你额外获得礼包金额 20% 的开通奖励</li>
              <li>· 所有奖励由智能合约实时结算，0 Gas，链上可查</li>
            </ul>
            <div className="mt-2 rounded-lg border border-white/10 bg-black/20 px-2 py-1.5 text-[9px] text-muted-foreground">
              已绑定推荐人：<span className="num text-cyan-300">{balance?.referrer_email || "未绑定"}</span>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
