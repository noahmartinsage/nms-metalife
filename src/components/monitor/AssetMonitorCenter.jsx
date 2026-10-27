import React from "react";
import { Activity, Boxes, Waypoints, Cpu, FileSearch, ShieldCheck } from "lucide-react";
import { SectionCard } from "@/components/common/SectionCard";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { fmtNum } from "@/lib/format";

const MODULES = [
  { key: "bridge", name: "跨链桥监控", icon: Waypoints, status: "正常", score: 96, desc: "LayerZero 通道 4 条 · 确认延迟 12min" },
  { key: "rwa", name: "RWA 确权监控", icon: Boxes, status: "正常", score: 92, desc: "已确权 1,284 项 · 待审 12 项" },
  { key: "quantum", name: "量子合约监控", icon: Cpu, status: "正常", score: 88, desc: "Kyber-768 签名覆盖率 100%" },
  { key: "ai", name: "AI 风控监控", icon: Activity, status: "预警", score: 74, desc: "NMS/USDT 池波动 18.4%（阈值 25%）" },
  { key: "audit", name: "合约审计", icon: FileSearch, status: "正常", score: 95, desc: "近 30 天 0 高危漏洞" },
];

/** 资产监控中心（五位一体） */
export default function AssetMonitorCenter() {
  const avg = MODULES.reduce((s, m) => s + m.score, 0) / MODULES.length;

  return (
    <SectionCard
      title="资产监控中心"
      desc="跨链桥 · RWA · 量子合约 · AI 风控 · 合约审计 五位一体"
      icon={ShieldCheck}
      actions={<Badge variant={avg > 85 ? "success" : "warning"}>健康度 {avg.toFixed(0)}</Badge>}
    >
      <div className="grid gap-2 sm:grid-cols-2">
        {MODULES.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.key} className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[11px] font-medium">
                  <Icon className="h-3.5 w-3.5 text-cyan-300" /> {m.name}
                </span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[9px] ${
                    m.status === "正常" ? "bg-emerald-400/10 text-emerald-300" : "bg-amber-400/10 text-amber-300"
                  }`}
                >
                  {m.status}
                </span>
              </div>
              <Progress value={m.score} className="mt-1.5 h-1" />
              <p className="mt-1 text-[9px] text-muted-foreground">{m.desc}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-3">
        <p className="mb-1.5 text-[11px] font-medium">实时事件流</p>
        <div className="space-y-1">
          {[
            ["12:41", "AI 风控", "NMS/USDT 池波动率 18.4%，未达熔断阈值", "text-amber-300"],
            ["11:28", "跨链桥", "LayerZero → Polygon 通道确认完成 1,284 笔", "text-emerald-300"],
            ["10:52", "RWA 确权", "新增 3 项实物资产通过 3/5 多签", "text-cyan-300"],
            ["09:16", "合约审计", "NMSStaking.sol 审计通过，评分 95", "text-emerald-300"],
            ["08:02", "量子签名", "Kyber-768 密钥轮换完成", "text-violet-300"],
          ].map(([t, mod, msg, c]) => (
            <div key={t + mod} className="flex items-start gap-2 rounded-lg bg-white/[0.02] px-2 py-1.5">
              <span className="num shrink-0 text-[9px] text-muted-foreground">{t}</span>
              <span className={`shrink-0 text-[9px] ${c}`}>{mod}</span>
              <span className="text-[9px] text-muted-foreground">{msg}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-2 grid grid-cols-3 gap-1.5 text-center">
        {[
          ["监控资产", `${fmtNum(24_800_000)} ACS`],
          ["24h 拦截", "3 次"],
          ["异常告警", "1 项"],
        ].map(([k, v]) => (
          <div key={k} className="rounded-lg border border-white/10 bg-black/20 py-1.5">
            <p className="num text-[11px] font-semibold">{v}</p>
            <p className="text-[9px] text-muted-foreground">{k}</p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
