import React from "react";
import { Activity, HeartPulse, Lock, Microscope, ShieldCheck } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { SectionCard, DataRow } from "@/components/common/SectionCard";
import { StatCard } from "@/components/common/StatCard";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useEntityList } from "@/hooks/useEntity";
import { fmtNum } from "@/lib/format";

const INDICATORS = [
  ["静息心率", "62 bpm", "正常", 82],
  ["睡眠时长", "7.2 h", "良好", 76],
  ["日均步数", "8,640", "达标", 88],
  ["血氧", "98%", "正常", 96],
  ["压力指数", "34", "偏低", 42],
];

export default function LifeScience() {
  const { data: assets } = useEntityList("DataAsset", { asset_type: "health" }, "-created_date", 10);

  return (
    <div className="space-y-4">
      <PageHeader
        icon={HeartPulse}
        title="元健康 · 生命科学"
        subtitle="健康数据确权 · 隐私计算 · 数据资产交易分成"
        badge={<Badge variant="success">隐私计算</Badge>}
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard label="健康数据资产" value={assets.length} unit="项" icon={HeartPulse} accent="rose" />
        <StatCard label="数据估值" value={fmtNum(assets.reduce((s, a) => s + (a.estimated_value || 0), 0))} unit="NMS" icon={Activity} accent="cyan" />
        <StatCard label="累计收益" value={fmtNum(assets.reduce((s, a) => s + (a.total_earnings || 0), 0))} unit="NMS" icon={Microscope} accent="emerald" />
        <StatCard label="加密等级" value="L5" icon={Lock} accent="violet" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <SectionCard title="健康指标" desc="可穿戴设备同步 · 每 15 分钟更新" icon={Activity}>
          <div className="space-y-2">
            {INDICATORS.map(([k, v, status, pct]) => (
              <div key={k}>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="num">
                    {v} <span className="text-emerald-300">· {status}</span>
                  </span>
                </div>
                <Progress value={pct} className="mt-0.5 h-1" />
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="数据资产" desc="确权后可授权科研机构使用并分成" icon={ShieldCheck}>
          {assets.length === 0 ? (
            <p className="py-6 text-center text-[11px] text-muted-foreground">暂无健康数据资产</p>
          ) : (
            assets.map((a) => (
              <DataRow
                key={a.id}
                label={a.asset_name}
                hint={`${a.data_size} · ${a.nft_token_id}`}
                value={`${fmtNum(a.estimated_value)} NMS`}
                valueClass="text-cyan-300"
              />
            ))
          )}
          <div className="mt-2 rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-[10px] leading-relaxed text-muted-foreground">
            健康数据经差分隐私与联邦学习处理，机构仅获得模型梯度而非原始数据，收益按智能合约自动分账。
          </div>
        </SectionCard>
      </div>

      <SectionCard title="在研方向" icon={Microscope} desc="NMS 生命科学基金支持">
        <div className="grid gap-2 sm:grid-cols-3">
          {[
            ["长寿因子研究", "NAD+ 与代谢通路队列研究（1,284 例）"],
            ["数字孪生器官", "基于健康时序数据的心脏数字孪生建模"],
            ["隐私计算网络", "跨机构联邦学习节点 42 个，模型不出域"],
          ].map(([t, d]) => (
            <div key={t} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-[11px] font-medium">{t}</p>
              <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
