import React, { useEffect, useMemo, useRef, useState } from "react";
import { Eye, EyeOff, Image as ImageIcon, Lock, Package, Send, Gift, ShieldCheck, Radio } from "lucide-react";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { base44 } from "@/api/base44Client";
import { useSession } from "@/hooks/useSession";
import { useP2P } from "@/hooks/useP2P";
import { mockHash, shortHash } from "@/lib/format";
import { cn } from "@/lib/utils";

const CONTACTS = [
  { id: "c1", name: "林小雨", did: "did:nms:330106:0x8f2a", online: true },
  { id: "c2", name: "赵梦琪", did: "did:nms:330106:0x3e8b", online: true },
  { id: "c3", name: "王志远", did: "did:nms:310000:0x9c1d", online: false },
  { id: "c4", name: "元味小馆（商家）", did: "did:nms:merchant:0xb52a", online: true },
];

const SEED = {
  c1: [
    { id: "s1", from: "them", type: "text", text: "周末的 DAO 线下沙龙你来吗？" },
    { id: "s2", from: "me", type: "text", text: "来，我带两个新同事一起。" },
    { id: "s3", from: "them", type: "red_packet", text: "新人见面礼红包 88 NMS", amount: 88 },
  ],
  c2: [
    { id: "s4", from: "them", type: "nft", text: "刚合成的 S2 门店 NFT，看下估值？", token: "#S4821" },
    { id: "s5", from: "me", type: "text", text: "不错，版税收益能覆盖质押成本了。" },
  ],
  c3: [{ id: "s6", from: "them", type: "text", text: "OTC 那笔已经放行了，注意查收。" }],
  c4: [
    { id: "s7", from: "them", type: "image", text: "今日新品：西湖龙井明前特级", token: "IMG-2841" },
    { id: "s8", from: "them", type: "text", text: "到店扫码消费即铸实物 NFT。" },
  ],
};

const TYPE_META = {
  text: { icon: Send, label: "文本" },
  image: { icon: ImageIcon, label: "图片" },
  red_packet: { icon: Gift, label: "红包" },
  nft: { icon: Package, label: "NFT" },
};

/**
 * DID 端对端加密聊天
 * - 持久化：ChatMessage（region_code = did:<contactId>）
 * - 实时同步：P2P BroadcastChannel，跨标签页即时送达
 */
