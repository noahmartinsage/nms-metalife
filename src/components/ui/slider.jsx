import React from "react";
import { cn } from "@/lib/utils";

function Slider({ value = 0, min = 0, max = 100, step = 1, onValueChange, className, ...props }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onValueChange?.(Number(e.target.value))}
      className={cn(
        "h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 outline-none",
        "[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none",
        "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400",
        "[&::-webkit-slider-thumb]:shadow-[0_0_0_4px_rgba(34,211,238,0.18)]",
        "[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full",
        "[&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-cyan-400",
        className
      )}
      style={{
        background: `linear-gradient(90deg, #22d3ee ${pct}%, rgba(255,255,255,0.1) ${pct}%)`,
      }}
      {...props}
    />
  );
}

export { Slider };
export default Slider;
