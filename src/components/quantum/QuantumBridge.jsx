import React, { useMemo, useState } from "react";
import { ArrowRight, Globe, ShieldCheck, Waypoints } from "lucide-react";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectOption } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { fmtNum, sanitizeAmount } from "@/lib/format";
import { cn } from "@/lib/utils";

const CHAINS = [
  { key: "nms", name: "NMS Chain", color: "#22c55e", delay: 1 },
  { key: "eth", name: "Ethereum", color: "#818cf8", delay: 12 },
  { key: "polygon", name: "Polygon", color: "#a855f7", delay: 8 },
  { key: "bnb", name: "BNB Chain", color: "#fbbf24", delay: 34 },
  { key: "arb", name: "Arbitrum", color: "#38bdf8", delay: 15 },
];

const CHANNELS = [
  ["nms", "eth", 12, 12840, "正常"],
  ["nms", "polygon", 8, 8640, "正常"],
  ["nms", "bnb", 34, 1284, "暂停"],
  ["nms", "arb", 15, 3260, "正常"],
];

const RECORDS = [
  ["NMS → Polygon", 12800, "12:41", "已确认"],
  ["ETH → NMS", 4200, "11:08", "已确认"],
  ["NMS → Arbitrum", 8600, "09:52", "已确认"],
  ["NMS → BNB", 1200, "08:14", "已暂停"],
];

/** 量子跨链桥（LayerZero · 4 通道 · 30min 延迟熔断） */
export default function QuantumBridge() {
  const [from, setFrom] = useState("nms");
  const [to, setTo] = useState("polygon");
  const [token, setToken] = useState("NMS");
  const [amount, setAmount] = useState("1000");
  const [busy, setBusy] = useState(false);

  const delay = useMemo(() => {
    const hit = CHANNELS.find(([a, b]) => (a === from && b === to) || (a === to && b === from));
    return hit ? hit[2] : 18;
  }, [from, to]);

  const paused = delay > 30;
  const amt = Number(amount) || 0;

  const bridge = () => {
    if (paused) {
      toast.error("该通道延迟 34min，已触发熔断（阈值 30min）");
      return;
    }
    if (amt <= 0) {
      toast.error("请输入桥接数量");
      return;
    }
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      toast.success(`已发起跨链：${fmtNum(amt)} ${token}，预计 ${delay} 分钟到账，Gas 0`);
    }, 800);
  };

  return (
    <SectionCard
      title="量子跨链桥"
      desc="LayerZero 全链互操作 · 大额调度需 3/5 多签"
      icon={Waypoints}
      actions={<Badge variant="success">5 链互通</Badge>}
    >
      <div className="space-y-1.5">
        {CHANNELS.map(([a, b, d, tx, status]) => {
          const ca = CHAINS.find((c) => c.key === a);
          const cb = CHAINS.find((c) => c.key === b);
          return (
            <div
              key={`${a}-${b}`}
              className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-1.5"
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: ca.color }} />
              <span className="min-w-0 flex-1 truncate text-[10px]">
                {ca.name} → {cb.name}
              </span>
              <span className={cn("num shrink-0 text-[9px]", d > 30 ? "text-rose-300" : "text-muted-foreground")}>
                {d} min
              </span>
              <span className="num shrink-0 text-[9px] text-muted-foreground">{fmtNum(tx, 0)} 笔</span>
              <Badge variant={status === "正常" ? "success" : "danger"}>{status}</Badge>
            </div>
          );
        })}
      </div>

      <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
          <div>
            <p className="text-[9px] text-muted-foreground">从</p>
            <Select value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1 h-8 text-[11px]">
              {CHAINS.map((c) => (
                <SelectOption key={c.key} value={c.key}>
                  {c.name}
                </SelectOption>
              ))}
            </Select>
          </div>
          <ArrowRight className="mb-2 h-3.5 w-3.5 text-muted-foreground" />
          <div>
            <p className="text-[9px] text-muted-foreground">到</p>
            <Select value={to} onChange={(e) => setTo(e.target.value)} className="mt-1 h-8 text-[11px]">
              {CHAINS.map((c) => (
                <SelectOption key={c.key} value={c.key}>
                  {c.name}
                </SelectOption>
              ))}
            </Select>
          </div>
        </div>

        <div className="mt-2 grid grid-cols-[1fr_100px] gap-2">
          <div>
            <p className="text-[9px] text-muted-foreground">数量</p>
            <Input
              className="mt-1 h-8 text-[11px]"
              type="number"
              min="0"
              step="any"
              value={amount}
              onChange={(e) => setAmount(sanitizeAmount(e.target.value))}
            />
          </div>
          <div>
            <p className="text-[9px] text-muted-foreground">币种</p>
            <Select value={token} onChange={(e) => setToken(e.target.value)} className="mt-1 h-8 text-[11px]">
              {["NMS", "ACS", "YSE", "GCP"].map((t) => (
                <SelectOption key={t} value={t}>
                  {t}
                </SelectOption>
              ))}
            </Select>
          </div>
        </div>

        <div className="mt-2 space-y-0.5 rounded-lg bg-black/20 p-2 text-[9px]">
          <div className="flex justify-between">
            <span className="text-muted-foreground">预计到账</span>
            <span className="num">{fmtNum(amt * 0.999)} {token}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">确认延迟</span>
            <span className={cn("num", paused ? "text-rose-300" : "text-emerald-300")}>{delay} min</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">跨链费</span>
            <span className="num text-emerald-300">0（平台补贴）</span>
          </div>
        </div>

        <Button className="mt-2 w-full" size="sm" variant={paused ? "destructive" : "default"} onClick={bridge} disabled={busy}>
          <Globe className="h-3.5 w-3.5" /> {busy ? "桥接中…" : paused ? "通道已熔断" : "发起跨链"}
        </Button>
      </div>

      <div className="mt-2">
        <p className="mb-1 flex items-center gap-1 text-[10px] font-medium">
          <ShieldCheck className="h-3 w-3 text-emerald-300" /> 最近桥接记录
        </p>
        {RECORDS.map(([path, amt2, time, status]) => (
          <div key={`${path}-${time}`} className="flex items-center justify-between border-b border-white/5 py-1 text-[9px] last:border-0">
            <span className="text-muted-foreground">{path}</span>
            <span className="num">{fmtNum(amt2)}</span>
            <span className="num text-muted-foreground">{time}</span>
            <span className={status === "已确认" ? "text-emerald-300" : "text-rose-300"}>{status}</span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
