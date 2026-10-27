import React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-[80px] w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm",
      "placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

const Label = React.forwardRef(({ className, ...props }, ref) => (
  <label ref={ref} className={cn("text-xs font-medium text-muted-foreground", className)} {...props} />
));
Label.displayName = "Label";

function Table({ className, ...props }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  );
}

const Th = ({ className, ...props }) => (
  <th
    className={cn(
      "whitespace-nowrap border-b border-white/10 px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground",
      className
    )}
    {...props}
  />
);

const Td = ({ className, ...props }) => (
  <td className={cn("whitespace-nowrap border-b border-white/5 px-3 py-2.5 text-sm", className)} {...props} />
);

export { Textarea, Label, Table, Th, Td };
export default Textarea;
