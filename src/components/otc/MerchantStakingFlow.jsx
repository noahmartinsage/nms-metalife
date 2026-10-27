import React, { useState } from "react";
import { BadgeCheck, Banknote, FileCheck2, ShieldCheck, UserCheck } from "lucide-react";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { resolveMerchantGrade } from "@/lib/engine";
import { fmtNum, sanitizeAmount } from "@/lib/format";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: 1, label: "提交申请", icon: FileCheck2 },
  { key: 2, label: "KYC 实名", icon: UserCheck },
  { key: 3, label: "质押保证金", icon: Banknote },
  { key: 4, label: "审核确认", icon: ShieldCheck },
  { key: 5, label: "开通权限", icon: BadgeCheck },
];

/** 商家质押 5 步流程（规范 7.11） */
export default function MerchantStakingFlow() {
  const [step, setStep] = useState(1);
  const [deposit, setDeposit] = useState("50000");
  const [trades, setTrades] = useState("220");
  const grade = resolveMerchantGrade(Number(deposit) || 0, Number(trades) || 0);

  return (
    <SectionCard title="商家入驻 · 质押流程" desc="提交 → KYC → 质押 → 审核 → 开通" icon={ShieldCheck}>
      <div className="flex items-center gap-1">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const done = step > s.key;
          const active = step === s.key;
          return (
            <React.Fragment key={s.key}>
              <button
                type="button"
                onClick={() => setStep(s.key)}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 rounded-lg py-1.5",
                  active && "bg-cyan-400/10"
                )}
              >
                <Icon
                  className={cn(
                    "h-3.5 w-3.5",
                    done ? "text-emerald-400" : active ? "text-cyan-300" : "text-muted-foreground"
                  )}
                />
                <span className={cn("text-[8px]", active ? "text-cyan-300" : "text-muted-foreground")}>{s.label}</span>
              </button>
              {i < STEPS.length - 1 && <div className="h-px w-2 bg-white/10" />}
            </React.Fragment>
          );
        })}
      </div>

      <Progress value={(step / 5) * 100} className="mt-2 h-1" />

      <div className="mt-2 space-y-2">
        {step === 1 && (
          <div className="space-y-2">
            <Input placeholder="门店名称" className="h-8 text-xs" defaultValue="元味小馆" />
            <Input placeholder="统一社会信用代码" className="h-8 text-xs" />
            <p className="text-[10px] text-muted-foreground">提交后 1 个工作日内完成初审。</p>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-1.5 text-[10px] text-muted-foreground">
            <p>· 法人身份证正反面（OCR 自动识别）</p>
            <p>· 营业执照 + 经营许可证</p>
            <p>· 门店实景照片（含门头）</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => toast.success("已上传（演示）")}>
                上传材料
              </Button>
              <Badge variant="success" className="self-center">
                已通过
              </Badge>
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-2">
            <Input
              type="number"
              min="0"
              step="any"
              value={deposit}
              onChange={(e) => setDeposit(sanitizeAmount(e.target.value))}
              className="h-8 text-xs"
            />
            <Input
              type="number"
              min="0"
              step="any"
              value={trades}
              onChange={(e) => setTrades(sanitizeAmount(e.target.value))}
              className="h-8 text-xs"
            />
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5 text-[10px]">
              <span className="text-muted-foreground">按质押与交易量评估</span>
              <span className="num font-semibold" style={{ color: grade.color }}>
                {grade.label} · {grade.desc}
              </span>
            </div>
          </div>
        )}
        {step === 4 && (
          <div className="space-y-1 text-[10px] text-muted-foreground">
            <p>· 质押 {fmtNum(Number(deposit) || 0)} NMS 已冻结</p>
            <p>· 风控评分 92 / 100</p>
            <p>· 3/5 多签委员会审核中</p>
            <Badge variant="warning">审核中</Badge>
          </div>
        )}
        {step === 5 && (
          <div className="space-y-1 text-[10px] text-muted-foreground">
            <p className="flex items-center gap-1 text-emerald-300">
              <BadgeCheck className="h-3 w-3" /> 商家权限已自动开通
            </p>
            <p>· 可发布 RWA 资产与门店股权 NFT</p>
            <p>· 可参与 C2C 法币 OTC 挂单</p>
            <p>· 享 5-30% 自定义打赏比例</p>
          </div>
        )}
      </div>

      <Button
        className="mt-2 w-full"
        size="sm"
        variant={step === 5 ? "success" : "default"}
        onClick={() => {
          if (step === 5) {
            toast.success("入驻流程已完成");
            return;
          }
          setStep(step + 1);
        }}
      >
        {step === 5 ? "完成" : "下一步"}
      </Button>
    </SectionCard>
  );
}