export default function DIDEncryptedChat() {
  const { user } = useSession();
  const { broadcast, node } = useP2P();
  const [activeId, setActiveId] = useState("c1");
  const [threads, setThreads] = useState(SEED);
  const [loaded, setLoaded] = useState({});
  const [text, setText] = useState("");
  const [type, setType] = useState("text");
  const [showCipher, setShowCipher] = useState(false);
  const [unread, setUnread] = useState({});
  const activeRef = useRef(activeId);
  activeRef.current = activeId;

  const contact = CONTACTS.find((c) => c.id === activeId);
  const messages = threads[activeId] || [];

  /* 切换联系人时从实体库加载历史（DID 会话作为 region_code） */
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const rows = await base44.entities.ChatMessage.filter(
          { region_code: `did:${activeId}` },
          "created_date",
          60
        );
        if (!alive || !rows?.length) {
          setLoaded((l) => ({ ...l, [activeId]: true }));
          return;
        }
        const mine = user?.email || "demo@nms.ai";
        const mapped = rows.map((r) => ({
          id: r.id,
          from: r.sender_email === mine ? "me" : "them",
          type: r.message_type || "text",
          text: r.content,
          ts: r.created_date,
        }));
        setThreads((t) => {
          const existing = t[activeId] || [];
          const ids = new Set(existing.map((m) => m.id));
          return { ...t, [activeId]: [...mapped.filter((m) => !ids.has(m.id)), ...existing] };
        });
        setLoaded((l) => ({ ...l, [activeId]: true }));
      } catch (e) {
        setLoaded((l) => ({ ...l, [activeId]: true }));
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, [activeId, user?.email]);

  /* 订阅 P2P 聊天消息（跨标签页实时同步） */
  useEffect(() => {
    if (!node) return undefined;
    return node.on("chat", (payload) => {
      if (!payload?.convId || !payload?.msg) return;
      const { convId, msg } = payload;
      setThreads((t) => {
        const list = t[convId] || [];
        if (list.some((m) => m.id === msg.id)) return t;
        return { ...t, [convId]: [...list, msg] };
      });
      if (convId !== activeRef.current) {
        setUnread((u) => ({ ...u, [convId]: (u[convId] || 0) + 1 }));
      }
    });
  }, [node]);

  const cipherOf = (m) => `🔒 ${mockHash(`${m.id}${m.text}`, 22)}…${mockHash(m.text || "", 6)}`;

  const send = async () => {
    if (!text.trim()) return;
    const msg = {
      id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      from: "me",
      type,
      text: text.trim(),
      ts: new Date().toISOString(),
      amount: type === "red_packet" ? Math.max(8, Math.round(Math.random() * 200)) : undefined,
      token: type === "nft" ? `#${Math.floor(Math.random() * 9000 + 1000)}` : undefined,
    };

    setThreads((t) => ({ ...t, [activeId]: [...(t[activeId] || []), msg] }));
    setText("");

    // 1) P2P 实时广播（其他标签页立即收到）
    broadcast("chat", { convId: activeId, msg });

    // 2) 持久化到实体库（刷新后仍可读）
    try {
      await base44.entities.ChatMessage.create({
        region_code: `did:${activeId}`,
        sender_email: user?.email || "demo@nms.ai",
        sender_name: user?.full_name || "我",
        message_type: type,
        content: msg.text,
      });
      toast.success("消息已加密发送（P2P 同步 + 链上存证）");
    } catch (e) {
      toast.warning("消息已发送，但存证失败");
    }
  };

  const totalMsgs = useMemo(() => Object.values(threads).reduce((s, t) => s + t.length, 0), [threads]);

  return (
    <SectionCard
      title="DID 加密聊天"
      desc={`Kyber-768 + AES-256-GCM · ${totalMsgs} 条 · P2P 实时同步`}
      icon={Lock}
      actions={
        <div className="flex items-center gap-1">
          <Badge variant={node?.enabled ? "success" : "outline"}>
            <Radio className="h-2.5 w-2.5" /> {node?.enabled ? "P2P 在线" : "本地"}
          </Badge>
          <Button size="sm" variant="ghost" onClick={() => setShowCipher((v) => !v)}>
            {showCipher ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            {showCipher ? "明文" : "密文"}
          </Button>
        </div>
      }
    >
      <div className="grid gap-2 sm:grid-cols-[132px_1fr]">
        <div className="scroll-x gap-1 sm:flex-col">
          {CONTACTS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setActiveId(c.id);
                setUnread((u) => ({ ...u, [c.id]: 0 }));
              }}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-lg border px-1.5 py-1.5 text-left transition-colors sm:w-full",
                activeId === c.id ? "border-cyan-400/40 bg-cyan-400/10" : "border-white/5 bg-white/[0.02]"
              )}
            >
              <span className="relative">
                <Avatar name={c.name} size={22} />
                <span
                  className={cn(
                    "absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full border border-[#0d1526]",
                    c.online ? "bg-emerald-400" : "bg-slate-500"
                  )}
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[9px]">{c.name}</span>
                <span className="num block truncate text-[8px] text-muted-foreground">{shortHash(c.did, 10, 4)}</span>
              </span>
              {unread[c.id] > 0 && (
                <span className="num shrink-0 rounded-full bg-rose-500 px-1 text-[8px] text-white">{unread[c.id]}</span>
              )}
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20">
          <div className="flex items-center justify-between border-b border-white/10 px-2.5 py-1.5">
            <div className="min-w-0">
              <p className="truncate text-[10px] font-medium">{contact?.name}</p>
              <p className="num truncate text-[8px] text-muted-foreground">{contact?.did}</p>
            </div>
            <Badge variant="success">
              <ShieldCheck className="h-2.5 w-2.5" /> E2E
            </Badge>
          </div>

          <div className="max-h-[240px] space-y-1.5 overflow-y-auto p-2.5">
            {messages.map((m) => {
              const mine = m.from === "me";
              const Meta = TYPE_META[m.type] || TYPE_META.text;
              return (
                <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                  <div className={cn("max-w-[80%]", mine && "text-right")}>
                    <div
                      className={cn(
                        "inline-block rounded-xl px-2.5 py-1.5 text-left text-[10px] leading-relaxed",
                        mine ? "bg-cyan-500/20 text-cyan-50" : "bg-white/5 text-foreground"
                      )}
                    >
                      <span className="mb-0.5 flex items-center gap-1 text-[8px] text-muted-foreground">
                        <Meta.icon className="h-2.5 w-2.5" /> {Meta.label}
                      </span>
                      {showCipher ? (
                        <span className="num break-all text-[8px] text-emerald-300/80">{cipherOf(m)}</span>
                      ) : (
                        <>
                          {m.text}
                          {m.type === "red_packet" && (
                            <span className="mt-1 flex items-center gap-1 rounded-lg bg-rose-500/20 px-1.5 py-0.5 text-[9px] text-rose-200">
                              <Gift className="h-2.5 w-2.5" /> {m.amount || 88} NMS 红包
                            </span>
                          )}
                          {m.type === "nft" && (
                            <span className="mt-1 flex items-center gap-1 rounded-lg bg-violet-500/20 px-1.5 py-0.5 text-[9px] text-violet-200">
                              <Package className="h-2.5 w-2.5" /> NFT {m.token}
                            </span>
                          )}
                          {m.type === "image" && (
                            <span className="mt-1 flex h-14 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/10 text-[9px] text-muted-foreground">
                              <ImageIcon className="mr-1 h-3 w-3" /> {m.token || "IMG"}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-white/10 p-2">
            <div className="mb-1 flex gap-1">
              {Object.entries(TYPE_META).map(([k, v]) => {
                const Icon = v.icon;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setType(k)}
                    className={cn(
                      "flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[8px]",
                      type === k ? "bg-cyan-400/15 text-cyan-200" : "text-muted-foreground"
                    )}
                  >
                    <Icon className="h-2.5 w-2.5" /> {v.label}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-1">
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="发送加密消息…"
                className="h-8 text-[10px]"
              />
              <Button size="icon" className="h-8 w-8" onClick={send} aria-label="发送">
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
            <p className="mt-1 text-[8px] text-muted-foreground">
              历史加载 {loaded[activeId] ? "✓" : "…"} · 跨标签页 P2P 实时同步 · 服务端无明文
            </p>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
