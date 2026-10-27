import React from "react";
import { cn } from "@/lib/utils";

function Switch({ checked = false, onCheckedChange, className, disabled, ...props }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-200",
        checked ? "border-cyan-400/40 bg-cyan-500/80" : "border-white/10 bg-white/10",
        disabled && "opacity-50",
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "inline-block h-4.5 w-4.5 translate-x-0.5 rounded-full bg-white shadow transition-transform duration-200",
          checked && "translate-x-[22px]"
        )}
        style={{ height: 18, width: 18 }}
      />
    </button>
  );
}

export { Switch };
export default Switch;
