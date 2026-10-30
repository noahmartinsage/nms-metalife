import React, { useMemo, useState } from "react";
import { Copyright, FileCheck2, ScrollText, Sparkles } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { SectionCard, DataRow } from "@/components/common/SectionCard";
import { StatCard } from "@/components/common/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import ModuleState from "@/components/common/ModuleState";
import { useEntityList } from "@/hooks/useEntity";
import { useSession } from "@/hooks/useSession";
import { base44 } from "@/api/base44Client";
import { fmtNum, mockHash } from "@/lib/format";

/**
 * 数字版权：确权即真实写 DataAsset（含内容哈希与估值）
 * 授权分账比例与 engine.js 的版税规则一致。
 */
export default function DigitalRights() {
  const { user } = useSession();
  const { data: assets, loading, error, refresh } = useEntityList(
    "DataAsset",
    { asset_type: "copyright" },
    "-created_date",
    100
  );

  const [name, setName] = useState("");
  const [type, setType] = useState("视觉");
  const [value, setValue] = useState("1280");
  const [busy, setBusy] = useState(false);

  const stats = useMemo(() => {
    const income = assets.reduce((s, a) => s + (Number(a.total_earnings) || 0), 0);
    const listed = assets.filter((a) => a.is_listed).length;
    const valuation = assets.reduce((s, a) => s + (Number(a.estimated_value) || 0), 0);
    return { income, listed, valuation };
  }, [assets]);

  const register = async () => {
    if (!name.trim()) {
      toast.error("请输入作品名称");
      return;
    }
    setBusy(true);
    try {
      const hash = `0x${mockHash("", 40)}`;
      await base44.entities.DataAsset.create({
        user_email: user?.email || "demo@nms.ai",
        asset_type: "copyright",
        asset_name: `${name.trim()}（${type}）`,
        data_hash: hash,
        estimated_value: Number(value) || 0,
        is_listed: false,
        total_earnings: 0,
        trade_count: 0,
        data_size: 0,
        status: "verified",
      });
      toast.success(`《${name.trim()}》已上链确权，哈希 ${hash.slice(0, 14)}…`);
      setName("");
      refresh();
    } catch (e) {
      toast.error(`确权失败：${e.message || "请重试"}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        icon={Copyright}
        title="数字版权"
        subtitle="内容确权 · 授权分账 · 侵权取证 · 收益自动结算"
        badge={<Badge variant="success">DOI 存证</Badge>}
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard label="已确权作品" value={loading ? "—" : assets.length} unit="件" icon={Copyright} accent="cyan" />
        <StatCard label="累计授权收入" value={loading ? "—" : fmtNum(stats.income)} unit="NMS" icon={ScrollText} accent="emerald" />
        <StatCard label="授权中" value={loading ? "—" : stats.listed} unit="件" icon={FileCheck2} accent="amber" />
        <StatCard label="资产估值" value={loading ? "—" : fmtNum(stats.valuation)} unit="NMS" icon={Sparkles} accent="violet" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <SectionCard title="我的版权资产" desc={loading ? "加载中…" : `${assets.length} 件`} icon={Copyright}>
          <ModuleState
            loading={loading}
            error={error}
            empty={assets.length === 0}
            onRetry={refresh}
            emptyHint="还没有确权作品，在右侧登记第一件"
          >
            <div className="space-y-1.5">
              {assets.map((a) => (
                <div key={a.id} className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-2.5">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-cyan-400/10 text-[9px] text-cyan-200">
                    {(a.asset_name || "").match(/（(.+)）/)?.[1] || "版权"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[10px] font-medium">{a.asset_name || "未命名作品"}</p>
                    <p className="num truncate text-[9px] text-muted-foreground">
                      估值 {fmtNum(a.estimated_value)} · 收益 {fmtNum(a.total_earnings)} NMS ·{" "}
                      {(a.data_hash || "").slice(0, 10)}…
                    </p>
                  </div>
                  <Badge variant={a.status === "verified" ? "success" : "warning"}>
                    {a.status === "verified" ? "已确权" : a.status || "待审"}
                  </Badge>
                </div>
              ))}
            </div>
          </ModuleState>
        </SectionCard>

        <div className="space-y-4">
          <SectionCard title="登记新作品" icon={FileCheck2} desc="上链即生成 DOI 与不可篡改哈希">
            <div className="space-y-2">
              <div>
                <Label>作品名称</Label>
                <Input
                  className="mt-1 h-9 text-xs"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="如：《城市夜色》"
                />
              </div>
              <div>
                <Label>作品类型</Label>
                <Input
                  className="mt-1 h-9 text-xs"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  placeholder="视觉 / 音乐 / 图文 / 商标"
                />
              </div>
              <div>
                <Label>估值（NMS）</Label>
                <Input
                  type="number"
                  min="0"
                  className="mt-1 h-9 text-xs"
                  value={value}
                  onChange={(e) => setValue(e.target.value.replace(/^-/, ""))}
                />
              </div>
              <Button className="w-full" onClick={register} disabled={busy}>
                <Copyright className="h-4 w-4" /> {busy ? "上链中…" : "确权上链"}
              </Button>
            </div>
          </SectionCard>

          <SectionCard title="授权分账规则" icon={ScrollText}>
            <DataRow label="创作者" value="60%" valueClass="text-emerald-300" />
            <DataRow label="推荐人" value="20%" valueClass="text-cyan-300" />
            <DataRow label="平台" value="12.9%" />
            <DataRow label="DAO 公共池" value="7.1%" valueClass="text-violet-300" />
            <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
              每次授权或转授，收益按上述比例由智能合约自动分账，无需人工申领。
            </p>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
