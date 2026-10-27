import React, { useState } from "react";
import { Check, Copy, QrCode } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import ReferralQRCode from "@/components/referral/ReferralQRCode";
import { shortAddr } from "@/lib/format";

/** 收款二维码 */
export default function ReceiveQRCode({ open, onOpenChange, address = "", accountName = "主账户" }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success("收款地址已复制");
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      toast.error("复制失败");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-4 w-4 text-cyan-300" /> 收款
          </DialogTitle>
          <DialogDescription>{accountName} · 支持 NMS / ACS / YSE / GCP 四币种</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3">
          <ReferralQRCode value={address || "NMS"} size={188} />
          <p className="num break-all rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-center text-[11px] text-muted-foreground">
            {shortAddr(address, 18, 12)}
          </p>
          <Button variant="outline" className="w-full" onClick={copy}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} 复制地址
          </Button>
          <p className="text-center text-[10px] leading-relaxed text-muted-foreground">
            对方扫码即可向该地址付款；DID 打赏将自动按打赏比例结算至商家分红池。
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
