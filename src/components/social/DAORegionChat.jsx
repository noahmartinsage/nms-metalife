import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapPin, Send, Users } from "lucide-react";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { useEntityList } from "@/hooks/useEntity";
import { useSession } from "@/hooks/useSession";
import { fmtNum, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const LEVEL_LABEL = { province: "省", city: "市", district: "区", street: "街道" };

/** 全国区划 DAO 聊天 */
export default function DAORegionChat() {
  const { user } = useSession();
  const { data: regions } = useEntityList("DAORegion", {}, "created_date", 20);
  const [regionCode, setRegionCode] = useState("330106");
  const [text, setText] = useState("");
  const { data: messages } = useEntityList("ChatMessage", { region_code: regionCode }, "created_date", 100);
  const bottomRef = useRef(null);

  const region = regions.find((r) => r.region_code === regionCode);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const send = async () => {
    if (!text.trim()) return;
    await base44.entities.ChatMessage.create({
      region_code: regionCode,
      sender_email: user?.email || "demo@nms.ai",
      sender_name: user?.full_name || "我",
      sender_avatar: "",
      message_type: "text",
      content: text.trim(),
      red_packet_id: "",
      is_pinned: false,
    });
    setText("");
  };

  const sorted = useMemo(
    () => [...messages].sort((a, b) => new Date(a.created_date) - new Date(b.created_date)),
    [messages]
  );

  return (
    <SectionCard
      title="区划 DAO 社区"
      desc="省 / 市 / 区 / 街道四级 DAO · 提案与治理资金"
      icon={Users}
      actions={<Badge variant="outline">{region ? fmtNum(region.member_count, 0) : 0} 成员</Badge>}
    >
      <div className="scroll-x gap-1">
        {regions.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setRegionCode(r.region_code)}
            className={cn(
              "shrink-0 rounded-lg border px-2 py-1 text-[10px] transition-colors",
              regionCode === r.region_code
                ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-200"
                : "border-white/10 text-muted-foreground"
            )}
          >
            {r.region_name}
            <span className="ml-1 text-[8px] opacity-70">{LEVEL_LABEL[r.level]}</span>
          </button>
        ))}
      </div>

      {region && (
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5">
          <MapPin className="h-3 w-3 text-cyan-300" />
          <span className="text-[10px] text-muted-foreground">
            DAO 资金池 <span className="num text-emerald-300">{fmtNum(region.dao_fund)}</span> NMS · 成员{" "}
            {fmtNum(region.member_count, 0)}
          </span>
        </div>
      )}

      <div className="mt-2 h-[300px] space-y-2 overflow-y-auto rounded-xl border border-white/10 bg-black/20 p-2.5">
        {sorted.length === 0 && <p className="py-8 text-center text-[11px] text-muted-foreground">暂无消息，来打个招呼吧</p>}
        {sorted.map((m) => {
          const mine = m.sender_email === user?.email;
          return (
            <div key={m.id} className={cn("flex gap-2", mine && "flex-row-reverse")}>
              <Avatar name={m.sender_name} size={26} />
              <div className={cn("max-w-[78%]", mine && "items-end text-right")}>
                <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                  {!mine && <span>{m.sender_name}</span>}
                  <span>{timeAgo(m.created_date)}</span>
                  {m.is_pinned && <Badge variant="warning">置顶</Badge>}
                </div>
                <div
                  className={cn(
                    "mt-0.5 inline-block rounded-xl px-2.5 py-1.5 text-[11px] leading-relaxed",
                    mine ? "bg-cyan-500/20 text-cyan-50" : "bg-white/5 text-foreground"
                  )}
                >
                  {m.content}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="mt-2 flex gap-1.5">
        <Input
          placeholder="在区划 DAO 中发言…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          className="h-9 text-xs"
        />
        <Button size="icon" onClick={send} aria-label="发送">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </SectionCard>
  );
}
