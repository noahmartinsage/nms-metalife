import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { fmtNum } from "@/lib/format";

/**
 * 多周期 K 线（纯 SVG 绘制，无第三方图表依赖）
 * 遵循中国市场习惯：涨=红，跌=绿
 */
export default function CandlestickChart({ candles = [], height = 240, className }) {
  const [hover, setHover] = useState(null);
  const W = 680;
  const H = height;
  const padL = 46;
  const padR = 8;
  const padT = 10;
  const padB = 22;

  const { min, max, step } = useMemo(() => {
    if (!candles.length) return { min: 0, max: 1, step: 1 };
    const lows = candles.map((c) => c.low);
    const highs = candles.map((c) => c.high);
    const lo = Math.min(...lows);
    const hi = Math.max(...highs);
    const pad = (hi - lo) * 0.08 || 0.01;
    return {
      min: lo - pad,
      max: hi + pad,
      step: (W - padL - padR) / candles.length,
    };
  }, [candles]);

  const y = (v) => padT + ((max - v) / (max - min || 1)) * (H - padT - padB);
  const active = hover !== null ? candles[hover] : candles[candles.length - 1];

  if (!candles.length) return null;

  const gridVals = [0, 0.25, 0.5, 0.75, 1].map((r) => min + (max - min) * r);

  return (
    <div className={cn("relative w-full", className)}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} className="overflow-visible">
        {/* 网格 */}
        {gridVals.map((v) => (
          <g key={v}>
            <line x1={padL} x2={W - padR} y1={y(v)} y2={y(v)} stroke="rgba(148,163,184,0.12)" strokeDasharray="3 4" />
            <text x={padL - 6} y={y(v) + 3} textAnchor="end" fontSize="9" fill="#94a3b8">
              {v.toFixed(3)}
            </text>
          </g>
        ))}

        {candles.map((c, i) => {
          const cx = padL + i * step + step / 2;
          const up = c.close >= c.open;
          const color = up ? "#f43f5e" : "#22c55e";
          const bodyTop = y(Math.max(c.open, c.close));
          const bodyH = Math.max(1.2, Math.abs(y(c.open) - y(c.close)));
          const bw = Math.max(1.6, step * 0.58);
          return (
            <g
              key={i}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              style={{ cursor: "crosshair" }}
            >
              <rect x={padL + i * step} y={padT} width={step} height={H - padT - padB} fill="transparent" />
              <line x1={cx} x2={cx} y1={y(c.high)} y2={y(c.low)} stroke={color} strokeWidth="1" />
              <rect
                x={cx - bw / 2}
                y={bodyTop}
                width={bw}
                height={bodyH}
                fill={up ? color : color}
                opacity={hover === i ? 1 : 0.9}
                rx="0.6"
              />
            </g>
          );
        })}

        {/* 时间轴 */}
        {candles
          .filter((_, i) => i % Math.ceil(candles.length / 6) === 0)
          .map((c, i) => {
            const idx = candles.indexOf(c);
            return (
              <text
                key={`t${i}`}
                x={padL + idx * step + step / 2}
                y={H - 6}
                textAnchor="middle"
                fontSize="9"
                fill="#94a3b8"
              >
                {c.time}
              </text>
            );
          })}
      </svg>

      {active && (
        <div className="pointer-events-none absolute left-12 top-1 rounded-lg border border-white/10 bg-[#0d1526]/95 px-2 py-1 text-[9px] leading-relaxed backdrop-blur">
          <span className="text-muted-foreground">{active.fullTime}</span>
          <div className="flex gap-2">
            <span>
              开 <span className="num text-foreground">{active.open.toFixed(4)}</span>
            </span>
            <span>
              高 <span className="num text-rose-300">{active.high.toFixed(4)}</span>
            </span>
            <span>
              低 <span className="num text-emerald-300">{active.low.toFixed(4)}</span>
            </span>
            <span>
              收 <span className="num text-foreground">{active.close.toFixed(4)}</span>
            </span>
            <span>
              量 <span className="num text-muted-foreground">{fmtNum(active.volume, 0)}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
