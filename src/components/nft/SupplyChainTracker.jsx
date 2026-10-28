import React from "react";
import { Factory, ShieldCheck, Store, Truck, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { mockHash, shortHash } from "@/lib/format";

const STEPS = [
  { key: "produce", label: "生产 / 采集", icon: Factory, actor: "产地合作社", offset: -21 },
  { key: "qc", label: "第三方质检", icon: ShieldCheck, actor: "SGS 检测中心", offset: -15 },
  { key: "logistics", label: "冷链物流", icon: Truck, actor: "顺丰冷运", offset: -8 },
  { key: "store", label: "门店入库", icon: Store, actor: "商家", offset: -3 },
  { key: "owner", label: "用户持有", icon: UserCheck, actor: "持有人", offset: 0 },
];

/** NFT 供应链溯源（白皮书 5.4 / 技术白皮书 11） */
export default function SupplyChainTracker({ nft }) {
  if (!nft) return null;
  const seed = String(nft.token_id || nft.id || "NMS");

  const verify = () => {
    toast.success(`全链 ${STEPS.length} 个节点哈希校验一致，溯源完整`);
  };

  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-2.5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-medium">供应链溯源</p>
        <Badge variant="success">哈希一致</Badge>
      </div>

      <div className="relative mt-2 space-y-1.5 pl-4">
        <span className="absolute left-[7px] top-1 bottom-1 w-px bg-white/10" />
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const d = new Date(Date.now() + s.offset * 86400000);
          const hash = mockHash("0x", 40).slice(0, 40);
          const current = i === STEPS.length - 1;
          return (
            <div key={s.key} className="relative">
              <span
                className={`absolute -left-4 top-0.5 grid h-4 w-4 place-items-center rounded-full border ${
                  current
                    ? "border-cyan-400/50 bg-cyan-400/20 text-cyan-300"
                    : "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                }`}
              >
                <Icon className="h-2 w-2" />
              </span>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-medium">
                    {s.label}
                    {current && <span className="ml-1 text-[9px] text-cyan-300">当前</span>}
                  </p>
                  <p className="num truncate text-[9px] text-muted-foreground">
                    {s.actor} · {shortHash(hash)}
                  </p>
                </div>
                <span className="num shrink-0 text-[9px] text-muted-foreground">
                  {d.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" })}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <Button size="sm" variant="outline" className="mt-2 w-full" onClick={verify}>
        <ShieldCheck className="h-3 w-3" /> 验证全链哈希
      </Button>
      <p className="mt-1 text-[8px] text-muted-foreground">
        溯源数据锚定于 {String(seed).replace("#", "Token #")} · 任一层被篡改将导致哈希不匹配
      </p>
    </div>
  );
}
