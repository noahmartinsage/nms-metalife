import { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

/** 全局会话：用户 + 余额 + 五子账户 */
export function useSession() {
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const u = await base44.auth.me();
      setUser(u);
      if (u?.email) {
        const [bals, accs] = await Promise.all([
          base44.entities.UserBalance.filter({ user_email: u.email }, "-created_date", 1),
          base44.entities.WalletAccount.list("created_date", 20),
        ]);
        setBalance(bals[0] || null);
        setAccounts(accs);
      }
    } catch (e) {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const unsubs = [
      base44.entities.UserBalance.subscribe(() => load()),
      base44.entities.WalletAccount.subscribe(() => load()),
    ];
    return () => unsubs.forEach((u) => u());
  }, [load]);

  /** 更新当前用户余额字段 */
  const patchBalance = useCallback(
    async (patch) => {
      if (!balance?.id) return null;
      return base44.entities.UserBalance.update(balance.id, patch);
    },
    [balance]
  );

  const totalNms =
    (balance?.available_nms || 0) + (balance?.pending_release_nms || 0) + (balance?.locked_nms || 0);

  return { user, balance, accounts, totalNms, loading, refresh: load, patchBalance };
}

export default useSession;
