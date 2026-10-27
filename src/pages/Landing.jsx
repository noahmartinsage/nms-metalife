import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Boxes,
  Bot,
  Coins,
  Gavel,
  ShieldCheck,
  Sparkles,
  Store,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RELEASE_TABLE } from "@/lib/engine";
import { PROMOTION_TIERS, TOKENS } from "@/lib/promotionData";
import { createPageUrl } from "@/utils";

const FEATURES = [
  { t: "消费即铸造", d: "每 1 元消费获得 1 NMS，并自动铸造 RWA 实物 NFT，享永久版税", icon: Store },
  { t: "9×9×9 释放", d: "三维度加速，999 天压缩至 31 天，最高 32.2x", icon: Zap },
  { t: "AI 量化风控", d: "Minara-AI 实时监控，波动超阈值自动熔断", icon: Bot },
  { t: "RWA 确权", d: "法律公证 + AI 合规 + 3/5 多签 + DOI 存证", icon: Boxes },
  { t: "P2P 加密社交", d: "Kyber-768 端对端加密，DID 身份跨应用互通", icon: Users },
  { t: "DAO 治理", d: "省市区街道四级 DAO，治理资金反哺生态", icon: Gavel },
];

const ROADMAP = [
  { phase: "V7-V9", title: "基础生态", desc: "AI 量化、NFT 合成、RWA 五步确权、C2C OTC", done: true },
  { phase: "V10-V11", title: "架构升级", desc: "商家质押、Web4.0 Agentic 钱包、9×9×9 可视化", done: true },
  { phase: "V12-V13", title: "一致性治理", desc: "白皮书 V13、ZK 审计、AI 释放顾问、32 项 AI 能力", done: true },
  { phase: "V14", title: "生态扩张", desc: "跨链全资产、元世界数字孪生、全球 DAO 网络", done: false },
];

