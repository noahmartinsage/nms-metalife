import React from "react";
import { Link } from "react-router-dom";
import { CreditCard, QrCode, ScanLine, ShieldCheck, Sparkles, Store, Zap } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { StatCard } from "@/components/common/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import MerchantQRCode from "@/components/payment/MerchantQRCode";
import { useEntityList } from "@/hooks/useEntity";
import { fmtNum } from "@/lib/format";
import { createPageUrl } from "@/utils";

const FEATURES = [
  { t: "扫码即付", d: "DID 身份识别，免输入地址", icon: ScanLine },
  { t: "消费即铸造", d: "1:1 NMS + 实物 NFT 自动铸造", icon: Sparkles },
  { t: "0 Gas", d: "手续费由平台补贴池承担", icon: Zap },
  { t: "多币种", d: "NMS / ACS / 微信 / 支付宝混合", icon: CreditCard },
  { t: "商家聚合码", d: "一码收款，自动分账到分红池", icon: QrCode },
  { t: "量子签名", d: "每笔交易 ML-DSA-65 存证", icon: ShieldCheck },
];

export default function MetaPay() {
  const { data: stores } = useEntityList("MerchantStore", {}, "-total_sales", 10);
  const { data: orders } = useEntityList("PaymentOrder", {}, "-created_date", 50);

  const gmv = orders.reduce((s, o) => s + (o.amount || 0), 0);

  return (
    <div className="space-y-4">
      <PageHeader
        icon={CreditCard}
        title="元Pay"
        subtitle="NMS 生态统一支付品牌 · 扫码付 / 聚合收款 / 链上结算 / 消费即铸造"
        badge={<Badge variant="success">0 Gas</Badge>}
        actions={
          <Link to={createPageUrl("PaymentCenter")}>
            <Button size="sm">
              <ScanLine className="h-3.5 w-3.5" /> 去支付
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard label="累计 GMV" value={fmtNum(gmv)} unit="元" icon={CreditCard} accent="cyan" />
        <StatCard label="接入门店" value={stores.length} unit="家" icon={Store} accent="emerald" />
        <StatCard label="结算延迟" value="1.2" unit="秒" icon={Zap} accent="violet" />
        <StatCard label="返利比例" value="100" unit="%" icon={Sparkles} accent="amber" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <SectionCard title="支付能力" desc="线上线下一体化收单" icon={CreditCard}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.t} className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
                  <Icon className="h-4 w-4 text-cyan-300" />
                  <p className="mt-1 text-[11px] font-medium">{f.t}</p>
                  <p className="mt-0.5 text-[9px] leading-relaxed text-muted-foreground">{f.d}</p>
                </div>
              );
            })}
          </div>
        </SectionCard>

        <MerchantQRCode store={stores[0]} />
      </div>

      <SectionCard title="支付流程" desc="四步完成链上结算" icon={ScanLine}>
        <div className="grid gap-2 sm:grid-cols-4">
          {[
            ["01", "扫码识别", "扫描商家聚合码，自动识别门店与打赏比例"],
            ["02", "输入金额", "支持自定义金额与快捷档位，防负数校验"],
            ["03", "DID 打赏", "按 5-30% 打赏比例拆分至商家分红池"],
            ["04", "链上结算", "1:1 返 NMS + 铸造 NFT + 量子签名存证"],
          ].map(([n, t, d]) => (
            <div key={n} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <span className="num text-xs font-bold text-cyan-300">{n}</span>
              <p className="mt-1 text-[11px] font-medium">{t}</p>
              <p className="mt-0.5 text-[9px] leading-relaxed text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
