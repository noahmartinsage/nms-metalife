import React from "react";
import { QrCode, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import ReferralQRCode from "@/components/referral/ReferralQRCode";

/** 商家收款码 */
export default function MerchantQRCode({ store }) {
  if (!store) return null;

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <QrCode className="h-3.5 w-3.5" /> 门店聚合收款码
      </div>
      <ReferralQRCode value={store.qr_code || store.id} size={150} />
      <p className="num text-[11px] font-semibold tracking-wider text-cyan-200">{store.qr_code}</p>
      <p className="text-center text-[10px] text-muted-foreground">
        {store.store_name} · 打赏 {store.tip_ratio}% · {store.is_verified ? "已实名认证" : "待认证"}
      </p>
      <Button
        size="sm"
        variant="outline"
        className="w-full"
        onClick={() => toast.success("收款码已保存至本地（演示）")}
      >
        <Download className="h-3.5 w-3.5" /> 保存收款码
      </Button>
    </div>
  );
}
