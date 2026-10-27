import React, { useState } from "react";
import { Copyright, FileCheck2, ScrollText, Sparkles } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { SectionCard, DataRow } from "@/components/common/SectionCard";
import { StatCard } from "@/components/common/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { fmtNum, mockHash } from "@/lib/format";

const RIGHTS = [
  ["《晨雾》摄影作品", "视觉", "已确权", 1280, 186.4],
  ["NMS 元生活主题曲", "音乐", "已确权", 3600, 428.2],
  ["9×9×9 科普长图", "图文", "已确权", 860, 92.6],
  ["元味小馆品牌视觉", "商标", "授权中", 8600, 1260.8],
];

export default function DigitalRights() {
  const [name, setName] = useState("");
  const [type, setType] = useState("视觉");
  const [list, setList] = useState(RIGHTS);

  const register = () => {
    if (!name.trim()) {
      toast.error("请输入作品名称");
      return;
    }
    setList((l) => [[name.trim(), type, "已确权", 0, 0], ...l]);
    toast.success(`《${name.trim()}》已上链确权，哈希 ${mockHash("0x", 8)}…`);
    setName("");
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
        <StatCard label="已确权作品" value={list.length} unit="件" icon={Copyright} accent="cyan" />
        <StatCard label="累计授权收入" value={fmtNum(list.reduce((s, r) => s + r[4], 0))} unit="NMS" icon={ScrollText} accent="emerald" />
        <StatCard label="授权中" value={list.filter((r) => r[2] === "授权中").length} unit="件" icon={FileCheck2} accent="amber" />
        <StatCard label="侵权取证" value="2" unit="次" icon={Sparkles} accent="rose" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <SectionCard title="我的版权资产" desc={`${list.length} 件`} icon={Copyright}>
          <div className="space-y-1.5">
            {list.map(([n, t, status, value, income], i) => (
              <div key={`${n}-${i}`} className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-cyan-400/10 text-[9px] text-cyan-200">
                  {t}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[10px] font-medium">{n}</p>
                  <p className="num text-[9px] text-muted-foreground">
                    估值 {fmtNum(value)} · 收益 {fmtNum(income)} NMS
                  </p>
                </div>
                <Badge variant={status === "已确权" ? "success" : "warning"}>{status}</Badge>
              </div>
            ))}
          </div>
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
              <Button className="w-full" onClick={register}>
                <Copyright className="h-4 w-4" /> 确权上链
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
