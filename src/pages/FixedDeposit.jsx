import React, { useState } from "react";
import { CalendarClock, Landmark, PiggyBank, Wallet } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { SectionCard, DataRow } from "@/components/common/SectionCard";
import { StatCard } from "@/components/common/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/textarea";
import { Select, SelectOption } from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { base44 } from "@/api/base44Client";
import { useSession } from "@/hooks/useSession";
import { fmtNum, sanitizeAmount } from "@/lib/format";
import { cn } from "@/lib/utils";

const PRODUCTS = [
  { term: 30, rate: 12, name: "灵活 30 天" },
  { term: 90, rate: 16, name: "稳健 90 天" },
  { term: 180, rate: 21, name: "进阶 180 天" },
  { term: 365, rate: 25, name: "尊享 365 天" },
];

export default function FixedDeposit() {
  const { balance, refresh } = useSession();
  const [term, setTerm] = useState(90);
  const [amount, setAmount] = useState("5000");
  const [busy, setBusy] = useState(false);
  const [deposits, setDeposits] = useState([]);

  const product = PRODUCTS.find((p) => p.term === term);
  const amt = Number(amount) || 0;
  const interest = (amt * product.rate * term) / 365 / 100;

  const open = async () => {
    if (amt <= 0) {
      toast.error("请输入存款金额");
      return;
    }
    if (amt > (balance?.available_nms || 0)) {
      toast.error("可用 NMS 不足");
      return;
    }
    setBusy(true);
    try {
      await base44.entities.UserBalance.update(balance.id, {
        available_nms: (balance.available_nms || 0) - amt,
        locked_nms: (balance.locked_nms || 0) + amt,
      });
      setDeposits((d) => [
        {
          id: `fd_${Date.now()}`,
          term,
          amount: amt,
          interest,
          maturity: new Date(Date.now() + term * 86400000).toLocaleDateString("zh-CN"),
        },
        ...d,
      ]);
      toast.success(`开立成功，到期可得 ${fmtNum(interest)} NMS 利息`);
      refresh();
    } catch (e) {
      toast.error("开立失败");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        icon={PiggyBank}
        title="定期存款"
        subtitle="30 / 90 / 180 / 365 天 · 年化 12-25% · 到期自动赎回"
        badge={<Badge variant="success">0 Gas</Badge>}
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard label="可用 NMS" value={fmtNum(balance?.available_nms || 0)} icon={Wallet} accent="cyan" />
        <StatCard label="锁仓中" value={fmtNum(balance?.locked_nms || 0)} icon={Landmark} accent="amber" />
        <StatCard label="最高年化" value="25" unit="%" icon={PiggyBank} accent="emerald" />
        <StatCard label="我的存单" value={deposits.length} unit="笔" icon={CalendarClock} accent="violet" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <SectionCard title="选择期限" desc="锁仓期越长，年化越高" icon={PiggyBank}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {PRODUCTS.map((p) => (
              <button
                key={p.term}
                type="button"
                onClick={() => setTerm(p.term)}
                className={cn(
                  "rounded-xl border p-2.5 text-left transition-colors",
                  term === p.term
                    ? "border-cyan-400/40 bg-cyan-400/10"
                    : "border-white/10 bg-white/[0.03] hover:border-white/25"
                )}
              >
                <p className="text-[10px] text-muted-foreground">{p.name}</p>
                <p className="num mt-0.5 text-lg font-bold text-emerald-300">{p.rate}%</p>
                <p className="text-[9px] text-muted-foreground">{p.term} 天</p>
              </button>
            ))}
          </div>

          <div className="mt-3 space-y-2">
            <div>
              <Label>存款金额（NMS）</Label>
              <Input
                className="mt-1"
                type="number"
                min="0"
                step="any"
                value={amount}
                onChange={(e) => setAmount(sanitizeAmount(e.target.value))}
              />
              <div className="mt-1 flex gap-1">
                {[25, 50, 75, 100].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setAmount(String((((balance?.available_nms || 0) * p) / 100).toFixed(2)))}
                    className="flex-1 rounded-md border border-white/10 py-0.5 text-[9px] text-muted-foreground hover:text-foreground"
                  >
                    {p}%
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
              <DataRow label="预计利息" value={`${fmtNum(interest)} NMS`} valueClass="text-emerald-300" />
              <DataRow label="到期本息" value={`${fmtNum(amt + interest)} NMS`} />
              <DataRow label="到期日" value={new Date(Date.now() + term * 86400000).toLocaleDateString("zh-CN")} />
            </div>

            <Button className="w-full" variant="success" onClick={open} disabled={busy}>
              <PiggyBank className="h-4 w-4" /> {busy ? "开立中…" : "确认开立存单"}
            </Button>
          </div>
        </SectionCard>

        <SectionCard title="我的存单" desc={`${deposits.length} 笔`} icon={CalendarClock}>
          {deposits.length === 0 ? (
            <p className="py-8 text-center text-[11px] text-muted-foreground">暂无存单，开立后可在此查看</p>
          ) : (
            <div className="space-y-1.5">
              {deposits.map((d) => (
                <div key={d.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium">{d.term} 天存单</span>
                    <Badge variant="success">持有中</Badge>
                  </div>
                  <p className="num mt-1 text-sm font-semibold">{fmtNum(d.amount)} NMS</p>
                  <p className="text-[9px] text-muted-foreground">
                    利息 {fmtNum(d.interest)} NMS · 到期 {d.maturity}
                  </p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
