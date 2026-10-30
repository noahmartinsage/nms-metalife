import React, { useMemo } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, Boxes, Coins, Landmark, ShieldCheck, TrendingUp } from "lucide-react";
import { SectionCard } from "@/components/common/SectionCard";
import { StatCard } from "@/components/common/StatCard";
import { fmtNum } from "@/lib/format";
import { priceSeries } from "@/lib/market";
import { useEntityList } from "@/hooks/useEntity";

/** 链上资产仪表盘 */
export default function OnChainAssetDashboard() {
  const { data: pools } = useEntityList("LiquidityPool", {}, "created_date", 10);
  const { data: nfts } = useEntityList("NFTItem", {}, "-created_date", 50);

  const series = useMemo(() => priceSeries(14), []);
  const tvl = pools.reduce((s, p) => s + (p.tvl || 0), 0);
  const nftValue = nfts.reduce((s, n) => s + (n.price || 0), 0);

  return (
    <SectionCard title="链上资产仪表盘" desc="跨链桥 · RWA · 流动性池实时快照" icon={Activity}>
      <div className="grid grid-cols-2 gap-2">
        <StatCard label="协议 TVL" value={fmtNum(tvl)} unit="ACS" icon={Landmark} accent="cyan" />
        <StatCard label="NFT 资产估值" value={fmtNum(nftValue)} unit="NMS" icon={Boxes} accent="violet" />
        <StatCard label="流动性池" value={pools.length} unit="个" icon={Coins} accent="emerald" />
        <StatCard label="量子合约审计" value="100" unit="% 通过" icon={ShieldCheck} accent="amber" />
      </div>

      <div className="mt-3 h-[120px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="oad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity={0.32} />
                <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" hide />
            <YAxis hide domain={["dataMin - 0.012", "dataMax + 0.012"]} />
            <Tooltip
              contentStyle={{
                background: "rgba(13,21,38,0.96)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10,
                fontSize: 11,
              }}
              formatter={(v) => [`${v} ACS`, "NMS 价格"]}
            />
            <Area type="monotone" dataKey="price" stroke="#34d399" strokeWidth={2} fill="url(#oad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        {[
          ["跨链桥", "LayerZero · 正常"],
          ["AI 风控", "Minara-AI · 监控中"],
          ["量子签名", "ML-DSA-65 · 已启用"],
          ["多签委员会", "3/5 · 在线"],
        ].map(([k, v]) => (
          <div key={k} className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5">
            <p className="text-[10px] text-muted-foreground">{k}</p>
            <p className="truncate text-[11px] font-medium text-emerald-300">{v}</p>
          </div>
        ))}
      </div>
      <p className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
        <TrendingUp className="h-3 w-3" /> 数据每 30 秒由链上索引器同步（演示环境为本地模拟）
      </p>
    </SectionCard>
  );
}
