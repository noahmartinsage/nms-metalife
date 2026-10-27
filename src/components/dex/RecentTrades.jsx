import React from "react";
import { Activity } from "lucide-react";
import { SectionCard } from "@/components/common/SectionCard";
import { fmtNum } from "@/lib/format";
import { recentTrades } from "@/lib/market";

/** 实时成交 */
export default function RecentTrades() {
  const trades = recentTrades(14);

  return (
    <SectionCard title="实时成交" desc="最近 14 笔" icon={Activity}>
      <div className="flex justify-between px-1 pb-1 text-[9px] text-muted-foreground">
        <span>价格</span>
        <span>数量</span>
        <span>时间</span>
      </div>
      <div className="space-y-0">
        {trades.map((t) => (
          <div key={t.id} className="flex items-center justify-between px-1 py-[3px] text-[10px]">
            <span className={`num ${t.side === "buy" ? "text-emerald-300" : "text-rose-300"}`}>
              {t.price.toFixed(4)}
            </span>
            <span className="num text-muted-foreground">{fmtNum(t.amount, 0)}</span>
            <span className="num text-muted-foreground/70">{t.time}</span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
