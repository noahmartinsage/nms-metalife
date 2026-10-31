import React, { useMemo, useState } from "react";
import { Blocks, Search, Zap } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { StatCard } from "@/components/common/StatCard";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useEntityList } from "@/hooks/useEntity";
import { fmtDate, fmtNum, shortHash } from "@/lib/format";
import { DataErrorBanner } from "@/components/common/ModuleState";

export default function Explorer() {
  const { data: txs, loading, error, refresh } = useEntityList("Transaction", {}, "-block_number", 30);
  const [q, setQ] = useState("");

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return txs;
    return txs.filter(
      (t) =>
        t.tx_hash?.toLowerCase().includes(query) ||
        t.from_address?.toLowerCase().includes(query) ||
        t.to_address?.toLowerCase().includes(query) ||
        String(t.block_number).includes(query)
    );
  }, [txs, q]);

  const blocks = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        number: 18492000 - i * 37,
        txns: 18 + ((i * 7) % 26),
        time: new Date(Date.now() - i * 12000),
        proposer: `NMS-Node-${String(12 + i).padStart(2, "0")}`,
      })),
    []
  );

  return (
    <div className="space-y-4">
      <DataErrorBanner error={error} loading={loading} onRetry={refresh} />

      <PageHeader
        icon={Blocks}
        title="区块浏览器"
        subtitle="NMS Chain · PoS + AI 验证 · 21K TPS · 0 Gas"
        badge={<Badge variant="success">已同步</Badge>}
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard label="区块高度" value="18,492,000" icon={Blocks} accent="cyan" />
        <StatCard label="TPS" value="21,480" icon={Zap} accent="emerald" />
        <StatCard label="出块时间" value="1.2" unit="s" icon={Blocks} accent="violet" />
        <StatCard label="Gas 价格" value="0" unit="Gwei" icon={Zap} accent="amber" />
      </div>

      <SectionCard title="搜索" icon={Search} desc="交易哈希 / 地址 / 区块高度">
        <div className="flex gap-1.5">
          <Input
            placeholder="0x… 或 18492000"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-9 text-xs"
          />
          <Button
            size="sm"
            onClick={() => toast.success(`找到 ${results.length} 条匹配记录`)}
          >
            搜索
          </Button>
        </div>
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <SectionCard title="交易列表" desc={`${results.length} 条`} icon={Blocks}>
          <div className="space-y-1">
            {results.slice(0, 14).map((t) => (
              <div key={t.id} className="flex items-center gap-2 border-b border-white/5 py-1.5 last:border-0">
                <span className="num w-16 shrink-0 text-[9px] text-muted-foreground">#{t.block_number}</span>
                <div className="min-w-0 flex-1">
                  <p className="num truncate text-[10px] text-cyan-200">{shortHash(t.tx_hash)}</p>
                  <p className="num truncate text-[9px] text-muted-foreground">
                    {shortHash(t.from_address)} → {shortHash(t.to_address)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="num text-[10px]">
                    {fmtNum(Number(t.amount))} {t.token_type}
                  </p>
                  <p
                    className={`text-[9px] ${
                      t.status === "confirmed"
                        ? "text-emerald-400"
                        : t.status === "pending"
                          ? "text-amber-400"
                          : "text-rose-400"
                    }`}
                  >
                    {t.status === "confirmed" ? "已确认" : t.status === "pending" ? "待确认" : "失败"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="最新区块" desc="PoS + AI 验证出块" icon={Blocks}>
          <div className="space-y-1">
            {blocks.map((b) => (
              <div key={b.number} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-2 py-1.5">
                <div>
                  <p className="num text-[10px] text-cyan-200">#{b.number}</p>
                  <p className="text-[9px] text-muted-foreground">{b.proposer}</p>
                </div>
                <div className="text-right">
                  <p className="num text-[10px]">{b.txns} 笔</p>
                  <p className="text-[9px] text-muted-foreground">{fmtDate(b.time.toISOString(), true)}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
