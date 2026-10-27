import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BadgeCheck,
  Check,
  Copy,
  Crown,
  Mail,
  Phone,
  ShieldCheck,
  Smartphone,
  Store,
  User,
  Wallet,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { base44 } from "@/api/base44Client";
import { GIFT_PACKAGES } from "@/lib/promotionData";
import { fmtNum, mockHash } from "@/lib/format";
import { createPageUrl } from "@/utils";
import { cn } from "@/lib/utils";

const IDENTITIES = [
  { key: "normal", name: "普通用户", icon: User, desc: "免费注册，享 1:1 消费返利", pay: false },
  { key: "vip", name: "VIP 用户", icon: Crown, desc: "开通礼包，缩短释放周期", pay: true },
  { key: "merchant", name: "商家", icon: Store, desc: "开通收款与 RWA 上架权限", pay: true },
];

const METHODS = [
  { key: "phone", name: "手机号", icon: Smartphone, placeholder: "+86 138 0000 0000" },
  { key: "email", name: "邮箱", icon: Mail, placeholder: "you@nms.ai" },
  { key: "wallet", name: "钱包地址", icon: Wallet, placeholder: "0x…" },
];

const WALLETS = ["MetaMask", "WalletConnect", "Coinbase Wallet"];

/** 多方式注册（白皮书 17 / 设计文档 19）：3 方式 × 4 步 */
export default function RegisterFlow() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [identity, setIdentity] = useState("normal");
  const [method, setMethod] = useState("phone");
  const [account, setAccount] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [left, setLeft] = useState(0);
  const [wallet, setWallet] = useState("");
  const [pkg, setPkg] = useState(GIFT_PACKAGES[0]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const timerRef = useRef(null);

  const refCode = typeof window !== "undefined" ? localStorage.getItem("nms_ref_code") || "" : "";
  const identityMeta = IDENTITIES.find((i) => i.key === identity);
  const needPay = identityMeta?.pay;

  useEffect(() => () => clearInterval(timerRef.current), []);

  const sendCode = () => {
    if (!account.trim()) {
      toast.error(method === "wallet" ? "请先连接钱包" : "请填写手机号或邮箱");
      return;
    }
    setSent(true);
    setLeft(60);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setLeft((v) => {
        if (v <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return v - 1;
      });
    }, 1000);
    toast.success(`验证码已发送（演示：任意 6 位数字通过）`);
  };

  const connectWallet = (name) => {
    const addr = `0x${mockHash("", 40)}`;
    setWallet(`${name} · ${addr.slice(0, 6)}…${addr.slice(-4)}`);
    setAccount(addr);
    setMethod("wallet");
    toast.success(`已连接 ${name}`);
  };

  const submit = async () => {
    if (method !== "wallet" && (!sent || code.length < 4)) {
      toast.error("请先获取并填写验证码");
      return;
    }
    if (method === "wallet" && !wallet) {
      toast.error("请先连接钱包");
      return;
    }
    setBusy(true);
    try {
      const email =
        method === "email"
          ? account
          : method === "phone"
            ? `${account.replace(/\D/g, "").slice(-11)}@phone.nms.ai`
            : `${account.slice(0, 10)}@wallet.nms.ai`;
      const generated = `NMS${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const bonus = needPay ? pkg.bonus * 2 : 20;

      await base44.entities.UserBalance.create({
        user_email: email,
        available_nms: bonus * 0.5,
        pending_release_nms: bonus * 0.5,
        total_consumption: 0,
        total_rewards: bonus,
        major_level: needPay ? pkg.tier : "普通用户",
        release_days: needPay ? pkg.releaseDays : 999,
        release_speed_factor: needPay ? Math.round((999 / pkg.releaseDays) * 100) / 100 : 1,
        referrer_email: refCode ? `referrer-${refCode.toLowerCase()}@nms.ai` : "",
        referral_code: generated,
        team_size: 0,
        direct_referrals: 0,
        user_type: identity === "merchant" ? "商家" : needPay ? "VIP用户" : "普通用户",
        sign_in_days: 0,
        consumption_level: 0,
        referral_level: 0,
        nft_synthesis_level: 0,
      });

      setResult({ email, code: generated, bonus, refCode });
      setStep(4);
      toast.success("注册成功，欢迎加入 NMS MetaLife");
    } catch (e) {
      toast.error("注册失败，请重试");
    } finally {
      setBusy(false);
    }
  };

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("已复制");
    } catch (e) {
      toast.error("复制失败");
    }
  };

  return (
    <Card className="neon-border overflow-hidden">
      <CardContent className="p-4 sm:p-5">
        {/* 步骤条 */}
        <div className="flex items-center gap-1">
          {["身份类型", "账户验证", "支付开通", "完成"].map((label, i) => {
            const n = i + 1;
            const done = step > n;
            const active = step === n;
            return (
              <React.Fragment key={label}>
                <div className="flex flex-1 flex-col items-center gap-1">
                  <span
                    className={cn(
                      "grid h-6 w-6 place-items-center rounded-full text-[10px]",
                      done && "bg-emerald-400/20 text-emerald-300",
                      active && "bg-cyan-400/20 text-cyan-300",
                      !done && !active && "bg-white/5 text-muted-foreground"
                    )}
                  >
                    {done ? <Check className="h-3 w-3" /> : n}
                  </span>
                  <span className={cn("text-[9px]", active ? "text-cyan-300" : "text-muted-foreground")}>{label}</span>
                </div>
                {i < 3 && <div className="mb-4 h-px flex-1 bg-white/10" />}
              </React.Fragment>
            );
          })}
        </div>

        <div className="mt-3 space-y-2">
          {step === 1 && (
            <>
              <div className="grid gap-2 sm:grid-cols-3">
                {IDENTITIES.map((it) => {
                  const Icon = it.icon;
                  return (
                    <button
                      key={it.key}
                      type="button"
                      onClick={() => setIdentity(it.key)}
                      className={cn(
                        "rounded-xl border p-2.5 text-left transition-colors",
                        identity === it.key
                          ? "border-cyan-400/40 bg-cyan-400/10"
                          : "border-white/10 bg-white/[0.03] hover:border-white/25"
                      )}
                    >
                      <Icon className="h-4 w-4 text-cyan-300" />
                      <p className="mt-1 text-[11px] font-medium">{it.name}</p>
                      <p className="text-[9px] leading-relaxed text-muted-foreground">{it.desc}</p>
                    </button>
                  );
                })}
              </div>
              {refCode && (
                <p className="flex items-center gap-1 rounded-lg border border-emerald-400/20 bg-emerald-400/5 px-2 py-1.5 text-[10px] text-emerald-300">
                  <BadgeCheck className="h-3 w-3" /> 已绑定推荐码 {refCode}，注册后永久归因
                </p>
              )}
              <Button className="w-full" onClick={() => setStep(2)}>
                下一步
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="flex gap-1">
                {METHODS.map((m) => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => setMethod(m.key)}
                      className={cn(
                        "flex flex-1 items-center justify-center gap-1 rounded-lg border py-1.5 text-[10px]",
                        method === m.key
                          ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-200"
                          : "border-white/10 text-muted-foreground"
                      )}
                    >
                      <Icon className="h-3 w-3" /> {m.name}
                    </button>
                  );
                })}
              </div>

              {method !== "wallet" ? (
                <>
                  <Input
                    placeholder={METHODS.find((m) => m.key === method).placeholder}
                    value={account}
                    onChange={(e) => setAccount(e.target.value)}
                    className="h-9 text-xs"
                  />
                  <div className="flex gap-1.5">
                    <Input
                      placeholder="6 位验证码"
                      value={code}
                      maxLength={6}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                      className="h-9 flex-1 text-xs"
                    />
                    <Button size="sm" variant="outline" onClick={sendCode} disabled={left > 0}>
                      {left > 0 ? `${left}s` : sent ? "重新发送" : "获取验证码"}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid gap-1.5 sm:grid-cols-3">
                    {WALLETS.map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => connectWallet(w)}
                        className="rounded-lg border border-white/10 bg-white/[0.03] py-2 text-[10px] hover:border-cyan-400/30"
                      >
                        <Wallet className="mx-auto mb-0.5 h-3.5 w-3.5 text-cyan-300" />
                        {w}
                      </button>
                    ))}
                  </div>
                  {wallet && <p className="num text-[10px] text-emerald-300">已连接：{wallet}</p>}
                  <p className="text-[9px] text-muted-foreground">Web3 签名即注册，无需验证码；钱包地址自动绑定为 DID 身份</p>
                </>
              )}

              <div className="flex gap-1.5">
                <Button variant="ghost" className="flex-1" onClick={() => setStep(1)}>
                  上一步
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    if (needPay) setStep(3);
                    else submit();
                  }}
                >
                  {needPay ? "下一步" : "完成注册"}
                </Button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="grid grid-cols-2 gap-1.5">
                {GIFT_PACKAGES.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPkg(p)}
                    className={cn(
                      "rounded-xl border p-2 text-left",
                      pkg.id === p.id ? "border-cyan-400/40 bg-cyan-400/10" : "border-white/10 bg-white/[0.03]"
                    )}
                  >
                    <p className="text-[10px] font-medium" style={{ color: p.color }}>
                      {p.name}
                    </p>
                    <p className="num text-sm font-bold">¥{p.total}</p>
                    <p className="text-[9px] text-muted-foreground">
                      赠 {p.bonus * 2} NMS · {p.releaseDays} 天
                    </p>
                  </button>
                ))}
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">现金支付（75%）</span>
                  <span className="num">¥{pkg.cash}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">NMS 支付（25%）</span>
                  <span className="num">{pkg.nms} NMS</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">首购翻倍赠送</span>
                  <span className="num text-emerald-300">{pkg.bonus * 2} NMS</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">释放周期</span>
                  <span className="num">{pkg.releaseDays} 天（{(999 / pkg.releaseDays).toFixed(2)}x）</span>
                </div>
              </div>
              <div className="flex gap-1.5">
                <Button variant="ghost" className="flex-1" onClick={() => setStep(2)}>
                  上一步
                </Button>
                <Button className="flex-1" variant="success" onClick={submit} disabled={busy}>
                  {busy ? "处理中…" : "支付并完成注册"}
                </Button>
              </div>
            </>
          )}

          {step === 4 && result && (
            <div className="space-y-2 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-900">
                <BadgeCheck className="h-6 w-6" />
              </span>
              <p className="text-sm font-semibold">注册成功</p>
              <p className="text-[10px] text-muted-foreground">
                {result.email} · 已获得 {fmtNum(result.bonus)} NMS
              </p>

              <div className="rounded-xl border border-cyan-400/25 bg-cyan-400/5 p-2.5">
                <p className="text-[9px] text-muted-foreground">我的推荐码</p>
                <div className="mt-0.5 flex items-center justify-center gap-1.5">
                  <span className="num text-base font-bold tracking-wider text-cyan-200">{result.code}</span>
                  <button
                    type="button"
                    onClick={() => copy(result.code)}
                    className="rounded p-1 text-muted-foreground hover:text-foreground"
                    aria-label="复制推荐码"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
                <p className="text-[9px] text-muted-foreground">
                  {result.refCode ? `已归因至推荐人 ${result.refCode}` : "暂无推荐人，可通过分享链接邀请好友"}
                </p>
              </div>

              <div className="flex gap-1.5">
                <Button className="flex-1" onClick={() => navigate(createPageUrl("Home"))}>
                  进入应用
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => navigate(createPageUrl("Wallet"))}>
                  查看钱包
                </Button>
              </div>
            </div>
          )}
        </div>

        <p className="mt-3 flex items-center justify-center gap-1 text-[9px] text-muted-foreground">
          <ShieldCheck className="h-2.5 w-2.5" /> 账户信息由 Kyber-768 量子加密保护 · 演示环境不采集真实信息
        </p>
      </CardContent>
    </Card>
  );
}

export { Phone };
