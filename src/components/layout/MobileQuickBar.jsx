import React, { useEffect, useState } from "react";
import { ScanLine, Wallet, Gift, Headphones, X, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const ACTIONS = [
  { key: "pay", label: "扫码付", icon: ScanLine, page: "PaymentCenter", color: "from-cyan-400 to-sky-500" },
  { key: "wallet", label: "收款", icon: Wallet, page: "Wallet", color: "from-emerald-400 to-teal-500" },
  { key: "invite", label: "邀请", icon: Gift, page: "Invite", color: "from-violet-400 to-fuchsia-500" },
  { key: "support", label: "客服", icon: Headphones, page: "AIAssistant", color: "from-amber-400 to-orange-500" },
];

/** 移动端悬浮快捷操作（App 化体验，桌面隐藏） */
export default function MobileQuickBar() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const t = setTimeout(() => setOpen(false), 6000);
    return () => clearTimeout(t);
  }, [open]);

  return (
    <div className="fixed bottom-[74px] right-3 z-40 flex flex-col items-end gap-2 lg:hidden">
      {open &&
        ACTIONS.map((a, i) => {
          const Icon = a.icon;
          return (
            <button
              key={a.key}
              type="button"
              onClick={() => {
                setOpen(false);
                navigate(createPageUrl(a.page));
              }}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-[#0d1526]/85 py-1.5 pl-3 pr-2 text-[11px] shadow-lg backdrop-blur-xl"
              style={{ animation: `fade-up 0.2s ease-out ${i * 0.04}s both` }}
            >
              <span className="text-muted-foreground">{a.label}</span>
              <span className={cn("grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br text-slate-900", a.color)}>
                <Icon className="h-3.5 w-3.5" />
              </span>
            </button>
          );
        })}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onDoubleClick={() => toast.message("长按可直接扫码")}
        className={cn(
          "grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-cyan-400 via-sky-500 to-violet-500 text-slate-900 shadow-[0_10px_30px_-8px_rgba(34,211,238,0.9)] transition-transform active:scale-95",
          open && "rotate-45"
        )}
        aria-label="快捷操作"
      >
        {open ? <X className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
      </button>
    </div>
  );
}
