import React, { useMemo } from "react";
import { cn } from "@/lib/utils";

/** 纯 CSS 生成的伪二维码（演示用，不含真实纠错编码） */
export default function ReferralQRCode({ value = "NMS", size = 132, className }) {
  const cells = useMemo(() => {
    const N = 21;
    let h = 2166136261;
    for (let i = 0; i < value.length; i += 1) {
      h ^= value.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    const grid = [];
    let state = h >>> 0;
    const next = () => {
      state ^= state << 13;
      state ^= state >>> 17;
      state ^= state << 5;
      state >>>= 0;
      return state / 4294967296;
    };
    for (let y = 0; y < N; y += 1) {
      for (let x = 0; x < N; x += 1) {
        const inFinder =
          (x < 7 && y < 7) || (x > N - 8 && y < 7) || (x < 7 && y > N - 8);
        grid.push({ x, y, on: inFinder ? false : next() > 0.52 });
      }
    }
    return grid;
  }, [value]);

  const N = 21;
  const unit = size / N;

  return (
    <div
      className={cn("relative overflow-hidden rounded-xl bg-white p-2", className)}
      style={{ width: size, height: size }}
      aria-label={`推荐二维码 ${value}`}
    >
      <svg viewBox={`0 0 ${size} ${size}`} width={size - 16} height={size - 16}>
        {cells.map((c) =>
          c.on ? (
            <rect
              key={`${c.x}-${c.y}`}
              x={c.x * unit}
              y={c.y * unit}
              width={unit}
              height={unit}
              fill="#0b1220"
            />
          ) : null
        )}
        {/* 三个定位角 */}
        {[
          [0, 0],
          [size - unit * 7, 0],
          [0, size - unit * 7],
        ].map(([x, y], i) => (
          <g key={i}>
            <rect x={x} y={y} width={unit * 7} height={unit * 7} fill="#0b1220" />
            <rect x={x + unit} y={y + unit} width={unit * 5} height={unit * 5} fill="#fff" />
            <rect x={x + unit * 2} y={y + unit * 2} width={unit * 3} height={unit * 3} fill="#0b1220" />
          </g>
        ))}
      </svg>
      <div className="absolute inset-x-0 bottom-1 text-center text-[8px] font-semibold tracking-widest text-slate-500">
        NMS METALIFE
      </div>
    </div>
  );
}
