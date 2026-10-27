import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Crown, Gift, Mail, ShieldCheck, Smartphone, UserPlus, Wallet } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { Badge } from "@/components/ui/badge";
import RegisterFlow from "@/components/auth/RegisterFlow";
import { createPageUrl } from "@/utils";

export default function Register() {
  return (
    <div className="space-y-4">
      <PageHeader
        icon={UserPlus}
        title="注册 NMS MetaLife"
        subtitle="手机号 / 邮箱 / 钱包三种方式 · 4 步完成 · 注册即得 NMS 与专属推荐码"
        badge={<Badge variant="success">量子加密</Badge>}
      />

      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <RegisterFlow />

        <div className="space-y-4">
          <SectionCard title="三种注册方式" desc="适配国内用户 / 国际用户 / Web3 原生用户" icon={Smartphone}>
            <div className="space-y-1.5">
              {[
                { icon: Smartphone, name: "手机号", desc: "+86 手机号 + 短信验证码", tag: "国内主流" },
                { icon: Mail, name: "邮箱", desc: "邮箱 + 验证码，支持国际域名", tag: "国际用户" },
                { icon: Wallet, name: "钱包地址", desc: "MetaMask / WalletConnect / Coinbase", tag: "免验证码" },
              ].map((m) => {
                const Icon = m.icon;
                return (
                  <div key={m.name} className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-2.5 py-2">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-400/10 text-cyan-300">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-medium">{m.name}</p>
                      <p className="truncate text-[9px] text-muted-foreground">{m.desc}</p>
                    </div>
                    <span className="shrink-0 rounded bg-white/5 px-1.5 py-0.5 text-[9px] text-muted-foreground">
                      {m.tag}
                    </span>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard title="注册即享" desc="新人权益" icon={Gift}>
            <ul className="space-y-1 text-[10px] text-muted-foreground">
              <li className="flex items-center gap-1.5">
                <Gift className="h-3 w-3 text-amber-300" /> 注册即得 20 NMS（普通用户）/ 礼包翻倍赠送（VIP·商家）
              </li>
              <li className="flex items-center gap-1.5">
                <Crown className="h-3 w-3 text-violet-300" /> 开通礼包立即晋升，释放周期从 999 天起缩短
              </li>
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="h-3 w-3 text-emerald-300" /> 专属推荐码与二维码，推荐关系永久上链归因
              </li>
            </ul>
            <div className="mt-2 rounded-xl border border-white/10 bg-black/20 p-2.5 text-[9px] leading-relaxed text-muted-foreground">
              注册后可在「个人中心」查看等级与团队，在「钱包」查看 9×9×9 释放进度。
            </div>
          </SectionCard>

          <div className="rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 to-violet-500/5 p-4">
            <p className="text-sm font-semibold">已有账户？</p>
            <p className="mt-1 text-[10px] text-muted-foreground">演示环境默认使用 demo@nms.ai，可直接体验全部功能。</p>
            <Link
              to={createPageUrl("Home")}
              className="mt-2 inline-flex items-center gap-1 text-[11px] text-cyan-300"
            >
              直接进入应用 <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
