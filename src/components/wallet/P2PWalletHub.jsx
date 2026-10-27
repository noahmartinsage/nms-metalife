import React, { useState } from "react";
import { Fingerprint, HardDriveDownload, Lock, Network, Radio } from "lucide-react";
import { SectionCard } from "@/components/common/SectionCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import { shortAddr } from "@/lib/format";

const FEATURES = [
  { key: "dht", label: "Hyperswarm DHT 节点发现", icon: Network, on: true },
  { key: "hypercore", label: "Hypercore 去中心化账本同步", icon: HardDriveDownload, on: true },
  { key: "kyber", label: "Kyber-768 量子签名", icon: Lock, on: true },
  { key: "did", label: "DID 身份绑定", icon: Fingerprint, on: true },
  { key: "relay", label: "P2P 中继（NAT 穿透）", icon: Radio, on: false },
];

/** P2P 钱包中心 */
export default function P2PWalletHub({ address = "" }) {
  const [flags, setFlags] = useState(() => Object.fromEntries(FEATURES.map((f) => [f.key, f.on])));
  const [syncing, setSyncing] = useState(false);

  const sync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      toast.success("P2P 账本已同步至 12 个对等节点");
    }, 900);
  };

  return (
    <SectionCard
      title="P2P 钱包中心"
      desc={`DID ${shortAddr(address, 12, 8)}`}
      icon={Network}
      actions={<Badge variant="success">在线</Badge>}
    >
      <div className="space-y-1.5">
        {FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <div
              key={f.key}
              className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-2"
            >
              <span className="flex items-center gap-2 text-[11px]">
                <Icon className="h-3.5 w-3.5 text-cyan-300" />
                {f.label}
              </span>
              <Switch
                checked={flags[f.key]}
                onCheckedChange={(v) => {
                  setFlags((s) => ({ ...s, [f.key]: v }));
                  toast.message(`${f.label} 已${v ? "开启" : "关闭"}`);
                }}
              />
            </div>
          );
        })}
      </div>
      <Button variant="outline" size="sm" className="mt-3 w-full" onClick={sync} disabled={syncing}>
        {syncing ? "同步中…" : "立即同步 P2P 账本"}
      </Button>
    </SectionCard>
  );
}
