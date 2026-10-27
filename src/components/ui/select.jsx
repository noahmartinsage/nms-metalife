import React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const Select = React.forwardRef(({ className, children, ...props }, ref) => (
  <div className="relative w-full">
    <select
      ref={ref}
      className={cn(
        "h-10 w-full appearance-none rounded-xl border border-white/10 bg-white/[0.04] px-3 pr-8 text-sm",
        "text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        className
      )}
      {...props}
    >
      {children}
    </select>
    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
  </div>
));
Select.displayName = "Select";

const SelectOption = ({ value, children }) => (
  <option value={value} className="bg-[#0d1526] text-foreground">
    {children}
  </option>
);

export { Select, SelectOption };
export default Select;
