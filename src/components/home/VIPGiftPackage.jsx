import React, { useState } from "react";
import confetti from "canvas-confetti";
import { BadgeCheck, Crown, Gift, Sparkles, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import { base44 } from "@/api/base44Client";
import { GIFT_PACKAGES, findTier } from "@/lib/promotionData";
import { fmtNum, mockQuantumSignature } from "@/lib/format";

/** VIP / 商家大礼包（规范 7.5 + 推荐人代激活） */
export default function VIPGiftPackage({ balance, onDone }) {
  const [selected, setSelected] = useState(null);
  const [proxy, setProxy] = useState(false);
  const [proxyEmail, setProxyEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const purchase = async () => {
    if (!selected || !balance?.id) return;
    if (proxy && !proxyEmail.includes("@")) {
      toast.error("请输入被激活人的邮箱");
      return;
    }
    setBusy(true);
    try {
      const tier = findTier(selected.tier);
      const doubled = selected.bonus * 2; // 首购翻倍赠送
      const targetEmail = proxy ? proxyEmail : balance.user_email;

      await base44.entities.PaymentOrder.create({
        order_no: `GIFT${Date.now().toString().slice(-9)}`,
        merchant_email: "fund@nms.ai",
        merchant_name: "NMS 礼包中心",
        user_email: targetEmail,
        amount: selected.total,
        payment_method: "mixed",
        tip_ratio: 0,
        merchant_consumed: 0,
        user_reward: doubled,
        merchant_return: 0,
        vip_reward: proxy ? selected.total * 0.2 : 0,
        level_diff_reward: 0,
        contributor_reward: selected.total * 0.071,
        physical_nft_pool_add: 0,
        nft_minted: false,
        burned_amount: selected.nms,
        status: "completed",
        quantum_signature: mockQuantumSignature(),
      });

      if (!proxy) {
        await base44.entities.UserBalance.update(balance.id, {
          available_nms: (balance.available_nms || 0) + doubled * 0.5,
          pending_release_nms: (balance.pending_release_nms || 0) + doubled * 0.5,
          major_level: tier.matchKey === "M1" ? "M1" : tier.matchKey,
          release_days: tier.releaseDays,
          release_speed_factor: Math.round((999 / tier.releaseDays) * 100) / 100,
          user_type: selected.id === "merchant" ? "商家" : "VIP用户",
        });
      }

      confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
      toast.success(proxy ? `已为 ${targetEmail} 代激活 ${selected.name}` : `开通成功，获赠 ${doubled} NMS`);
      setSelected(null);
      setProxy(false);
      setProxyEmail("");
      onDone?.();
    } catch (e) {
      toast.error("开通失败，请稍后重试");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-300" />
              <h3 className="text-sm font-semibold">VIP / 商家大礼包</h3>
            </div>
            <Badge variant="warning">75% 现金 + 25% NMS</Badge>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            首购翻倍赠送 NMS，开通即按 9×9×9 缩短释放周期
          </p>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {GIFT_PACKAGES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelected(p)}
                className="group rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-left transition-all hover:-translate-y-0.5 hover:border-white/25"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium" style={{ color: p.color }}>
                    {p.name}
                  </span>
                  <Gift className="h-3 w-3 text-muted-foreground" />
                </div>
                <p className="num mt-1 text-base font-bold">¥{p.total}</p>
                <p className="text-[10px] text-muted-foreground">
                  赠 {p.bonus} NMS · {p.releaseDays} 天
                </p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        {selected && (
          <DialogContent onClose={() => setSelected(null)}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-300" /> {selected.name} 开通
              </DialogTitle>
              <DialogDescription>
                支付完成即生效：等级晋升 → 释放周期缩短至 {selected.releaseDays} 天，首购 NMS 翻倍赠送
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs">
              {[
                ["礼包总价", `¥${selected.total}`],
                ["现金支付（75%）", `¥${selected.cash}`],
                ["NMS 支付（25%）", `${selected.nms} NMS`],
                ["首购赠送（翻倍）", `${selected.bonus * 2} NMS`],
                ["释放周期", `${selected.releaseDays} 天（${(999 / selected.releaseDays).toFixed(2)}x）`],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="num font-medium">{v}</span>
                </div>
              ))}
              <div className="flex items-center justify-between border-t border-white/10 pt-2">
                <span className="text-muted-foreground">当前可用余额</span>
                <span className="num text-emerald-300">{fmtNum(balance?.available_nms || 0)} NMS</span>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
              <div className="flex items-center gap-2">
                <BadgeCheck className="h-3.5 w-3.5 text-cyan-300" />
                <span className="text-xs">推荐人代激活</span>
              </div>
              <Switch checked={proxy} onCheckedChange={setProxy} />
            </div>
            {proxy && (
              <div className="mt-2">
                <Label>被激活人邮箱</Label>
                <Input
                  type="email"
                  placeholder="friend@nms.ai"
                  value={proxyEmail}
                  onChange={(e) => setProxyEmail(e.target.value)}
                  className="mt-1"
                />
              </div>
            )}

            <DialogFooter>
              <Button variant="ghost" onClick={() => setSelected(null)}>
                取消
              </Button>
              <Button onClick={purchase} disabled={busy}>
                <Wallet className="h-4 w-4" /> {busy ? "处理中…" : "确认支付并激活"}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
