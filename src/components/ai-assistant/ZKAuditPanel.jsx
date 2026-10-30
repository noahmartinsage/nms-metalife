import React, { useState } from "react";
import { BadgeCheck, Cpu, FileCheck2, Fingerprint, ShieldCheck } from "lucide-react";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { mockHash } from "@/lib/format";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: 1, label: "资产确权", icon: Fingerprint, desc: "RWA 上链 + 所有权 ZK 证明" },
  { key: 2, label: "AI 合规评分", icon: Cpu, desc: "Minara-AI 0-100 分合规评估" },
  { key: 3, label: "多签公证", icon: ShieldCheck, desc: "3/5 多签委员会签名" },
  { key: 4, label: "ZK 证明生成", icon: FileCheck2, desc: "ML-DSA-65 签名 + ZK 证明" },
  { key: 5, label: "链上存证", icon: BadgeCheck, desc: "DOI + 不可篡改记录" },
];

/** ZK 智能审计面板（规范 8.15） */
export default function ZKAuditPanel() {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);

  const run = () => {
    if (step >= 5) {
      setStep(0);
      return;
    }
    setBusy(true);
    setTimeout(() => {
      setStep((s) => s + 1);
      setBusy(false);
      if (step + 1 === 5) toast.success("ZK 审计完成，已生成可分享 VC 凭证");
    }, 700);
  };

  return (
    <SectionCard
      title="ZK 智能审计"
      desc="RWA 资产多签审计 5 步 · 可分享 VC 凭证"
      icon={ShieldCheck}
      actions={<Badge variant={step >= 5 ? "success" : "outline"}>{step}/5</Badge>}
    >
      <Progress value={(step / 5) * 100} className="h-1" />
      <div className="mt-2 space-y-1">
        {STEPS.map((s) => {
          const Icon = s.icon;
          const done = step >= s.key;
          return (
            <div
              key={s.key}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-2.5 py-1.5",
                done ? "border-emerald-400/25 bg-emerald-400/[0.06]" : "border-white/5 bg-white/[0.02]"
              )}
            >
              <Icon className={cn("h-3.5 w-3.5", done ? "text-emerald-400" : "text-muted-foreground")} />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-medium">{s.label}</p>
                <p className="truncate text-[9px] text-muted-foreground">{s.desc}</p>
              </div>
              <span className="shrink-0 text-[9px] text-muted-foreground">{done ? "完成" : "待执行"}</span>
            </div>
          );
        })}
      </div>

      {step >= 5 && (
        <div className="mt-2 rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-2.5">
          <p className="text-[10px] text-muted-foreground">VC 凭证哈希</p>
          <p className="num break-all text-[9px] text-cyan-300">{mockHash("0x", 48)}</p>
        </div>
      )}

      <Button className="mt-2 w-full" size="sm" variant={step >= 5 ? "success" : "default"} onClick={run} disabled={busy}>
        {busy ? "生成中…" : step >= 5 ? "重新审计" : `执行第 ${step + 1} 步`}
      </Button>
    </SectionCard>
  );
}
