import React, { useState } from "react";
import { BadgeCheck, FileCode2, GitBranch, ShieldCheck, Users } from "lucide-react";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const CONTRACTS = [
  { name: "RWAMintContract", ver: "v2.4.1", trigger: "商家上架 → 5 步流程", score: 94, roles: "商家 / 多签 / 平台" },
  { name: "RoyaltyDistributor", ver: "v1.8.0", trigger: "NFT 二次转售", score: 96, roles: "推荐人 / 商家 / 节点 / 平台" },
  { name: "CircuitBreaker", ver: "v3.1.2", trigger: "风险评分超阈值", score: 91, roles: "Minara-AI / 管理员" },
  { name: "GovernanceContract", ver: "v2.0.3", trigger: "提案投票通过", score: 93, roles: "GCP 持有者 / 多签" },
  { name: "LayerZeroBridge", ver: "v1.6.4", trigger: "资产跨链调度", score: 88, roles: "多签 / 桥接节点" },
  { name: "ReleaseAccelerator", ver: "v4.2.0", trigger: "消费 / 推荐 / 合成触发", score: 95, roles: "系统 / 用户" },
  { name: "MerchantStakingContract", ver: "v1.3.7", trigger: "保证金锁定 / 退还", score: 92, roles: "商家 / 多签" },
];

/** L3 量子合约管理 */
export default function QuantumContractManager() {
  const [active, setActive] = useState(CONTRACTS[0].name);
  const [signs, setSigns] = useState(0);
  const [busy, setBusy] = useState(false);

  const current = CONTRACTS.find((c) => c.name === active);

  const sign = () => {
    if (signs >= 5) return;
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      const next = signs + 1;
      setSigns(next);
      if (next >= 3) toast.success(`升级提案已通过（${next}/5 多签）`);
      else toast.message(`已签名 ${next}/5，还需 ${3 - next} 个签名`);
    }, 420);
  };

  return (
    <SectionCard
      title="L3 量子合约"
      desc="7 个核心协议合约 · 版本 / 权限 / 升级治理"
      icon={FileCode2}
      actions={<Badge variant="success">0 高危</Badge>}
    >
      <div className="space-y-1">
        {CONTRACTS.map((c) => (
          <button
            key={c.name}
            type="button"
            onClick={() => {
              setActive(c.name);
              setSigns(0);
            }}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-left transition-colors",
              active === c.name ? "border-cyan-400/40 bg-cyan-400/[0.07]" : "border-white/5 bg-white/[0.02]"
            )}
          >
            <span className="num min-w-0 flex-1 truncate text-[10px]">{c.name}</span>
            <span className="num shrink-0 text-[9px] text-muted-foreground">{c.ver}</span>
            <span
              className={cn(
                "num shrink-0 text-[9px]",
                c.score >= 92 ? "text-emerald-300" : c.score >= 88 ? "text-amber-300" : "text-rose-300"
              )}
            >
              {c.score}
            </span>
          </button>
        ))}
      </div>

      {current && (
        <div className="mt-2 rounded-xl border border-white/10 bg-black/20 p-2.5">
          <p className="flex items-center gap-1.5 text-[11px] font-medium">
            <GitBranch className="h-3 w-3 text-cyan-300" /> {current.name}
            <span className="num text-[9px] text-muted-foreground">{current.ver}</span>
          </p>
          <div className="mt-1 space-y-0.5 text-[9px]">
            <div className="flex justify-between">
              <span className="text-muted-foreground">触发条件</span>
              <span>{current.trigger}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">权限角色</span>
              <span className="flex items-center gap-1">
                <Users className="h-2.5 w-2.5" /> {current.roles}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">审计评分</span>
              <span className="num text-emerald-300">{current.score} / 100</span>
            </div>
          </div>

          <div className="mt-2">
            <div className="flex items-center justify-between text-[9px]">
              <span className="flex items-center gap-1 text-muted-foreground">
                <ShieldCheck className="h-2.5 w-2.5" /> 升级提案多签（3/5）
              </span>
              <span className="num">{signs}/5</span>
            </div>
            <Progress value={(signs / 5) * 100} className="mt-1 h-1" />
            <div className="mt-1.5 flex gap-1.5">
              <Button size="sm" variant="outline" className="flex-1" onClick={sign} disabled={busy || signs >= 5}>
                <BadgeCheck className="h-3 w-3" /> {busy ? "签名中…" : signs >= 5 ? "已全员签名" : "模拟签名"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSigns(0);
                  toast.message("提案已重置");
                }}
              >
                重置
              </Button>
            </div>
          </div>
        </div>
      )}
    </SectionCard>
  );
}
