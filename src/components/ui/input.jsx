import React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef(({ className, type = "text", ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={cn(
      "flex h-10 w-full rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-foreground backdrop-blur-md",
      "placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:border-cyan-400/40 focus-visible:ring-2 focus-visible:ring-cyan-400/40",
      "disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";

export { Input };
export default Input;
