import React, { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { LineChart } from "lucide-react";
import { SectionCard } from "@/components/common/SectionCard";
import { fmtNum } from "@/lib/format";
import { NMS_GUIDE_PRICE, priceSeries } from "@/lib/market";
import { cn } from "@/lib/utils";

const RANGES = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
];

/** NMS 价格走势图（指导价 + RMB 估值） */
export default function NMSPriceChart({ holding = 0 }) {
  const [range, setRange] = useState(30);
  const data = useMemo(() => priceSeries(range), [range]);
  const first = data[0]?.price || NMS_GUIDE_PRICE;
  const last = data[data.length - 1]?.price || NMS_GUIDE_PRICE;
  const change = ((last - first) / first) * 100;
  const up = change >= 0;

  return (
    <SectionCard
      title="NMS 价格走势"
      desc={`指导价 ${NMS_GUIDE_PRICE} ACS · 持仓估值 ¥${fmtNum(holding * NMS_GUIDE_PRICE)}`}
      icon={LineChart}
      actions={
        <div className="flex gap-0.5">
          {RANGES.map((r) => (
            <button
              key={r.label}
              type="button"
              onClick={() => setRange(r.days)}
              className={cn(
                "rounded-md px-1.5 py-0.5 text-[10px] transition-colors",
                range === r.days ? "bg-cyan-400/15 text-cyan-200" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      }
    >
      <div className="flex items-end gap-2">
        <span className="num text-2xl font-bold">{last.toFixed(4)}</span>
        <span className={cn("pb-1 text-[11px] font-medium", up ? "text-emerald-400" : "text-rose-400")}>
          {up ? "+" : ""}
          {change.toFixed(2)}%
        </span>
        <span className="pb-1 text-[10px] text-muted-foreground">ACS / NMS</span>
      </div>

      <div className="mt-2 h-[170px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 6, right: 4, left: -26, bottom: 0 }}>
            <defs>
              <linearGradient id="nmsPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={up ? "#34d399" : "#fb7185"} stopOpacity={0.5} />
                <stop offset="100%" stopColor={up ? "#34d399" : "#fb7185"} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(148,163,184,0.1)" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis
              domain={["dataMin - 0.01", "dataMax + 0.01"]}
              tick={{ fontSize: 9, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              width={46}
              tickFormatter={(v) => Number(v).toFixed(2)}
            />
            <Tooltip
              contentStyle={{
                background: "rgba(13,21,38,0.96)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10,
                fontSize: 11,
              }}
              formatter={(v) => [`${v} ACS`, "价格"]}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={up ? "#34d399" : "#fb7185"}
              strokeWidth={2}
              fill="url(#nmsPrice)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 grid grid-cols-3 gap-1.5 text-center">
        {[
          ["持仓 NMS", fmtNum(holding)],
          ["RMB 估值", `¥${fmtNum(holding * NMS_GUIDE_PRICE)}`],
          ["ACS 估值", fmtNum(holding * NMS_GUIDE_PRICE)],
        ].map(([k, v]) => (
          <div key={k} className="rounded-lg border border-white/10 bg-white/[0.03] py-1.5">
            <p className="num text-[11px] font-semibold">{v}</p>
            <p className="text-[9px] text-muted-foreground">{k}</p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
