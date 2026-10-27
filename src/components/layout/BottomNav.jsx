import React from "react";
import { NavLink } from "react-router-dom";
import { Home, Wallet, MapPin, BarChart3, User, CreditCard, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { createPageUrl } from "@/utils";

export const MOBILE_NAV = [
  { name: "首页", icon: Home, page: "Home" },
  { name: "钱包", icon: Wallet, page: "Wallet" },
  { name: "量化", icon: BarChart3, page: "QuantDashboard" },
  { name: "支付", icon: CreditCard, page: "PaymentCenter" },
  { name: "商城", icon: ImageIcon, page: "NFTMarket" },
  { name: "附近", icon: MapPin, page: "NearbyMerchants" },
  { name: "我的", icon: User, page: "Profile" },
];

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#0a1120]/92 backdrop-blur-2xl lg:hidden">
      <div className="safe-bottom mx-auto flex max-w-xl items-stretch justify-between px-1">
        {MOBILE_NAV.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.page}
              to={createPageUrl(item.page)}
              end={item.page === "Home"}
              className={({ isActive }) =>
                cn(
                  "no-tap-highlight flex flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-2 text-[10px] transition-colors",
                  isActive ? "text-cyan-300" : "text-muted-foreground"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      "grid h-7 w-9 place-items-center rounded-lg transition-colors",
                      isActive && "bg-cyan-400/12"
                    )}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <span>{item.name}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