export default function Landing() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Hero */}
      <section className="relative grid-bg overflow-hidden">
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-cyan-500/20 blur-[120px]" />
        <div className="pointer-events-none absolute -right-20 top-20 h-96 w-96 rounded-full bg-violet-500/20 blur-[120px]" />

        <nav className="relative mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-cyan-400 to-emerald-400 text-sm font-black text-slate-900">
              N
            </div>
            <span className="text-sm font-semibold">NMS MetaLife</span>
          </div>
          <div className="hidden items-center gap-5 text-xs text-muted-foreground sm:flex">
            <a href="#features" className="hover:text-foreground">核心能力</a>
            <a href="#token" className="hover:text-foreground">代币经济</a>
            <a href="#roadmap" className="hover:text-foreground">路线图</a>
            <Link to={createPageUrl("Whitepaper")} className="hover:text-foreground">白皮书</Link>
          </div>
          <div className="flex items-center gap-2">
            <Link to={createPageUrl("Register")} className="hidden text-xs text-muted-foreground hover:text-foreground sm:block">
              注册
            </Link>
            <Link to={createPageUrl("Home")}>
              <Button size="sm">
                进入应用 <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </nav>

        <div className="relative mx-auto max-w-6xl px-5 pb-20 pt-14 text-center">
          <Badge variant="success" className="mx-auto">
            <Sparkles className="h-2.5 w-2.5" /> V13.0 · 提示词复现版
          </Badge>
          <h1 className="mx-auto mt-5 max-w-3xl text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
            消费即分红，
            <span className="gradient-text">共同富裕</span>
            的 Web3 生活生态
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            RWA 实物资产代币化 · AI 量化与自动风控熔断 · P2P 端对端社交 · DAO 治理 ·
            C2C 法币 OTC · 9×9×9 释放机制 · Web4.0 Agentic 钱包
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link to={createPageUrl("Home")}>
              <Button size="lg">
                立即体验 <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to={createPageUrl("Whitepaper")}>
              <Button size="lg" variant="outline">
                阅读白皮书
              </Button>
            </Link>
          </div>

          <div className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["128,460", "注册用户"],
              ["1,284", "接入商家"],
              ["18,492,000", "区块高度"],
              ["21,480", "TPS"],
            ].map(([v, k]) => (
              <div key={k} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur">
                <p className="num text-lg font-bold text-cyan-300 sm:text-xl">{v}</p>
                <p className="text-[10px] text-muted-foreground">{k}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 核心能力 */}
      <section id="features" className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-center text-xl font-semibold sm:text-2xl">六项核心能力</h2>
        <p className="mt-2 text-center text-xs text-muted-foreground">从消费入口到链上确权，全链路闭环</p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.t}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-cyan-400/30"
              >
                <span className="grid h-9 w-9 place-items-center rounded-xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-300">
                  <Icon className="h-4 w-4" />
                </span>
                <p className="mt-2.5 text-sm font-semibold">{f.t}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{f.d}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 代币经济 */}
      <section id="token" className="border-y border-white/5 bg-white/[0.015] py-16">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="text-center text-xl font-semibold sm:text-2xl">四代币经济模型</h2>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            NMS 通缩至 1.9 亿 · ACS 价值锚定 · YSE 收益分配 · GCP 治理投票
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {TOKENS.map((t) => (
              <div key={t.symbol} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold" style={{ color: t.color }}>
                    {t.symbol}
                  </span>
                  <span className="num text-[9px] text-muted-foreground">{t.supply}</span>
                </div>
                <p className="mt-1 text-[11px]">{t.name}</p>
                <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{t.use}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full text-[11px]">
              <thead className="bg-white/5 text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">晋升等级</th>
                  <th className="px-3 py-2 text-right font-medium">释放天数</th>
                  <th className="px-3 py-2 text-right font-medium">加速倍数</th>
                  <th className="px-3 py-2 text-right font-medium">直推奖励</th>
                </tr>
              </thead>
              <tbody>
                {RELEASE_TABLE.filter((r) => [0, 3, 4, 6, 8, 10, 12, 13].includes(r.order)).map((r) => (
                  <tr key={r.level} className="border-t border-white/5">
                    <td className="px-3 py-2" style={{ color: r.color }}>
                      {r.level}
                    </td>
                    <td className="num px-3 py-2 text-right">{r.days}</td>
                    <td className="num px-3 py-2 text-right text-emerald-300">{r.speed}x</td>
                    <td className="num px-3 py-2 text-right text-muted-foreground">
                      {PROMOTION_TIERS.find((p) => p.order === r.order)?.reward}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 路线图 */}
      <section id="roadmap" className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-center text-xl font-semibold sm:text-2xl">版本路线图</h2>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ROADMAP.map((r) => (
            <div
              key={r.phase}
              className={`rounded-2xl border p-4 ${
                r.done ? "border-emerald-400/25 bg-emerald-400/[0.06]" : "border-white/10 bg-white/[0.03]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="num text-xs font-bold text-cyan-300">{r.phase}</span>
                {r.done ? <Badge variant="success">已交付</Badge> : <Badge variant="outline">规划中</Badge>}
              </div>
              <p className="mt-1.5 text-sm font-semibold">{r.title}</p>
              <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{r.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/5 py-16">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <h2 className="text-xl font-semibold sm:text-2xl">开始你的 NMS 元生活</h2>
          <p className="mt-2 text-xs text-muted-foreground">
            扫码消费即获返利与 NFT，9×9×9 加速释放，参与 DAO 治理共享生态红利
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to={createPageUrl("Home")}>
              <Button size="lg">
                <Wallet className="h-4 w-4" /> 连接钱包
              </Button>
            </Link>
            <Link to={createPageUrl("PaymentCenter")}>
              <Button size="lg" variant="outline">
                <Zap className="h-4 w-4" /> 扫码消费
              </Button>
            </Link>
            <Link to={createPageUrl("Register")}>
              <Button size="lg" variant="outline">
                <Users className="h-4 w-4" /> 注册开户
              </Button>
            </Link>
          </div>
          <p className="mt-10 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
            <ShieldCheck className="h-3 w-3" /> 演示环境：所有数据存于本地浏览器，可随时在「管理」中重置
          </p>
        </div>
      </section>
    </div>
  );
}
