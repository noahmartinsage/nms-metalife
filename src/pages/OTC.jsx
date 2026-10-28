import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Banknote,
  CalendarPlus,
  Clock,
  CreditCard,
  Landmark,
  MessageSquare,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import MerchantStakingFlow from "@/components/otc/MerchantStakingFlow";
import OTCAuditPanel from "@/components/otc/OTCAuditPanel";
import { resolveMerchantGrade } from "@/lib/engine";
import { fmtNum, sanitizeAmount } from "@/lib/format";
import { cn } from "@/lib/utils";

const CURRENCIES = [
  { code: "CNY", symbol: "¥", rate: 7.18 },
  { code: "USD", symbol: "$", rate: 1 },
  { code: "EUR", symbol: "€", rate: 0.92 },
  { code: "JPY", symbol: "¥", rate: 148.2 },
  { code: "KRW", symbol: "₩", rate: 1340 },
  { code: "HKD", symbol: "HK$", rate: 7.81 },
  { code: "SGD", symbol: "S$", rate: 1.34 },
  { code: "GBP", symbol: "£", rate: 0.78 },
];

const PAYMENTS = ["支付宝", "微信支付", "银行转账", "现金存款"];

const MERCHANTS = [
  ["星辰OTC", 50000, 320, ["支付宝", "银行转账"]],
  ["元通数科", 120000, 860, ["微信支付", "支付宝"]],
  ["江南兑换", 30000, 120, ["银行转账", "现金存款"]],
  ["链上资本", 80000, 420, ["支付宝", "微信支付", "银行转账"]],
  ["青柠金服", 15000, 46, ["微信支付"]],
];

