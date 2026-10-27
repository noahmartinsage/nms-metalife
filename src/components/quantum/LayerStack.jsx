import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Cpu, Globe, Layers, Network, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

/**
 * L1-L4 四层公链架构（白皮书 2.1 / 技术白皮书 2）
 */
export const LAYERS = [
  {
    key: "L4",
    name: "应用层",
    icon: Globe,
    color: "#22d3ee",
    duty: "用户交互：DApps / 商家 / 钱包 / 社交",
    tech: ["React 18 + Vite", "Tailwind + shadcn 风格组件", "Base44 SDK 实体与集成", "实时订阅 subscribe()"],
    protocols: ["Home · Wallet · PaymentCenter", "NFTMarket · DEXTrading", "Social · Monitor · AIAssistant"],
  },
  {
    key: "L3",
    name: "协议层",
    icon: Layers,
    color: "#a78bfa",
    duty: "业务协议：RWA 确权 / NFT / AI 风控 / DAO",
    tech: ["RWAMintContract", "RoyaltyDistributor", "CircuitBreaker", "GovernanceContract"],
    protocols: ["LayerZeroBridge 跨链", "ReleaseAccelerator 9×9×9", "MerchantStakingContract", "NFT1155 / NFT721"],
  },
  {
    key: "L2",
    name: "共识层",
    icon: ShieldCheck,
    color: "#34d399",
    duty: "区块验证、交易排序、多签审核",
    tech: ["PoS + AI 辅助验证", "多签委员会 3/5", "0 Gas 补贴机制", "21,480 TPS · 1.2s 出块"],
    protocols: ["Minara-AI 节点行为评估", "异常节点自动降权", "区块携带 quantum_signature", "跨链大额调度需多签"],
  },
  {
    key: "L1",
    name: "网络层",
    icon: Network,
    color: "#fbbf24",
    duty: "节点发现、消息广播、端对端加密",
    tech: ["Hyperswarm DHT", "Hypercore append-only log", "Kyber-768 KEM", "Dilithium 签名"],
    protocols: ["Holepunch 协议栈", "P2P 端对端通信", "抗量子密钥封装", "内容哈希上链存证"],
  },
];

export default function LayerStack() {
  const [open, setOpen] = useState("L3");

  return (
    <div className="space-y-2">
      {LAYERS.map((layer) => {
        const Icon = layer.icon;
        const active = open === layer.key;
        return (
          <div
            key={layer.key}
            className={cn(
              "overflow-hidden rounded-2xl border transition-colors",
              active ? "border-white/25 bg-white/[0.06]" : "border-white/10 bg-white/[0.025]"
            )}
          >
            <button
              type="button"
              onClick={() => setOpen(active ? null : layer.key)}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
            >
              <span
                className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-[10px] font-bold"
                style={{ background: `${layer.color}22`, color: layer.color }}
              >
                {layer.key}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-[12px] font-semibold">
                  {layer.name}
                  <Icon className="h-3 w-3" style={{ color: layer.color }} />
                </p>
                <p className="truncate text-[10px] text-muted-foreground">{layer.duty}</p>
              </div>
              <ChevronDown
                className={cn("h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform", active && "rotate-180")}
              />
            </button>

            <AnimatePresence initial={false}>
              {active && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22 }}
                >
                  <div className="grid gap-2 border-t border-white/10 p-3 sm:grid-cols-2">
                    <div>
                      <p className="mb-1 flex items-center gap-1 text-[9px] uppercase tracking-wide text-muted-foreground">
                        <Cpu className="h-2.5 w-2.5" /> 关键技术
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {layer.tech.map((t) => (
                          <span
                            key={t}
                            className="rounded-md border border-white/10 bg-black/20 px-1.5 py-0.5 text-[9px] text-muted-foreground"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-1 flex items-center gap-1 text-[9px] uppercase tracking-wide text-muted-foreground">
                        <Layers className="h-2.5 w-2.5" /> 协议 / 模块
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {layer.protocols.map((t) => (
                          <span
                            key={t}
                            className="rounded-md px-1.5 py-0.5 text-[9px]"
                            style={{ background: `${layer.color}18`, color: layer.color }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2">
        <span className="text-[10px] text-muted-foreground">自上而下：应用 → 协议 → 共识 → 网络</span>
        <Badge variant="success">0 Gas</Badge>
      </div>
    </div>
  );
}
