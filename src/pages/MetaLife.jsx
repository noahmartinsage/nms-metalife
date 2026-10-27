import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Boxes, Bot, Coins, Globe, HeartPulse, LayoutGrid, PlayCircle, Store, Users } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { createPageUrl } from "@/utils";

const MODULES = [
  { name: "元商城", desc: "RWA 实物 · 门店股权 · 个人 IP", icon: Store, page: "NFTMarket", pct: 82, color: "#22d3ee" },
  { name: "元支付", desc: "扫码即付 · 消费即铸造", icon: Coins, page: "MetaPay", pct: 91, color: "#34d399" },
  { name: "元社交", desc: "P2P 加密 · DID 身份", icon: Users, page: "Social", pct: 76, color: "#a78bfa" },
  { name: "元金融", desc: "DEX · DeFi · 预测市场", icon: Boxes, page: "DEXTrading", pct: 88, color: "#f59e0b" },
  { name: "元智能", desc: "AI 管家 · 量化 · 风控", icon: Bot, page: "AIAssistant", pct: 94, color: "#fb7185" },
  { name: "元健康", desc: "生命科学 · 健康数据资产", icon: HeartPulse, page: "LifeScience", pct: 48, color: "#38bdf8" },
  { name: "元内容", desc: "短视频 · 数字版权", icon: PlayCircle, page: "ShortVideo", pct: 62, color: "#c084fc" },
  { name: "元世界", desc: "奇点 · 数字孪生", icon: Globe, page: "Singularity", pct: 35, color: "#facc15" },
];

export default function MetaLife() {
  return (
    <div className="space-y-4">
      <PageHeader
        icon={LayoutGrid}
        title="元 Life 生态"
        subtitle="八大生活场景 · 消费即分红 · 共同富裕的 Web3 生活基础设施"
        badge={<Badge variant="purple">V13.0</Badge>}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {MODULES.map((m) => {
          const Icon = m.icon;
          return (
            <Link
              key={m.name}
              to={createPageUrl(m.page)}
              className="group rounded-2xl border border-white/10 bg-white/[0.035] p-3 transition-all hover:-translate-y-0.5 hover:border-white/25"
            >
              <div className="flex items-center justify-between">
                <span
                  className="grid h-9 w-9 place-items-center rounded-xl"
                  style={{ background: `${m.color}22`, color: m.color }}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <p className="mt-2 text-xs font-semibold">{m.name}</p>
              <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">{m.desc}</p>
              <div className="mt-2">
                <Progress value={m.pct} className="h-1" />
                <p className="num mt-1 text-[9px] text-muted-foreground">生态成熟度 {m.pct}%</p>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <SectionCard title="元 Life 闭环" desc="消费 → 确权 → 分红 → 治理" icon={Globe}>
          <div className="space-y-2">
            {[
              ["线下消费", "扫码支付，1:1 获得 NMS"],
              ["资产确权", "实物 / 门店资产 RWA 上链，多签 + DOI 存证"],
              ["分红结算", "版税四方分成 + 门店分红池按季度分配"],
              ["治理反哺", "区划 DAO 用治理资金补贴商家与用户"],
            ].map(([t, d], i) => (
              <div key={t} className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
                <span className="num grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-cyan-400/10 text-[10px] text-cyan-300">
                  {i + 1}
                </span>
                <div>
                  <p className="text-[11px] font-medium">{t}</p>
                  <p className="text-[10px] text-muted-foreground">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="生态数据" icon={LayoutGrid}>
          {[
            ["接入商家", "1,284 家"],
            ["注册用户", "128,460 人"],
            ["已确权资产", "12,860 项"],
            ["累计分红", "8,640,000 NMS"],
            ["DAO 资金池", "18,240,000 NMS"],
            ["平均复购率", "43%"],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between border-b border-white/5 py-1.5 text-[10px] last:border-0">
              <span className="text-muted-foreground">{k}</span>
              <span className="num font-medium text-cyan-300">{v}</span>
            </div>
          ))}
        </SectionCard>
      </div>
    </div>
  );
}
