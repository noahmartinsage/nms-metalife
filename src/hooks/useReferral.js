import { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

/**
 * 统一推荐 Hook（规范 4.4）
 * 全站推荐码 / 推荐链接唯一来源
 */
export function useReferral() {
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const u = await base44.auth.me();
      setUser(u);
      if (u?.email) {
        const rows = await base44.entities.UserBalance.filter({ user_email: u.email }, "-created_date", 1);
        if (rows.length > 0) setBalance(rows[0]);
      }
    } catch (e) {
      /* 未登录 */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const unsub = base44.entities.UserBalance.subscribe(() => load());
    return unsub;
  }, [load]);

  const referralCode = user?.email
    ? "NMS" +
      user.email
        .split("@")[0]
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 6)
    : "NMSDEMO01";

  const referralLink =
    typeof window !== "undefined" ? `${window.location.origin}?ref=${referralCode}` : `?ref=${referralCode}`;

  return { user, balance, referralCode, referralLink, loading, refresh: load };
}

export default useReferral;
