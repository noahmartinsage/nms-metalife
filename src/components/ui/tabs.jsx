import React, { createContext, useContext, useState } from "react";
import { cn } from "@/lib/utils";

const TabsContext = createContext({ value: null, setValue: () => {} });

function Tabs({ value, defaultValue, onValueChange, className, children, ...props }) {
  const [inner, setInner] = useState(defaultValue);
  const current = value !== undefined ? value : inner;
  const setValue = (v) => {
    if (value === undefined) setInner(v);
    onValueChange?.(v);
  };
  return (
    <TabsContext.Provider value={{ value: current, setValue }}>
      <div className={cn("w-full", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

function TabsList({ className, children, ...props }) {
  return (
    <div
      role="tablist"
      className={cn(
        "scroll-x gap-1 rounded-xl border border-white/10 bg-white/[0.04] p-1",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function TabsTrigger({ value, className, children, ...props }) {
  const ctx = useContext(TabsContext);
  const active = ctx.value === value;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={() => ctx.setValue(value)}
      className={cn(
        "shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
        active
          ? "bg-gradient-to-r from-cyan-500/90 to-sky-500/90 text-white shadow-sm shadow-cyan-500/25"
          : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function TabsContent({ value, className, children, ...props }) {
  const ctx = useContext(TabsContext);
  if (ctx.value !== value) return null;
  return (
    <div role="tabpanel" className={cn("mt-4 animate-fade-up", className)} {...props}>
      {children}
    </div>
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
export default Tabs;
