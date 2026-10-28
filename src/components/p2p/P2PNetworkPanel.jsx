import React, { useState } from "react";
import { Activity, Copy, ExternalLink, Network, Radio, RefreshCw, Send, Users } from "lucide-react";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { useP2P } from "@/hooks/useP2P";
import { fmtNum, shortHash, timeAgo } from "@/lib/format";
import { P2P_CONFIG } from "@/lib/p2p";

/**
 * P2P 网络面板：真实多标签页点对点（BroadcastChannel）
 * 打开新标签页 = 新节点加入网络，账本与消息自动同步
 */
export default function P2PNetworkPanel() {
  const { nodeId, enabled, peers, ledger, events, height, broadcast, requestSync } = useP2P();
  const [text, setText] = useState("");

  const openPeer = () => {
    window.open(window.location.href, "_blank", "noopener");
    toast.success("已打开新节点（新标签页），稍候自动互联");
  };

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(nodeId);
      toast.success("节点 ID 已复制");
    } catch (e) {
      toast.error("复制失败");
    }
  };

  const send = () => {
    if (!text.trim()) return;
    broadcast("p2p-message", { text: text.trim(), from: nodeId });
    setText("");
    toast.success("消息已广播到 P2P 网络");
  };

  return (
    <SectionCard
      title="P2P 网络节点"
      desc={`通道 ${P2P_CONFIG.CHANNEL} · 心跳 ${P2P_CONFIG.HEARTBEAT_MS / 1000}s · 超时 ${P2P_CONFIG.PEER_TIMEOUT_MS / 1000}s`}
      icon={Network}
      actions={<Badge variant={enabled ? "success" : "warning"}>{enabled ? "在线" : "降级"}</Badge>}
    >
      <div className="grid grid-cols-3 gap-1.5 text-center">
        {[
          ["在线节点", peers.length + 1, "text-cyan-300"],
          ["账本高度", height, "text-emerald-300"],
          ["同步事件", events.length, "text-violet-300"],
        ].map(([k, v, c]) => (
          <div key={k} className="rounded-lg border border-white/10 bg-white/[0.03] py-1.5">
            <p className={`num text-[11px] font-semibold ${c}`}>{fmtNum(v, 0)}</p>
            <p className="text-[9px] text-muted-foreground">{k}</p>
          </div>
        ))}
      </div>

      <div className="mt-2 flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-2.5 py-1.5">
        <div className="min-w-0">
          <p className="text-[9px] text-muted-foreground">本节点</p>
          <p className="num truncate text-[10px] text-cyan-200">{nodeId}</p>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={copyId}
            className="rounded p-1 text-muted-foreground hover:text-foreground"
            aria-label="复制节点 ID"
          >
            <Copy className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={requestSync}
            className="rounded p-1 text-muted-foreground hover:text-foreground"
            aria-label="请求同步"
          >
            <RefreshCw className="h-3 w-3" />
          </button>
        </div>
      </div>

      <div className="mt-2">
        <p className="mb-1 flex items-center gap-1 text-[10px] font-medium">
          <Users className="h-3 w-3 text-cyan-300" /> 对等节点（{peers.length}）
        </p>
        {peers.length === 0 ? (
          <div className="rounded-lg border border-dashed border-white/10 px-2 py-2.5 text-center">
            <p className="text-[9px] text-muted-foreground">暂无其他节点，打开一个新标签页即可加入</p>
          </div>
        ) : (
          <div className="space-y-1">
            {peers.map((p) => (
              <div key={p.id} className="flex items-center gap-2 rounded-lg bg-white/[0.02] px-2 py-1">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
                <span className="num min-w-0 flex-1 truncate text-[9px]">{p.id}</span>
                <span className="num shrink-0 text-[9px] text-muted-foreground">{p.latency}ms</span>
                <span className="num shrink-0 text-[9px] text-muted-foreground">{timeAgo(p.lastSeen)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-2 flex gap-1">
        <Button size="sm" variant="outline" className="flex-1" onClick={openPeer}>
          <ExternalLink className="h-3 w-3" /> 打开新节点
        </Button>
        <Button size="sm" variant="ghost" onClick={requestSync}>
          <RefreshCw className="h-3 w-3" /> 同步
        </Button>
      </div>

      <div className="mt-2 flex gap-1">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="向 P2P 网络广播消息…"
          className="h-8 text-[10px]"
        />
        <Button size="icon" className="h-8 w-8" onClick={send} aria-label="广播">
          <Send className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="mt-2">
        <p className="mb-1 flex items-center gap-1 text-[10px] font-medium">
          <Activity className="h-3 w-3 text-emerald-300" /> 账本（append-only · 哈希去重）
        </p>
        <div className="max-h-28 space-y-0.5 overflow-y-auto">
          {ledger.length === 0 ? (
            <p className="py-2 text-center text-[9px] text-muted-foreground">账本为空，广播一条消息试试</p>
          ) : (
            ledger
              .slice(-8)
              .reverse()
              .map((e) => (
                <div key={e.hash} className="flex items-center gap-1.5 rounded bg-black/20 px-2 py-1 text-[9px]">
                  <span className="num shrink-0 text-muted-foreground">#{e.seq}</span>
                  <span className="shrink-0 text-cyan-300">{e.type}</span>
                  <span className="num min-w-0 flex-1 truncate text-muted-foreground">{shortHash(e.hash, 8, 6)}</span>
                  <span className="num shrink-0 text-muted-foreground/70">{new Date(e.ts).toLocaleTimeString("zh-CN", { hour12: false })}</span>
                </div>
              ))
          )}
        </div>
      </div>

      {events.length > 0 && (
        <div className="mt-1.5 rounded-lg border border-emerald-400/20 bg-emerald-400/5 px-2 py-1">
          <p className="flex items-center gap-1 text-[9px] text-emerald-300">
            <Radio className="h-2.5 w-2.5" /> 最近同步：来自 {shortHash(events[0].from, 6, 4)} 新增{" "}
            {events[0].added} 条 · 高度 {events[0].height}
          </p>
        </div>
      )}
    </SectionCard>
  );
}
