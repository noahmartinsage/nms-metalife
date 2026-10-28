import React, { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/** 离线提示：断网时提示本地数据仍可用（P2P 账本与本地缓存） */
export default function OfflineBanner() {
  const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));

  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);

  if (online) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[60] flex items-center justify-center gap-1.5 bg-amber-500/90 px-3 py-1 text-[11px] font-medium text-slate-900 backdrop-blur">
      <WifiOff className="h-3 w-3" />
      当前离线 · 钱包与 P2P 账本使用本地缓存，恢复网络后自动同步
    </div>
  );
}