function downloadICS(amount, currency, deadline) {
  const dt = new Date(deadline);
  const fmt = (d) =>
    `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}T${String(
      d.getUTCHours()
    ).padStart(2, "0")}${String(d.getUTCMinutes()).padStart(2, "0")}00Z`;
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//NMS MetaLife//OTC//CN",
    "BEGIN:VEVENT",
    `UID:otc-${Date.now()}@nms.ai`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(dt)}`,
    `DTEND:${fmt(new Date(dt.getTime() + 15 * 60000))}`,
    `SUMMARY:NMS OTC 交易截止提醒 ${amount} ${currency}`,
    "DESCRIPTION:请在截止前完成付款并点击「我已付款」确认。",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `nms-otc-${Date.now()}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function OTC() {
  const [currency, setCurrency] = useState("CNY");
  const [payment, setPayment] = useState("全部");
  const [active, setActive] = useState(null);
  const [amount, setAmount] = useState("1000");
  const [stage, setStage] = useState(1);
  const [left, setLeft] = useState(900);
  const [chat, setChat] = useState([{ who: "商家", msg: "你好，付款后请点击「我已付款」，我会尽快放行。" }]);
  const [msg, setMsg] = useState("");

  const cur = CURRENCIES.find((c) => c.code === currency);

  const ads = useMemo(
    () =>
      MERCHANTS.map(([name, deposit, trades, methods], i) => {
        const grade = resolveMerchantGrade(deposit, trades);
        const price = (cur.rate * (1 + (i % 3) * 0.004 - 0.001)).toFixed(4);
        return {
          id: `ad_${i}`,
          name,
          grade,
          price,
          min: 500 * (i + 1),
          max: 200000,
          methods,
          deposit,
          trades,
        };
      }).filter((a) => payment === "全部" || a.methods.includes(payment)),
    [cur, payment]
  );

  useEffect(() => {
    if (!active || stage !== 3) return undefined;
    const t = setInterval(() => setLeft((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(t);
  }, [active, stage]);

  const open = (ad) => {
    setActive(ad);
    setStage(1);
    setLeft(900);
    setAmount(String(ad.min));
  };

  const next = () => {
    if (stage === 1) {
      setStage(2);
      toast.success("Escrow 已锁定卖家代币");
    } else if (stage === 2) {
      setStage(3);
      toast.message("请向商家线下付款，完成后点击「我已付款」");
    } else if (stage === 3) {
      setStage(4);
      toast.success("已通知卖家放行");
    } else if (stage === 4) {
      setStage(5);
      toast.success("交易完成，已生成量子签名存证");
    }
  };

  const mmss = `${String(Math.floor(left / 60)).padStart(2, "0")}:${String(left % 60).padStart(2, "0")}`;

  return (
    <div className="space-y-4">
      <PageHeader
        icon={Banknote}
        title="C2C 法币 OTC"
        subtitle="8 币种 · 4 支付方式 · 平台 Escrow 担保 · 15 分钟倒计时 · DAO 争议仲裁"
        badge={<Badge variant="success">担保交易</Badge>}
      />

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-3">
          <div className="scroll-x gap-1">
            {CURRENCIES.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => setCurrency(c.code)}
                className={cn(
                  "shrink-0 rounded-lg border px-2.5 py-1.5 text-[11px] transition-colors",
                  currency === c.code
                    ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-200"
                    : "border-white/10 text-muted-foreground"
                )}
              >
                {c.code}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-1">
            {["全部", ...PAYMENTS].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPayment(p)}
                className={cn(
                  "rounded-md px-2 py-1 text-[10px] transition-colors",
                  payment === p ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {p}
              </button>
            ))}
          </div>

          <SectionCard title="商家广告" desc={`${ads.length} 条挂单 · ${cur.code}`} icon={CreditCard}>
            <div className="space-y-1.5">
              {ads.map((ad) => (
                <div key={ad.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-medium">{ad.name}</span>
                      <span
                        className="rounded px-1 text-[9px] font-semibold"
                        style={{ background: `${ad.grade.color}22`, color: ad.grade.color }}
                      >
                        {ad.grade.grade}级
                      </span>
                      <BadgeCheck className="h-3 w-3 text-emerald-400" />
                    </div>
                    <span className="num text-sm font-semibold text-cyan-300">
                      {cur.symbol}
                      {ad.price}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center justify-between gap-1 text-[9px] text-muted-foreground">
                    <span>
                      限额 {cur.symbol}
                      {fmtNum(ad.min, 0)} - {cur.symbol}
                      {fmtNum(ad.max, 0)}
                    </span>
                    <span>{ad.methods.join(" / ")}</span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-[9px] text-muted-foreground">
                      质押 ¥{fmtNum(ad.deposit, 0)} · {ad.trades} 笔成交
                    </span>
                    <Button size="sm" onClick={() => open(ad)}>
                      购买
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        <div className="space-y-4">
          <MerchantStakingFlow />
          <OTCAuditPanel />
          <SectionCard title="安全保障" icon={ShieldCheck}>
            <ul className="space-y-1 text-[10px] leading-relaxed text-muted-foreground">
              <li>· 平台 Escrow 托管卖家代币，买家确认后才放行</li>
              <li>· 15 分钟付款倒计时，超时自动取消并退回代币</li>
              <li>· 争议提交 DAO 仲裁，3/5 多签裁决</li>
              <li>· 每笔交易生成量子签名存证，不可篡改</li>
            </ul>
          </SectionCard>
        </div>
      </div>

      <Dialog open={!!active} onOpenChange={(v) => !v && setActive(null)}>
        {active && (
          <DialogContent onClose={() => setActive(null)}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-300" /> 担保交易 · {active.name}
              </DialogTitle>
              <DialogDescription>
                单价 {cur.symbol}
                {active.price} · 限额 {cur.symbol}
                {fmtNum(active.min, 0)} 起
              </DialogDescription>
            </DialogHeader>

            <div className="flex items-center gap-1">
              {["确认订单", "锁定 Escrow", "买家付款", "卖家放行", "交易完成"].map((label, i) => (
                <React.Fragment key={label}>
                  <div className="flex flex-1 flex-col items-center gap-0.5">
                    <span
                      className={cn(
                        "grid h-5 w-5 place-items-center rounded-full text-[9px]",
                        stage > i + 1
                          ? "bg-emerald-400/20 text-emerald-300"
                          : stage === i + 1
                            ? "bg-cyan-400/20 text-cyan-300"
                            : "bg-white/5 text-muted-foreground"
                      )}
                    >
                      {i + 1}
                    </span>
                    <span className="text-[8px] text-muted-foreground">{label}</span>
                  </div>
                  {i < 4 && <div className="mb-3 h-px flex-1 bg-white/10" />}
                </React.Fragment>
              ))}
            </div>

            {stage === 3 && (
              <div className="mt-2 flex items-center justify-between rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2">
                <span className="flex items-center gap-1 text-[11px] text-amber-200">
                  <Clock className="h-3.5 w-3.5" /> 付款倒计时
                </span>
                <span className="num text-sm font-bold text-amber-200">{mmss}</span>
              </div>
            )}

            <div className="mt-2 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[10px] text-muted-foreground">购买数量（NMS）</p>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(sanitizeAmount(e.target.value))}
                    className="mt-1 h-9 text-xs"
                  />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">应付金额</p>
                  <p className="num mt-2 text-sm font-semibold text-cyan-300">
                    {cur.symbol}
                    {fmtNum((Number(amount) || 0) * Number(active.price))}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">支付方式</span>
                  <span>{active.methods.join(" / ")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">商家信誉</span>
                  <span style={{ color: active.grade.color }}>
                    {active.grade.label} · {active.grade.desc}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Escrow 状态</span>
                  <span className={stage >= 2 ? "text-emerald-300" : "text-muted-foreground"}>
                    {stage >= 2 ? "已锁定" : "待锁定"}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/20 p-2.5">
                <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <MessageSquare className="h-3 w-3" /> C2C 实时聊天
                </p>
                <div className="mt-1 max-h-24 space-y-1 overflow-y-auto">
                  {chat.map((c, i) => (
                    <p key={i} className="text-[10px] text-muted-foreground">
                      <span className="text-cyan-300">{c.who}：</span>
                      {c.msg}
                    </p>
                  ))}
                </div>
                <div className="mt-1 flex gap-1">
                  <Input
                    value={msg}
                    onChange={(e) => setMsg(e.target.value)}
                    placeholder="发送消息…"
                    className="h-7 text-[10px]"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && msg.trim()) {
                        setChat((c) => [...c, { who: "我", msg: msg.trim() }]);
                        setMsg("");
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      if (!msg.trim()) return;
                      setChat((c) => [...c, { who: "我", msg: msg.trim() }]);
                      setMsg("");
                    }}
                  >
                    发送
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  downloadICS(amount, cur.code, Date.now() + 15 * 60000);
                  toast.success("已下载 ICS 日历提醒");
                }}
              >
                <CalendarPlus className="h-4 w-4" /> 同步日历
              </Button>
              {stage < 5 ? (
                <Button onClick={next}>
                  {stage === 1 && (
                    <>
                      <Wallet className="h-4 w-4" /> 确认并锁定 Escrow
                    </>
                  )}
                  {stage === 2 && (
                    <>
                      <Landmark className="h-4 w-4" /> 我已了解，开始付款
                    </>
                  )}
                  {stage === 3 && (
                    <>
                      <CreditCard className="h-4 w-4" /> 我已付款
                    </>
                  )}
                  {stage === 4 && (
                    <>
                      <BadgeCheck className="h-4 w-4" /> 卖家确认放行
                    </>
                  )}
                </Button>
              ) : (
                <Button variant="success" onClick={() => setActive(null)}>
                  完成
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      <div className="flex items-start gap-2 rounded-xl border border-amber-400/20 bg-amber-400/5 p-3">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
        <p className="text-[10px] leading-relaxed text-muted-foreground">
          风险提示：数字资产交易存在价格波动与合规风险。请仅与完成 KYC 与质押的认证商家交易，并保留付款凭证。争议可在 24 小时内提交 DAO 仲裁。
        </p>
      </div>
    </div>
  );
}
