import React, { useState } from "react";
import {
  BadgeCheck,
  Bot,
  CreditCard,
  Fingerprint,
  Gift,
  Lock,
  MessageCircle,
  Sparkles,
  Star,
  UserCircle2,
  Users,
} from "lucide-react";
import { SectionCard } from "@/components/common/SectionCard";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { shortHash } from "@/lib/format";

const FEATURES = [
  { key: "did", name: "DID 身份", icon: Fingerprint, desc: "链上唯一身份，跨应用互通", tag: "已绑定" },
  { key: "chat", name: "加密聊天", icon: Lock, desc: "Kyber-768 端对端加密", tag: "E2E" },
  { key: "avatar", name: "数字分身", icon: UserCircle2, desc: "AI 数字人代理社交", tag: "Beta" },
  { key: "ai", name: "AI 助手", icon: Bot, desc: "自动回复与话题推荐", tag: "在线" },
  { key: "feed", name: "社区动态", icon: Sparkles, desc: "消费即分享，链上存证", tag: "热门" },
  { key: "credit", name: "社交信用", icon: Star, desc: "双维度信誉等级", tag: "S 级" },
  { key: "card", name: "元名片", icon: CreditCard, desc: "一码展示资产与等级", tag: "可分享" },
  { key: "packet", name: "红包雨", icon: Gift, desc: "商家红包 · 社区分红", tag: "进行中" },
  { key: "elite", name: "精英俱乐部", icon: Users, desc: "M5+ 专属圈层", tag: "邀请制" },
];

/** P2P 社交中心 */
export default function P2PSocialHub({ referralCode = "NMSDEMO" }) {
  const [open, setOpen] = useState(null);

  return (
    <>
      <SectionCard
        title="P2P 社交中心"
        desc="Hyperswarm 端对端 · DID 身份 · 无中心服务器"
        icon={MessageCircle}
        actions={<Badge variant="success">P2P 在线</Badge>}
      >
        <div className="grid grid-cols-3 gap-2">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setOpen(f)}
                className="flex flex-col items-center gap-1 rounded-xl border border-white/5 bg-white/[0.02] p-2.5 text-center transition-all hover:-translate-y-0.5 hover:border-cyan-400/25"
              >
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/10 text-cyan-300">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-[10px] font-medium">{f.name}</span>
                <span className="rounded bg-white/5 px-1 text-[8px] text-muted-foreground">{f.tag}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-2.5">
          <p className="text-[10px] text-muted-foreground">我的元名片</p>
          <div className="mt-1 flex items-center justify-between">
            <div>
              <p className="num text-sm font-semibold text-cyan-200">{referralCode}</p>
              <p className="num text-[9px] text-muted-foreground">DID {shortHash(`did:nms:${referralCode}`)}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => toast.success("元名片链接已复制")}
            >
              <CreditCard className="h-3.5 w-3.5" /> 分享名片
            </Button>
          </div>
        </div>
      </SectionCard>

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        {open && (
          <DialogContent onClose={() => setOpen(null)} className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {React.createElement(open.icon, { className: "h-4 w-4 text-cyan-300" })} {open.name}
              </DialogTitle>
              <DialogDescription>{open.desc}</DialogDescription>
            </DialogHeader>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-[11px] text-muted-foreground">
              {open.key === "did" && (
                <ul className="space-y-1">
                  <li>· DID: did:nms:330106:0x8f2a…d71c</li>
                  <li>· 公钥: kyber768:9f3a…c28e</li>
                  <li className="flex items-center gap-1 text-emerald-300">
                    <BadgeCheck className="h-3 w-3" /> 实名认证已通过（KYC Level 2）
                  </li>
                </ul>
              )}
              {open.key === "chat" && (
                <ul className="space-y-1">
                  <li>· 加密算法：Kyber-768 KEM + AES-256-GCM</li>
                  <li>· 消息仅存于对等节点 Hypercore 账本</li>
                  <li>· 服务端无明文，无法被平台读取</li>
                </ul>
              )}
              {open.key === "credit" && (
                <ul className="space-y-1">
                  <li>· 商家信誉：A 级（质押 ¥50,000，交易 268 笔）</li>
                  <li>· 用户信誉：VIP2 白金用户</li>
                  <li>· 社交信用分：886 / 1000</li>
                </ul>
              )}
              {!["did", "chat", "credit"].includes(open.key) && (
                <p>{open.name} 已就绪。该能力在演示环境中提供入口与状态展示，生产环境由 P2P 网络与 AI 服务提供。</p>
              )}
            </div>
            <div className="mt-3">
              <Input placeholder="搜索 DID / 昵称 / 推荐码" className="h-9 text-xs" />
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
