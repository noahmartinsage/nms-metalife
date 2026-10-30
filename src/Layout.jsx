import React, { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  Home,
  BarChart3,
  Search,
  Wallet,
  CreditCard,
  MapPin,
  Users,
  Image as ImageIcon,
  TrendingUp,
  MessageCircle,
  Bot,
  LayoutGrid,
  FileText,
  Shield,
  Atom,
  Cpu,
  Menu,
  X,
  Bell,
  RotateCcw,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { createPageUrl } from "@/utils";
import { fmtNum, shortAddr } from "@/lib/format";
import { useSession } from "@/hooks/useSession";
import { base44 } from "@/api/base44Client";
import { toast } from "@/components/ui/toast";
import { Avatar } from "@/components/ui/separator";
import BottomNav from "./components/layout/BottomNav";
import MobileQuickBar from "./components/layout/MobileQuickBar";
import OfflineBanner from "./components/layout/OfflineBanner";

/** 桌面端 15 个导航项（规范 6.2） */
export const navItems = [
  { name: "首页", icon: Home, page: "Home" },
  { name: "量子公链", icon: Cpu, page: "QuantumChain" },
  { name: "AI量化", icon: BarChart3, page: "QuantDashboard" },
  { name: "浏览器", icon: Search, page: "Explorer" },
  { name: "钱包", icon: Wallet, page: "Wallet" },
  { name: "支付", icon: CreditCard, page: "PaymentCenter" },
  { name: "附近", icon: MapPin, page: "NearbyMerchants" },
  { name: "动态", icon: Users, page: "UserActivity" },
  { name: "NFT市场", icon: ImageIcon, page: "NFTMarket" },
  { name: "DeFi", icon: TrendingUp, page: "DeFi" },
  { name: "社交", icon: MessageCircle, page: "Social" },
  { name: "AI管家", icon: Bot, page: "AIAssistant" },
  { name: "元Life", icon: LayoutGrid, page: "MetaLife" },
  { name: "文档", icon: FileText, page: "Documentation" },
  { name: "管理", icon: Shield, page: "AdminPanel" },
  { name: "监控", icon: Atom, page: "Monitor" },
];

export default function Layout({ children }) {
  const { user, balance } = useSession();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const current = navItems.find((n) => createPageUrl(n.page) === location.pathname);

  const handleReset = () => {
    base44.resetDemoData();
    toast.success("演示数据已重置");
    setTimeout(() => window.location.reload(), 400);
  };

  return (
    <div className="relative min-h-screen">
      <OfflineBanner />
      {/* 极光背景层 */}
      <div className="aurora" aria-hidden="true">
        <span className="left-[-12%] top-[-14%] h-[380px] w-[380px] bg-cyan-500/30" />
        <span className="right-[-10%] top-[4%] h-[420px] w-[420px] bg-violet-500/25" style={{ animationDelay: "-7s" }} />
        <span className="bottom-[-16%] left-[26%] h-[460px] w-[460px] bg-emerald-500/20" style={{ animationDelay: "-13s" }} />
        <span className="bottom-[4%] right-[16%] h-[320px] w-[320px] bg-fuchsia-500/20" style={{ animationDelay: "-18s" }} />
      </div>

      {/* 桌面端侧栏 */}
      <aside className="glass-panel fixed inset-y-0 left-0 z-40 hidden w-[236px] flex-col border-r lg:flex">
        <Link to="/" className="flex items-center gap-2.5 px-5 py-5">
          <div className="glow-cyan grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 via-sky-400 to-emerald-400 text-sm font-black text-slate-900">
            N
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-tight">NMS MetaLife</p>
            <p className="text-[10px] text-muted-foreground">元生活公链 · V13.0</p>
          </div>
        </Link>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2.5 pb-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.page}
                to={createPageUrl(item.page)}
                end={item.page === "Home"}
                className={({ isActive }) =>
                  cn(
                    "group relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] transition-all",
                    isActive
                      ? "bg-gradient-to-r from-cyan-400/20 via-cyan-400/[0.06] to-transparent text-cyan-100 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.16)]"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={cn("h-4 w-4", isActive && "text-cyan-300")} />
                    <span className="flex-1">{item.name}</span>
                    {isActive && (
                      <>
                        <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.95)]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)]" />
                      </>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3">
          <div className="glass-soft rounded-xl p-3">
            <div className="flex items-center gap-2">
              <Avatar name={user?.full_name} size={32} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">{user?.full_name || "未登录"}</p>
                <p className="truncate text-[10px] text-muted-foreground">{shortAddr(user?.email, 10, 8)}</p>
              </div>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-[10px] text-muted-foreground">可用 NMS</span>
              <span className="num text-xs font-semibold text-emerald-300">
                {fmtNum(balance?.available_nms || 0)}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3" /> 重置演示数据
          </button>
        </div>
      </aside>

      {/* 移动端顶栏 */}
      <header className="glass-panel sticky top-0 z-40 border-b lg:hidden">
        <div className="flex items-center gap-2 px-4 py-3">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-muted-foreground"
            aria-label="打开菜单"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="glow-cyan grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-cyan-400 via-sky-400 to-emerald-400 text-[11px] font-black text-slate-900">
              N
            </div>
            <span className="text-sm font-semibold">{current?.name || "NMS MetaLife"}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="num rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-2 py-1 text-[11px] text-emerald-300">
              {fmtNum(balance?.available_nms || 0)} NMS
            </span>
            <Link to={createPageUrl("Profile")} aria-label="个人中心">
              <Avatar name={user?.full_name} size={28} />
            </Link>
          </div>
        </div>
      </header>

      {/* 移动端抽屉 */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-[90] lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              className="glass-panel relative h-full w-[260px] overflow-y-auto border-r p-3"
            >
              <div className="mb-3 flex items-center justify-between px-2">
                <span className="text-sm font-semibold">全部功能</span>
                <button type="button" onClick={() => setMobileOpen(false)} aria-label="关闭">
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.page}
                      to={createPageUrl(item.page)}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.03] px-2.5 py-2 text-xs text-muted-foreground"
                    >
                      <Icon className="h-3.5 w-3.5 text-cyan-300" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
              <p className="mt-4 px-2 text-[10px] text-muted-foreground">更多入口</p>
              <div className="mt-1 space-y-1">
                {[
                  ["登录", "Login"],
                  ["注册 / 开通", "Register"],
                  ["邀请好友", "Invite"],
                  ["量子公链", "QuantumChain"],
                  ["发现", "Discover"],
                  ["OTC 法币", "OTC"],
                  ["预测市场", "PredictionMarket"],
                  ["元Pay", "MetaPay"],
                  ["落地页", "Landing"],
                  ["白皮书", "Whitepaper"],
                  ["云存储", "CloudStorage"],
                  ["生命科学", "LifeScience"],
                  ["短视频", "ShortVideo"],
                  ["定期存款", "FixedDeposit"],
                  ["链上Agent", "OnChainAgent"],
                  ["数字版权", "DigitalRights"],
                  ["奇点", "Singularity"],
                  ["社区动态", "Champions"],
                ].map(([name, page]) => (
                  <Link
                    key={page}
                    to={createPageUrl(page)}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[11px] text-muted-foreground hover:bg-white/5"
                  >
                    {name}
                    <ChevronRight className="h-3 w-3" />
                  </Link>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 主内容 */}
      <main className="relative z-10 lg:pl-[236px]">
        <div className="mx-auto w-full max-w-[1320px] px-3 pb-24 pt-4 sm:px-5 lg:pb-10 lg:pt-6">{children}</div>
      </main>

      <MobileQuickBar />
      <BottomNav />
    </div>
  );
}

export { Bell };
