import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Fingerprint, KeyRound, Loader2, LogOut, Mail, ShieldCheck, Smartphone } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { base44, API_MODE } from "@/api/base44Client";
import { createPageUrl } from "@/utils";

/** 读取本地令牌 */
const API_BASE = import.meta.env.VITE_API_BASE || "/api";

const getToken = () => {
  try {
    return localStorage.getItem("nms_api_token") || "";
  } catch (e) {
    return "";
  }
};

/**
 * 登录页（OTP 验证码）
 * - 严格模式（NMS_AUTH_STRICT=1）：必须先发码再登录，验证码不回显
 * - 宽松模式（本地开发）：点「发送验证码」后会把演示码显示在提示里，方便自测
 */
export default function Login() {
  const [email, setEmail] = useState("demo@nms.ai");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [devCode, setDevCode] = useState("");
  const [session, setSession] = useState(null);

  const isServer = API_MODE === "server";

  const loadSession = async () => {
    try {
      const me = await base44.auth.me();
      setSession(me || null);
    } catch (e) {
      setSession(null);
    }
  };

  useEffect(() => {
    loadSession();
  }, []);

  const sendCode = async () => {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      toast.error("请输入有效邮箱");
      return;
    }
    setSending(true);
    try {
      const res = await fetch(API_BASE + "/auth/otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "发送失败");
      setSent(true);
      if (data.devCode) {
        setDevCode(data.devCode);
        setCode(data.devCode);
        toast.message(`演示环境验证码：${data.devCode}`);
      } else {
        toast.success("验证码已发送，请查收");
      }
    } catch (e) {
      toast.error(`发送失败：${e.message}`);
    } finally {
      setSending(false);
    }
  };

  const doLogin = async () => {
    if (!code.trim()) {
      toast.error("请输入验证码");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(API_BASE + "/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "登录失败");
      localStorage.setItem("nms_api_token", data.token);
      window.dispatchEvent(new Event("nms:session"));
      toast.success(`登录成功：${data.user?.email}`);
      await loadSession();
    } catch (e) {
      const map = {
        otp_invalid: "验证码错误",
        otp_expired: "验证码已过期，请重新获取",
        otp_not_found: "请先获取验证码",
        otp_too_frequent: "发送过于频繁，请 60 秒后再试",
      };
      toast.error(map[e.message] || `登录失败：${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  const doLogout = async () => {
    try {
      const token = getToken();
      await fetch(API_BASE + "/auth/logout", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      });
    } catch (e) {
      /* 忽略 */
    }
    localStorage.removeItem("nms_api_token");
    window.dispatchEvent(new Event("nms:session"));
    setSession(null);
    setCode("");
    setSent(false);
    setDevCode("");
    toast.success("已退出登录");
  };

  const authed = !!session && session.role !== "guest";

  return (
    <div className="space-y-4">
      <PageHeader
        icon={Fingerprint}
        title="登录 NMS MetaLife"
        subtitle="邮箱 + 一次性验证码 · HMAC 签名令牌 12 小时有效 · 支持角色权限（user / merchant / admin）"
        badge={<Badge variant={authed ? "success" : "warning"}>{authed ? "已登录" : "未登录"}</Badge>}
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <SectionCard title="验证码登录" desc="验证码 5 分钟内有效，用后即焚" icon={KeyRound}>
          {authed ? (
            <div className="space-y-3">
              <div className="glass-soft rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 text-xs font-bold text-slate-900">
                    {(session.full_name || session.email || "N").slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-medium">{session.full_name || session.email}</p>
                    <p className="truncate text-[10px] text-muted-foreground">{session.email}</p>
                  </div>
                  <Badge variant={session.role === "admin" || session.role === "owner" ? "purple" : "default"}>
                    {session.role}
                  </Badge>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-1.5 text-[9px]">
                  <div className="rounded-lg bg-white/[0.03] px-2 py-1.5">
                    <p className="text-muted-foreground">认证方式</p>
                    <p className="num mt-0.5">{session.via === "jwt" ? "签名令牌" : session.via || "—"}</p>
                  </div>
                  <div className="rounded-lg bg-white/[0.03] px-2 py-1.5">
                    <p className="text-muted-foreground">令牌有效期</p>
                    <p className="num mt-0.5">12 小时</p>
                  </div>
                </div>
              </div>

              <Button variant="outline" className="w-full" onClick={doLogout}>
                <LogOut className="h-3.5 w-3.5" /> 退出登录
              </Button>

              <div className="flex items-start gap-1.5 rounded-lg border border-emerald-400/20 bg-emerald-400/[0.06] px-2 py-1.5">
                <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-300" />
                <p className="text-[9px] leading-relaxed text-emerald-200/90">
                  已通过身份校验，可访问支付、分红与实体写入接口。
                  {session.role === "admin" || session.role === "owner" ? " 管理后台已解锁。" : " 管理后台需 admin 角色。"}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <Label>邮箱</Label>
                <div className="mt-1 flex gap-1.5">
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Button variant="outline" onClick={sendCode} disabled={sending} className="shrink-0">
                    {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
                    {sent ? "重发" : "发码"}
                  </Button>
                </div>
              </div>

              <div>
                <Label>验证码</Label>
                <Input
                  className="mt-1 num tracking-[0.3em]"
                  placeholder="6 位数字"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  onKeyDown={(e) => e.key === "Enter" && doLogin()}
                />
                {devCode && (
                  <p className="mt-1 text-[9px] text-amber-300">
                    演示环境验证码：<span className="num">{devCode}</span>（生产环境不会回显）
                  </p>
                )}
              </div>

              <Button className="w-full" onClick={doLogin} disabled={busy || !isServer}>
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                {busy ? "校验中…" : "登录"}
              </Button>

              {!isServer && (
                <p className="rounded-lg border border-amber-400/20 bg-amber-400/[0.06] px-2 py-1.5 text-[9px] leading-relaxed text-amber-200/90">
                  当前为本地 localStorage 模式，无需登录。切换到服务端模式
                  （<span className="num">VITE_API_MODE=server</span>）后本页生效。
                </p>
              )}

              <p className="text-center text-[10px] text-muted-foreground">
                还没有账户？
                <Link to={createPageUrl("Register")} className="ml-1 text-cyan-300 hover:underline">
                  立即注册
                </Link>
              </p>
            </div>
          )}
        </SectionCard>

        <div className="space-y-4">
          <SectionCard title="权限模型（RBAC）" desc="四种角色，最小权限原则" icon={ShieldCheck}>
            <div className="space-y-1.5">
              {[
                { role: "user", desc: "支付 / 消费 / 分红 / 社交 / 实体写入", tag: "默认" },
                { role: "merchant", desc: "收款码签发 / 退款初审 / 门店数据", tag: "商家" },
                { role: "admin", desc: "管理后台 / 对账 / 审计 / 系统参数", tag: "管理员" },
                { role: "owner", desc: "含 admin 全部权限 + 高风险退款审批", tag: "超级管理员" },
              ].map((r) => (
                <div key={r.role} className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-2.5 py-2">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-violet-400/10 text-violet-300">
                    <ShieldCheck className="h-3 w-3" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium">
                      {r.role} <span className="ml-1 text-[9px] font-normal text-muted-foreground">{r.desc}</span>
                    </p>
                  </div>
                  <span className="shrink-0 rounded bg-white/5 px-1.5 py-0.5 text-[9px] text-muted-foreground">{r.tag}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="安全机制" desc="令牌与风控" icon={Smartphone}>
            <div className="space-y-1">
              {[
                "HMAC-SHA256 签名令牌，篡改即失效",
                "验证码 5 分钟过期、用后即焚、60 秒发送限流",
                "登出写入吊销表，令牌立即作废",
                "管理接口强制 admin/owner 角色校验",
              ].map((t) => (
                <div key={t} className="flex items-start gap-1.5 text-[10px] leading-relaxed text-muted-foreground">
                  <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-300" />
                  {t}
                </div>
              ))}
            </div>
            <Link
              to={createPageUrl("Register")}
              className="mt-2 flex items-center justify-center gap-1 rounded-lg border border-white/10 py-1.5 text-[10px] text-cyan-300 hover:border-cyan-400/30"
            >
              去注册 <ArrowRight className="h-3 w-3" />
            </Link>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
