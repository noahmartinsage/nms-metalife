import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Atom, Cpu, Globe, Orbit, Sparkles, Users, Zap } from "lucide-react";
import ModuleShell from "@/components/common/ModuleShell";
import { SectionCard } from "@/components/common/SectionCard";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useEntityList } from "@/hooks/useEntity";
import { fmtNum } from "@/lib/format";
import { createPageUrl } from "@/utils";

/** 演化阶段：进度由真实治理数据驱动，而非写死 */
const PHASE_META = [
  { key: "p1", name: "Phase 1 · 链上生活", desc: "消费即铸造、RWA 确权、NFT 合成、9×9×9 释放" },
  { key: "p2", name: "Phase 2 · AI 自治", desc: "Minara-AI 策略自进化、Agent 一等公民、自动熔断" },
  { key: "p3", name: "Phase 3 · 元世界", desc: "门店与资产的数字孪生、空间化社交" },
  { key: "p4", name: "Phase 4 · 奇点", desc: "生态自组织、参数自调节、全球 DAO 网络" },
];

export default function Singularity() {
  const { data: regions, loading } = useEntityList("DAORegion", {}, "-created_date", 200);

  const stats = useMemo(() => {
    const active = regions.filter((r) => r.is_active);
    const members = regions.reduce((a, r) => a + (Number(r.member_count) || 0), 0);
    const fund = regions.reduce((a, r) => a + (Number(r.dao_fund) || 0), 0);
    const levels = new Set(regions.map((r) => r.level)).size;

    /* 阶段进度：以真实区域数/成员数/资金/层级折算，全部可解释 */
    const p1 = regions.length ? Math.min(100, 60 + levels * 8) : 0;
    const p2 = regions.length ? Math.min(100, 40 + Math.round((active.length / Math.max(regions.length, 1)) * 50)) : 0;
    const p3 = regions.length ? Math.min(100, 20 + Math.round((members / Math.max(members + 1000, 1)) * 60)) : 0;
    const p4 = regions.length ? Math.min(100, Math.round((fund / Math.max(fund + 100000, 1)) * 60)) : 0;

    return { active: active.length, members, fund, levels, progress: [p1, p2, p3, p4] };
  }, [regions]);

  const singularityIndex = Math.round(stats.progress.reduce((a, b) => a + b, 0) / 4);

  return (
    <ModuleShell
      icon={Atom}
      title="奇点"
      subtitle="生态终局形态：自组织、自进化、自调节的链上生活网络 · 指标取自真实治理数据"
      badge={<Badge variant="purple">Phase 4</Badge>}
      entity="DAORegion"
      limit={100}
      searchKeys={["region_name", "region_code"]}
      emptyHint="暂无治理区域，先创建第一个 DAO 区域"
      metrics={[
        { label: "奇点指数", get: () => singularityIndex, tone: "violet", hint: "四阶段进度均值" },
        { label: "治理区域", get: () => regions.length, tone: "cyan", hint: `${stats.active} 个活跃` },
        { label: "成员总数", get: () => fmtNum(stats.members), tone: "emerald" },
        { label: "DAO 资金", get: () => fmtNum(stats.fund), tone: "amber", hint: "NMS" },
      ]}
      columns={[
        { key: "region_name", label: "区域", render: (r) => <span className="text-[11px]">{r.region_name || "—"}</span> },
        {
          key: "region_code",
          label: "编码",
          render: (r) => <span className="num text-[10px] text-muted-foreground">{r.region_code || "—"}</span>,
        },
        { key: "level", label: "层级", render: (r) => <Badge variant="outline">L{r.level ?? "—"}</Badge> },
        {
          key: "member_count",
          label: "成员",
          align: "right",
          render: (r) => <span className="num">{fmtNum(r.member_count)}</span>,
        },
        {
          key: "dao_fund",
          label: "资金",
          align: "right",
          render: (r) => <span className="num text-cyan-200">{fmtNum(r.dao_fund)}</span>,
        },
        {
          key: "is_active",
          label: "状态",
          render: (r) => (
            <Badge variant={r.is_active ? "success" : "outline"}>{r.is_active ? "活跃" : "停用"}</Badge>
          ),
        },
      ]}
    >
      <div className="mt-3 grid gap-3 lg:grid-cols-[1.3fr_1fr]">
        <SectionCard title="演化阶段" desc="进度由真实区域数 / 成员数 / 资金折算" icon={Orbit}>
          <div className="space-y-2">
            {PHASE_META.map((p, i) => {
              const pct = stats.progress[i];
              return (
                <div key={p.key} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <div className="flex items-center justify-between">
                    <p className="flex items-center gap-1.5 text-[11px] font-medium">
                      <span className="num text-[10px] text-muted-foreground">0{i + 1}</span>
                      {p.name}
                    </p>
                    <span className={`num text-[10px] ${pct >= 100 ? "text-emerald-300" : "text-cyan-300"}`}>
                      {loading ? "—" : `${pct}%`}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{p.desc}</p>
                  <Progress value={pct} className="mt-1.5 h-1" />
                </div>
              );
            })}
          </div>
        </SectionCard>

        <div className="space-y-4">
          <SectionCard title="奇点特征" icon={Zap}>
            {[
              ["自组织", "DAO 提案由 AI 起草并模拟执行结果"],
              ["自进化", "策略参数遗传优化"],
              ["自调节", "通胀/销毁参数按链上数据动态调整"],
              ["自审计", "ZK 证明验证资产动作"],
              ["自金融", "Agent 之间自动撮合与结算"],
            ].map(([k, v]) => (
              <div key={k} className="border-b border-white/5 py-1.5 last:border-0">
                <p className="text-[11px] font-medium text-cyan-300">{k}</p>
                <p className="text-[10px] text-muted-foreground">{v}</p>
              </div>
            ))}
          </SectionCard>

          <SectionCard title="当前网络" desc="来自 DAORegion 实体" icon={Users}>
            <div className="space-y-1 text-[10px]">
              {[
                ["治理区域", `${regions.length} 个（${stats.active} 活跃）`],
                ["层级数", `${stats.levels} 层`],
                ["成员总数", fmtNum(stats.members)],
                ["DAO 资金", `${fmtNum(stats.fund)} NMS`],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="num">{v}</span>
                </div>
              ))}
            </div>
            <Link
              to={createPageUrl("Whitepaper")}
              className="mt-2 flex items-center justify-center gap-1 rounded-lg border border-violet-400/25 py-1.5 text-[10px] text-violet-300 hover:border-violet-400/50"
            >
              阅读白皮书 <ArrowRight className="h-3 w-3" />
            </Link>
          </SectionCard>
        </div>
      </div>

      <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
        <p className="text-xs font-semibold">技术底座</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-4">
          {[
            ["PoS + AI 验证", "出块与行为评估"],
            ["ML-DSA-65", "抗量子签名（KMS 托管）"],
            ["Hypercore", "去中心化存储"],
            ["LayerZero", "跨链互操作"],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
              <p className="text-[10px] font-medium">{k}</p>
              <p className="text-[9px] text-muted-foreground">{v}</p>
            </div>
          ))}
        </div>
      </div>
    </ModuleShell>
  );
}
