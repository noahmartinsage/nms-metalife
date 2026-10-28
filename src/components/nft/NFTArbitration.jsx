import React, { useState } from "react";
import { AlertTriangle, Gavel, Scale, Users } from "lucide-react";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/toast";
import { fmtNum } from "@/lib/format";
import { cn } from "@/lib/utils";

const CASES = [
  {
    id: "c1",
    nft: "西湖龙井·明前特级 250g",
    buyer: "lin.xiaoyu@nms.ai",
    seller: "元味小馆",
    amount: 680,
    reason: "买家主张收到的茶叶等级与链上描述不符，附 3 张对比图与质检报告。",
    evidence: 3,
    votes: { buyer: 1, seller: 0, mediate: 0 },
    status: "arbitrating",
  },
  {
    id: "c2",
    nft: "PLAY 电竞馆 · 包厢季卡",
    buyer: "zhao.mengqi@nms.ai",
    seller: "PLAY 电竞馆",
    amount: 1980,
    reason: "卖家称权益已交付，买家主张门店停业无法核销。",
    evidence: 2,
    votes: { buyer: 0, seller: 0, mediate: 0 },
    status: "arbitrating",
  },
  {
    id: "c3",
    nft: "星野咖啡 · 年度会员卡",
    buyer: "wang.zhiyuan@nms.ai",
    seller: "星野咖啡",
    amount: 1280,
    reason: "二次转售版税未按 10% 结算，商家申请仲裁。",
    evidence: 1,
    votes: { buyer: 2, seller: 1, mediate: 0 },
    status: "resolved",
    result: "支持买家，退款 80%（1,024 NMS）",
  },
];

/** NFT 争议仲裁（3/5 仲裁委员会） */
export default function NFTArbitration() {
  const [cases, setCases] = useState(CASES);
  const [activeId, setActiveId] = useState("c1");

  const active = cases.find((c) => c.id === activeId) || cases[0];
  const totalVotes = active ? active.votes.buyer + active.votes.seller + active.votes.mediate : 0;

  const cast = (side) => {
    if (active.status === "resolved") {
      toast.error("该案件已裁决");
      return;
    }
    setCases((list) =>
      list.map((c) => {
        if (c.id !== active.id) return c;
        const votes = { ...c.votes, [side]: c.votes[side] + 1 };
        const sum = votes.buyer + votes.seller + votes.mediate;
        const resolved = sum >= 3;
        return {
          ...c,
          votes,
          status: resolved ? "resolved" : "arbitrating",
          result: resolved
            ? votes.buyer >= 2
              ? "支持买家，全额退款并冻结商家保证金"
              : votes.seller >= 2
                ? "支持卖家，驳回买家诉求"
                : "双方协商，退款 50%"
            : c.result,
        };
      })
    );
    const next = totalVotes + 1;
    toast.success(next >= 3 ? "已达 3/5 多数，裁决生效" : `仲裁员已投票 ${next}/5`);
  };

  return (
    <SectionCard
      title="NFT 争议仲裁"
      desc="3/5 仲裁委员会投票裁决 · 保证金先行赔付"
      icon={Scale}
      actions={<Badge variant="warning">{cases.filter((c) => c.status !== "resolved").length} 待裁决</Badge>}
    >
      <div className="space-y-1">
        {cases.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setActiveId(c.id)}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left transition-colors",
              activeId === c.id ? "border-cyan-400/40 bg-cyan-400/[0.07]" : "border-white/5 bg-white/[0.02]"
            )}
          >
            <AlertTriangle
              className={cn("h-3 w-3 shrink-0", c.status === "resolved" ? "text-muted-foreground" : "text-amber-300")}
            />
            <span className="min-w-0 flex-1 truncate text-[10px]">{c.nft}</span>
            <span className="num shrink-0 text-[9px] text-muted-foreground">{fmtNum(c.amount)} NMS</span>
            <Badge variant={c.status === "resolved" ? "success" : "warning"}>
              {c.status === "resolved" ? "已裁决" : "仲裁中"}
            </Badge>
          </button>
        ))}
      </div>

      {active && (
        <div className="mt-2 rounded-xl border border-white/10 bg-black/20 p-2.5">
          <p className="text-[11px] font-medium">{active.nft}</p>
          <p className="num mt-0.5 text-[9px] text-muted-foreground">
            买家 {active.buyer} · 卖家 {active.seller} · 争议金额 {fmtNum(active.amount)} NMS · 证据 {active.evidence} 份
          </p>
          <p className="mt-1 text-[9px] leading-relaxed text-muted-foreground">{active.reason}</p>

          <div className="mt-2 space-y-0.5">
            {[
              ["支持买家", active.votes.buyer, "bg-rose-400", "text-rose-300"],
              ["支持卖家", active.votes.seller, "bg-emerald-400", "text-emerald-300"],
              ["协商退款", active.votes.mediate, "bg-amber-400", "text-amber-300"],
            ].map(([label, v, bar, color]) => (
              <div key={label} className="flex items-center gap-2">
                <span className="w-12 shrink-0 text-[9px] text-muted-foreground">{label}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div className={bar} style={{ width: `${(v / 5) * 100}%` }} />
                </div>
                <span className={cn("num w-6 shrink-0 text-right text-[9px]", color)}>{v}</span>
              </div>
            ))}
          </div>

          <div className="mt-1.5 flex items-center justify-between text-[9px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-2.5 w-2.5" /> 仲裁员投票 {totalVotes}/5
            </span>
            <span>{active.status === "resolved" ? "已达多数" : "需 3 票"}</span>
          </div>
          <Progress value={(totalVotes / 5) * 100} className="mt-1 h-1" />

          {active.status === "resolved" ? (
            <p className="mt-2 flex items-start gap-1 rounded-lg bg-emerald-400/10 px-2 py-1.5 text-[9px] leading-relaxed text-emerald-300">
              <Gavel className="mt-0.5 h-2.5 w-2.5 shrink-0" /> 裁决结果：{active.result}
            </p>
          ) : (
            <div className="mt-2 grid grid-cols-3 gap-1">
              <Button size="sm" variant="outline" onClick={() => cast("buyer")}>
                支持买家
              </Button>
              <Button size="sm" variant="outline" onClick={() => cast("seller")}>
                支持卖家
              </Button>
              <Button size="sm" variant="ghost" onClick={() => cast("mediate")}>
                协商
              </Button>
            </div>
          )}
        </div>
      )}
    </SectionCard>
  );
}
