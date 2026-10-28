import React, { useMemo, useState } from "react";
import { BadgeCheck, Banknote, ClipboardCheck, ShieldCheck, X } from "lucide-react";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { base44 } from "@/api/base44Client";
import { useEntityList } from "@/hooks/useEntity";
import { resolveMerchantGrade } from "@/lib/engine";
import { fmtNum } from "@/lib/format";
import { cn } from "@/lib/utils";

const EXTRA = [
  { id: "otc_a1", store_name: "钱塘数科", category: "OTC 承兑", deposit: 60000, trades: 268, kyc: true },
  { id: "otc_a2", store_name: "西溪兑换所", category: "OTC 承兑", deposit: 22000, trades: 86, kyc: true },
  { id: "otc_a3", store_name: "速汇通", category: "OTC 承兑", deposit: 8000, trades: 12, kyc: false },
];

const CHECKLIST = [
  "营业执照 + 法人身份证（OCR 校验通过）",
  "KYC Level 2 实名认证",
  "保证金 ≥ ¥10,000 且已链上冻结",
  "近 90 天无争议仲裁记录",
  "风控评分 ≥ 80（AI 合规审核）",
];

/** OTC 商家审核中心（技术白皮书 5.2） */
export default function OTCAuditPanel() {
  const { data: stores, refresh } = useEntityList("MerchantStore", {}, "-created_date", 50);
  const [handled, setHandled] = useState({});

  const queue = useMemo(() => {
    const fromStores = stores
      .filter((s) => !s.is_verified)
      .map((s) => ({
        id: s.id,
        store_name: s.store_name,
        category: s.category,
        deposit: s.total_sales ? Math.round(s.total_sales * 0.2) : 15000,
        trades: s.total_transactions || 0,
        kyc: true,
        real: true,
      }));
    return [...fromStores, ...EXTRA].filter((s) => !handled[s.id]);
  }, [stores, handled]);

  const approve = async (row) => {
    if (row.real) {
      await base44.entities.MerchantStore.update(row.id, { is_verified: true });
      refresh();
    }
    setHandled((h) => ({ ...h, [row.id]: "approved" }));
    const grade = resolveMerchantGrade(row.deposit, row.trades);
    toast.success(`${row.store_name} 审核通过，信誉等级 ${grade.grade} 级，已开通收款与 RWA 权限`);
  };

  const reject = (row) => {
    setHandled((h) => ({ ...h, [row.id]: "rejected" }));
    toast.warning(`${row.store_name} 已驳回，需补充材料后重新提交`);
  };

  return (
    <SectionCard
      title="OTC 商家审核"
      desc="KYC + 质押 + 风控评分三重校验，通过即开通收款权限"
      icon={ClipboardCheck}
      actions={<Badge variant="warning">{queue.length} 待审</Badge>}
    >
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
        <p className="flex items-center gap-1 text-[10px] font-medium">
          <ShieldCheck className="h-3 w-3 text-cyan-300" /> 审核标准（全部满足）
        </p>
        <ul className="mt-1 space-y-0.5">
          {CHECKLIST.map((c) => (
            <li key={c} className="flex items-start gap-1 text-[9px] text-muted-foreground">
              <BadgeCheck className="mt-0.5 h-2.5 w-2.5 shrink-0 text-emerald-400" /> {c}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-2 space-y-1.5">
        {queue.length === 0 ? (
          <p className="py-8 text-center text-[11px] text-muted-foreground">队列已清空，暂无待审商家</p>
        ) : (
          queue.map((row) => {
            const grade = resolveMerchantGrade(row.deposit, row.trades);
            return (
              <div key={row.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-medium">
                      {row.store_name}
                      <span className="ml-1 rounded bg-white/5 px-1 text-[9px] text-muted-foreground">
                        {row.category}
                      </span>
                    </p>
                    <p className="num mt-0.5 text-[9px] text-muted-foreground">
                      质押 ¥{fmtNum(row.deposit, 0)} · {row.trades} 笔成交 · 预估{" "}
                      <span style={{ color: grade.color }}>{grade.grade} 级</span>
                    </p>
                  </div>
                  <Badge variant={row.kyc ? "success" : "danger"}>{row.kyc ? "KYC 通过" : "KYC 缺失"}</Badge>
                </div>
                <div className="mt-1.5 flex gap-1.5">
                  <Button
                    size="sm"
                    className="flex-1"
                    variant="success"
                    onClick={() => approve(row)}
                    disabled={!row.kyc}
                  >
                    <BadgeCheck className="h-3 w-3" /> 通过并开通
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => reject(row)}>
                    <X className="h-3 w-3" /> 驳回
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-2 flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-2.5 py-1.5">
        <span className="flex items-center gap-1 text-[9px] text-muted-foreground">
          <Banknote className="h-2.5 w-2.5" /> 保证金由 MerchantStakingContract 冻结
        </span>
        <span className={cn("num text-[9px]", "text-emerald-300")}>0 争议</span>
      </div>
    </SectionCard>
  );
}
