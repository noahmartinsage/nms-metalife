import React, { useState } from "react";
import { AlertTriangle, Database, RotateCcw, Settings, Shield, Users } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { StatCard } from "@/components/common/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { base44 } from "@/api/base44Client";
import { useEntityList } from "@/hooks/useEntity";
import { ENTITY_ORDER } from "@/api/schemas";
import { fmtNum, fmtDate } from "@/lib/format";
import { findTier } from "@/lib/promotionData";
import ReadinessPanel from "@/components/admin/ReadinessPanel";

export default function AdminPanel() {
  const { data: users } = useEntityList("UserBalance", {}, "-total_consumption", 20);
  const { data: stores } = useEntityList("MerchantStore", {}, "-total_sales", 20);
  const { data: orders } = useEntityList("PaymentOrder", {}, "-created_date", 20);
  const [search, setSearch] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);

  const filtered = users.filter((u) => (search ? u.user_email.includes(search) : true));
  const gmv = orders.reduce((s, o) => s + (o.amount || 0), 0);

  return (
    <div className="space-y-4">
      <PageHeader
        icon={Shield}
        title="管理后台"
        subtitle="用户 · 商家 · 订单 · 实体数据 · 系统参数"
        badge={<Badge variant="warning">仅管理员</Badge>}
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard label="用户总数" value={users.length} unit="人" icon={Users} accent="cyan" />
        <StatCard label="商家数" value={stores.length} unit="家" icon={Shield} accent="emerald" />
        <StatCard label="订单 GMV" value={fmtNum(gmv)} unit="元" icon={Database} accent="violet" />
        <StatCard label="实体数量" value={ENTITY_ORDER.length} unit="个" icon={Database} accent="amber" />
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">用户管理</TabsTrigger>
          <TabsTrigger value="merchants">商家管理</TabsTrigger>
          <TabsTrigger value="entities">实体数据</TabsTrigger>
          <TabsTrigger value="system">系统设置</TabsTrigger>
          <TabsTrigger value="readiness">生产自检</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <SectionCard
            title="用户列表"
            desc={`${filtered.length} 条记录`}
            icon={Users}
            actions={<Input placeholder="搜索邮箱" value={search} onChange={(e) => setSearch(e.target.value)} className="h-7 w-36 text-[11px]" />}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-[10px]">
                <thead className="text-muted-foreground">
                  <tr>
                    <th className="px-2 py-1.5 text-left font-medium">用户</th>
                    <th className="px-2 py-1.5 text-right font-medium">等级</th>
                    <th className="px-2 py-1.5 text-right font-medium">可用 NMS</th>
                    <th className="px-2 py-1.5 text-right font-medium">累计消费</th>
                    <th className="px-2 py-1.5 text-right font-medium">团队</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => {
                    const tier = findTier(u.major_level || "普通用户");
                    return (
                      <tr key={u.id} className="border-t border-white/5">
                        <td className="num truncate px-2 py-1.5">{u.user_email}</td>
                        <td className="px-2 py-1.5 text-right" style={{ color: tier.color }}>
                          {u.major_level}
                        </td>
                        <td className="num px-2 py-1.5 text-right">{fmtNum(u.available_nms)}</td>
                        <td className="num px-2 py-1.5 text-right text-muted-foreground">
                          ¥{fmtNum(u.total_consumption)}
                        </td>
                        <td className="num px-2 py-1.5 text-right text-muted-foreground">
                          {(u.team_size || 0).toLocaleString("zh-CN")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="merchants">
          <SectionCard title="商家审核" desc={`${stores.length} 家门店`} icon={Shield}>
            <div className="space-y-1.5">
              {stores.map((s) => (
                <div key={s.id} className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.02] p-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[10px] font-medium">
                      {s.store_name}
                      <span className="ml-1 text-[9px] text-muted-foreground">{s.category}</span>
                    </p>
                    <p className="num truncate text-[9px] text-muted-foreground">
                      {s.owner_email} · 销售额 ¥{fmtNum(s.total_sales)}
                    </p>
                  </div>
                  <Badge variant={s.is_verified ? "success" : "warning"}>{s.is_verified ? "已认证" : "待审核"}</Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      await base44.entities.MerchantStore.update(s.id, { is_verified: true });
                      toast.success(`${s.store_name} 已通过审核`);
                    }}
                  >
                    审核
                  </Button>
                </div>
              ))}
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="entities">
          <SectionCard title="实体数据" icon={Database} desc="13 个实体的存储与字段规模">
            <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
              {ENTITY_ORDER.map((name, i) => (
                <div key={name} className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
                  <p className="flex items-center justify-between text-[10px] font-medium">
                    {name}
                    <span className="num text-[9px] text-muted-foreground">#{i + 1}</span>
                  </p>
                  <p className="mt-0.5 text-[9px] text-muted-foreground">JSON Schema 已注册 · 支持实时订阅</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="readiness">
          <ReadinessPanel />
        </TabsContent>

        <TabsContent value="system">
          <div className="grid gap-3 lg:grid-cols-2">
            <SectionCard title="系统参数" icon={Settings}>
              {[
                ["平台名称", "NMS MetaLife"],
                ["系统版本", "V13.0"],
                ["Gas 模式", "平台补贴（0 Gas）"],
                ["量子签名", "Kyber-768 + Dilithium"],
                ["多签委员会", "3/5"],
                ["数据存储", "localStorage（演示）"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between border-b border-white/5 py-1.5 text-[10px] last:border-0">
                  <span className="text-muted-foreground">{k}</span>
                  <span>{v}</span>
                </div>
              ))}
            </SectionCard>

            <SectionCard title="危险操作" icon={AlertTriangle}>
              <p className="text-[10px] leading-relaxed text-muted-foreground">
                重置将清空本地演示数据（13 个实体 + 当前用户），并重新写入种子数据。此操作不可撤销。
              </p>
              <div className="mt-2 flex gap-2">
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => {
                    if (!confirmReset) {
                      setConfirmReset(true);
                      toast.warning("再次点击以确认重置");
                      return;
                    }
                    base44.resetDemoData();
                    toast.success("演示数据已重置");
                    setTimeout(() => window.location.reload(), 500);
                  }}
                >
                  <RotateCcw className="h-4 w-4" /> {confirmReset ? "确认重置" : "重置演示数据"}
                </Button>
                <Button variant="outline" onClick={() => toast.success("已导出（演示）")}>
                  导出 CSV
                </Button>
              </div>
              <p className="mt-2 text-[9px] text-muted-foreground">最近操作：{fmtDate(new Date().toISOString(), true)}</p>
            </SectionCard>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
