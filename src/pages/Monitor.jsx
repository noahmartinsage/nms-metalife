import React from "react";
import { Activity, Atom } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { Badge } from "@/components/ui/badge";
import AssetMonitorCenter from "@/components/monitor/AssetMonitorCenter";
import ContractAuditPanel from "@/components/monitor/ContractAuditPanel";
import { QuantumRiskDashboard, AutoRiskExecutor } from "@/components/monitor/RiskPanels";
import AICircuitBreaker from "@/components/quant/AICircuitBreaker";

export default function Monitor() {
  return (
    <div className="space-y-4">
      <PageHeader
        icon={Atom}
        title="监控中心"
        subtitle="资产监控 · 合约审计 · 量子风险 · AI 熔断 · 自动风险执行，五位一体实时防护"
        badge={<Badge variant="success">全部在线</Badge>}
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard label="监控资产" value="2,480万" unit="ACS" icon={Activity} accent="cyan" />
        <StatCard label="24h 拦截" value="3" unit="次" icon={Atom} accent="amber" />
        <StatCard label="量子风险" value="18" unit="/100" icon={Atom} accent="emerald" />
        <StatCard label="合约评分" value="91.8" unit="均分" icon={Atom} accent="violet" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <AssetMonitorCenter />
        <div className="space-y-4">
          <AICircuitBreaker />
          <QuantumRiskDashboard />
        </div>
        <ContractAuditPanel />
        <AutoRiskExecutor />
      </div>
    </div>
  );
}
