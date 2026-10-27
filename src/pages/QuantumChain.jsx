import React from "react";
import { Atom, Cpu, Layers, Network, ShieldCheck, Zap } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { StatCard } from "@/components/common/StatCard";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import LayerStack from "@/components/quantum/LayerStack";
import QuantumSecurityMatrix from "@/components/quantum/QuantumSecurityMatrix";
import QuantumMiningPool from "@/components/quantum/QuantumMiningPool";
import QuantumBridge from "@/components/quantum/QuantumBridge";
import QuantumContractManager from "@/components/quantum/QuantumContractManager";

const SECURITY = [
  ["账户安全", "Kyber-768 量子签名 + DID 身份", "100%"],
  ["交易安全", "0 Gas + 量子签名 + 实时风控", "100%"],
  ["资产安全", "AI 熔断 + 多签审核 + 保证金冻结", "96%"],
  ["合约安全", "量子合约审计 + Rabby 式风险检测", "94%"],
  ["隐私安全", "P2P 端对端加密 + Hypercore 存储", "98%"],
  ["RWA 安全", "法律公证 + AI 合规 + 多签 + DOI + VC", "95%"],
];

export default function QuantumChain() {
  return (
    <div className="space-y-4">
      <PageHeader
        icon={Atom}
        title="量子公链架构"
        subtitle="L1 网络 / L2 共识 / L3 协议 / L4 应用 四层架构 · Kyber-768 抗量子 · PoS + AI 验证 · 0 Gas"
        badge={<Badge variant="purple">抗量子 L5</Badge>}
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard label="链上 TPS" value="21,480" icon={Zap} accent="cyan" />
        <StatCard label="出块时间" value="1.2" unit="s" icon={Network} accent="emerald" />
        <StatCard label="共识节点" value="128" unit="个" icon={Cpu} accent="violet" />
        <StatCard label="抗量子等级" value="L5" icon={ShieldCheck} accent="amber" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.05fr_1fr]">
        <SectionCard title="四层架构" desc="点击层级展开关键技术（白皮书 2.1）" icon={Layers}>
          <LayerStack />
        </SectionCard>

        <div className="space-y-4">
          <QuantumSecurityMatrix />
          <SectionCard title="安全模型" desc="六维防护（白皮书第 10 章）" icon={ShieldCheck}>
            <div className="space-y-1.5">
              {SECURITY.map(([k, v, pct]) => (
                <div key={k}>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="num text-emerald-300">{pct}</span>
                  </div>
                  <p className="text-[9px] text-muted-foreground/80">{v}</p>
                  <Progress value={Number(pct)} className="mt-0.5 h-0.5" />
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <QuantumMiningPool />
        <QuantumBridge />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <QuantumContractManager />
        <SectionCard title="共识与出块流程" desc="PoS + AI 辅助验证（技术白皮书 2.2）" icon={Cpu}>
          <div className="space-y-1.5">
            {[
              ["01 节点质押", "节点质押 NMS 参与出块，质押量决定出块权重"],
              ["02 交易排序", "CLOB 链下撮合 + 链上结算，21,480 TPS"],
              ["03 AI 行为评估", "Minara-AI 实时评估节点行为，异常自动降权"],
              ["04 量子签名验证", "每笔交易校验 quantum_signature 与 signature_time_ms"],
              ["05 多签确认", "RWA 确权 / 大额跨链需 3/5 多签委员会"],
              ["06 0 Gas 结算", "Gas 由平台补贴池承担，用户零手续费"],
            ].map(([t, d]) => (
              <div key={t} className="flex items-start gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-1.5">
                <span className="num shrink-0 text-[9px] text-cyan-300">{t.slice(0, 2)}</span>
                <div>
                  <p className="text-[10px] font-medium">{t.slice(3)}</p>
                  <p className="text-[9px] text-muted-foreground">{d}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 rounded-xl border border-white/10 bg-black/20 p-2.5 text-[9px] leading-relaxed text-muted-foreground">
            区块结构：每笔交易携带 <span className="text-cyan-300">quantum_signature</span> 与{" "}
            <span className="text-cyan-300">signature_time_ms</span>；交易实体字段见
            <span className="text-foreground"> Transaction</span> Schema。
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
