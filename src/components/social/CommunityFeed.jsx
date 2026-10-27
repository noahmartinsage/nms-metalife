import React, { useState } from "react";
import { Heart, MessageSquare, Share2, Sparkles, Gift } from "lucide-react";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/separator";
import { toast } from "@/components/ui/toast";
import { base44 } from "@/api/base44Client";
import { useEntityList } from "@/hooks/useEntity";
import { useSession } from "@/hooks/useSession";
import { fmtNum, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const SEED_POSTS = [
  {
    id: "p1",
    name: "林小雨",
    content: "在元味小馆消费 ¥268，秒到 268 NMS，还铸了一个实物 NFT。版税四方分成真的永久有效吗？",
    likes: 42,
    comments: 8,
    tag: "消费即铸造",
  },
  {
    id: "p2",
    name: "赵梦琪",
    content: "M4 升 M5 用了 3 个月，释放周期从 478 天压到 403 天。9×9×9 三维度里 NFT 合成最容易补。",
    likes: 128,
    comments: 24,
    tag: "晋升心得",
  },
  {
    id: "p3",
    name: "王志远",
    content: "西湖区 DAO 本周提案：把商家补贴池比例从 10% 提到 12%，投票到周五 18:00 截止。",
    likes: 76,
    comments: 15,
    tag: "DAO 治理",
  },
];

/** 社区动态 */
export default function CommunityFeed() {
  const { user } = useSession();
  const { data: packets } = useEntityList("RedPacket", {}, "-created_date", 5);
  const [posts, setPosts] = useState(SEED_POSTS);
  const [liked, setLiked] = useState({});
  const [text, setText] = useState("");

  const like = (id) => {
    setLiked((l) => ({ ...l, [id]: !l[id] }));
    setPosts((p) => p.map((x) => (x.id === id ? { ...x, likes: x.likes + (liked[id] ? -1 : 1) } : x)));
  };

  const publish = async () => {
    if (!text.trim()) return;
    const post = {
      id: `p${Date.now()}`,
      name: user?.full_name || "我",
      content: text.trim(),
      likes: 0,
      comments: 0,
      tag: "最新",
    };
    setPosts((p) => [post, ...p]);
    setText("");
    toast.success("动态已发布并链上存证");
    await base44.entities.ChatMessage.create({
      region_code: "feed",
      sender_email: user?.email || "demo@nms.ai",
      sender_name: user?.full_name || "我",
      content: post.content,
      message_type: "text",
      is_pinned: false,
    }).catch(() => {});
  };

  return (
    <div className="space-y-4">
      <SectionCard title="发布动态" icon={Sparkles} desc="消费、晋升、DAO 提案都可以分享">
        <div className="flex gap-2">
          <Input
            placeholder="分享你的 NMS 生活…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && publish()}
            className="h-9 text-xs"
          />
          <Button size="sm" onClick={publish}>
            发布
          </Button>
        </div>
      </SectionCard>

      <div className="space-y-2">
        {posts.map((p) => (
          <div key={p.id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
            <div className="flex items-center gap-2">
              <Avatar name={p.name} size={30} />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium">{p.name}</p>
                <p className="text-[9px] text-muted-foreground">{timeAgo(new Date(Date.now() - 3600000).toISOString())}</p>
              </div>
              <Badge variant="outline">{p.tag}</Badge>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{p.content}</p>
            <div className="mt-2 flex items-center gap-4 text-[10px] text-muted-foreground">
              <button type="button" onClick={() => like(p.id)} className={cn("flex items-center gap-1", liked[p.id] && "text-rose-400")}>
                <Heart className={cn("h-3 w-3", liked[p.id] && "fill-rose-400")} /> {p.likes}
              </button>
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" /> {p.comments}
              </span>
              <button
                type="button"
                onClick={() => toast.success("链接已复制")}
                className="flex items-center gap-1 hover:text-foreground"
              >
                <Share2 className="h-3 w-3" /> 分享
              </button>
            </div>
          </div>
        ))}
      </div>

      <SectionCard title="红包雨" icon={Gift} desc="商家与社区实时派发">
        <div className="grid gap-2 sm:grid-cols-2">
          {packets.map((r) => (
            <div
              key={r.id}
              className="rounded-xl border border-rose-400/20 bg-gradient-to-br from-rose-500/15 to-amber-500/5 p-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-rose-200">{r.message}</span>
                <Badge variant="danger">
                  {r.type === "lucky" ? "拼手气" : r.type === "average" ? "均分" : "商家"}
                </Badge>
              </div>
              <p className="num mt-1 text-sm font-bold text-amber-300">{fmtNum(r.total_amount)} NMS</p>
              <p className="text-[9px] text-muted-foreground">
                已领 {r.claimed_count}/{r.packet_count} · 剩余 {fmtNum(r.remaining_amount)}
              </p>
              <Button
                size="sm"
                variant="secondary"
                className="mt-1.5 w-full"
                onClick={() => toast.success(`抢到 ${fmtNum(Math.random() * 50 + 5)} NMS`)}
              >
                立即抢
              </Button>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
