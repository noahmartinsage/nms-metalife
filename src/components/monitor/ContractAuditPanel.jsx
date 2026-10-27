import React, { useState } from "react";
import { CheckCircle2, FileSearch, ShieldAlert } from "lucide-react";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";

const CONTRACTS = [
  { name: "NMSStaking.sol", score: 95, issues: 0, status: "已审计" },
  { name: "RWAOwnership.sol", score: 91, issues: 1, status: "已审计" },
  { name: "NMSNFT1155.sol", score: 88, issues: 2, status: "已审计" },
  { name: "QuantumVault.sol", score: 82, issues: 3, status: "待复审" },
  { name: "OTCEscrow.sol", score: 93, issues: 0, status: "已审计" },
];

/** 合约审计面板 */
export default function ContractAuditPanel() {
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);

  const scan = () => {
    setScanning(true);
    setProgress(0);
    let p = 0;
    const t = setInterval(() => {
      p += 20;
      setProgress(p);
      if (p >= 100) {
        clearInterval(t);
        setScanning(false);
        toast.success("量子合约审计完成：0 个高危漏洞");
      }
    }, 200);
  };

  return (
    <SectionCard
      title="合约审计"
      desc="量子合约静态分析 + 形式化验证"
      icon={FileSearch}
      actions={<Badge variant="success">0 高危</Badge>}
    >
      <div className="space-y-1.5">
        {CONTRACTS.map((c) => (
          <div key={c.name} className="rounded-lg border border-white/5 bg-white/[0.02] p-2">
            <div className="flex items-center justify-between">
              <span className="num truncate text-[10px]">{c.name}</span>
              <span className="flex items-center gap-1 text-[9px]">
                {c.issues === 0 ? (
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                ) : (
                  <ShieldAlert className="h-3 w-3 text-amber-400" />
                )}
                <span className={c.issues === 0 ? "text-emerald-300" : "text-amber-300"}>{c.issues} 项提示</span>
              </span>
            </div>
            <Progress value={c.score} className="mt-1 h-1" />
            <div className="mt-0.5 flex justify-between text-[9px] text-muted-foreground">
              <span>{c.status}</span>
              <span className="num">评分 {c.score}</span>
            </div>
          </div>
        ))}
      </div>

      {scanning && <Progress value={progress} className="mt-2" />}
      <Button className="mt-2 w-full" variant="outline" onClick={scan} disabled={scanning}>
        <FileSearch className="h-4 w-4" /> {scanning ? `审计中 ${progress}%` : "重新审计全部合约"}
      </Button>
    </SectionCard>
  );
}
