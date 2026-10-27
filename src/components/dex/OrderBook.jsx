import React from "react";
import { ArrowDownUp } from "lucide-react";
import { SectionCard } from "@/components/common/SectionCard";
import { fmtNum } from "@/lib/format";
import { orderBook } from "@/lib/market";

/** 订单簿（CLOB · Hyperliquid L2 风格） */
export default function OrderBook({ mid = 0.42 }) {
  const book = orderBook(mid, 10);
  const maxTotal = Math.max(book.bids.at(-1)?.total || 1, book.asks.at(0)?.total || 1);

  const Row = ({ row, side }) => (
    <div className="relative flex items-center justify-between px-2 py-[3px] text-[10px]">
      <span
        className="absolute inset-y-0 right-0"
        style={{
          width: `${(row.total / maxTotal) * 100}%`,
          background: side === "bid" ? "rgba(52,211,153,0.12)" : "rgba(251,113,133,0.12)",
        }}
      />
      <span className={`num relative ${side === "bid" ? "text-emerald-300" : "text-rose-300"}`}>
        {row.price.toFixed(4)}
      </span>
      <span className="num relative text-muted-foreground">{fmtNum(row.amount, 0)}</span>
      <span className="num relative text-muted-foreground/70">{fmtNum(row.total, 0)}</span>
    </div>
  );

  return (
    <SectionCard title="订单簿" desc="CLOB · 0 Gas" icon={ArrowDownUp}>
      <div className="flex justify-between px-2 pb-1 text-[9px] text-muted-foreground">
        <span>价格(ACS)</span>
        <span>数量(NMS)</span>
        <span>累计</span>
      </div>
      <div>
        {book.asks.map((r, i) => (
          <Row key={`a${i}`} row={r} side="ask" />
        ))}
      </div>
      <div className="my-1 flex items-center justify-between rounded-lg bg-white/5 px-2 py-1">
        <span className="num text-sm font-bold text-cyan-300">{mid.toFixed(4)}</span>
        <span className="text-[9px] text-muted-foreground">价差 {book.spread.toFixed(4)}</span>
      </div>
      <div>
        {book.bids.map((r, i) => (
          <Row key={`b${i}`} row={r} side="bid" />
        ))}
      </div>
    </SectionCard>
  );
}
