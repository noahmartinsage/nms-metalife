import React, { useState } from "react";
import { Coins, Heart, MessageCircle, PlayCircle, Share2 } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { fmtNum } from "@/lib/format";
import { cn } from "@/lib/utils";

const VIDEOS = [
  ["元味小馆的一天", "消费即铸造，一天铸造 128 个实物 NFT", "#22d3ee", 12800, 860, 42],
  ["9×9×9 三分钟讲透", "从 999 天到 31 天，释放加速原理拆解", "#a78bfa", 42600, 3240, 168],
  ["我在西湖区做 DAO", "区划 DAO 提案从起草到执行的完整记录", "#34d399", 8600, 486, 96],
  ["RWA 确权实录", "法律公证 + AI 合规 + 多签 + DOI 全流程", "#f59e0b", 18600, 1280, 74],
  ["AI 量化实操", "Alpha 六因子组合 90 天回测 +18.6%", "#fb7185", 22400, 1860, 128],
  ["元Life 线下沙龙", "杭州文三路社区聚会花絮", "#38bdf8", 6400, 320, 28],
];

export default function ShortVideo() {
  const [liked, setLiked] = useState({});
  const [tipped, setTipped] = useState({});

  return (
    <div className="space-y-4">
      <PageHeader
        icon={PlayCircle}
        title="元短视频"
        subtitle="内容即资产 · 打赏即消费 · 播放收益自动分账"
        badge={<Badge variant="success">内容确权</Badge>}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {VIDEOS.map(([title, desc, color, views, likes, comments]) => (
          <div key={title} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
            <div
              className="relative flex h-40 items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${color}44, ${color}11)` }}
            >
              <div className="absolute inset-0 grid-bg opacity-30" />
              <PlayCircle className="relative h-10 w-10 text-white/80" />
              <span className="absolute bottom-2 right-2 rounded bg-black/50 px-1.5 py-0.5 text-[9px] text-white/80">
                {fmtNum(views, 0)} 播放
              </span>
              <span className="absolute left-2 top-2 rounded bg-black/40 px-1.5 py-0.5 text-[9px] text-white/80">
                已确权
              </span>
            </div>
            <div className="p-3">
              <p className="text-[11px] font-medium">{title}</p>
              <p className="mt-0.5 line-clamp-2 text-[10px] leading-relaxed text-muted-foreground">{desc}</p>
              <div className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground">
                <button
                  type="button"
                  onClick={() => setLiked((l) => ({ ...l, [title]: !l[title] }))}
                  className={cn("flex items-center gap-1", liked[title] && "text-rose-400")}
                >
                  <Heart className={cn("h-3 w-3", liked[title] && "fill-rose-400")} /> {likes + (liked[title] ? 1 : 0)}
                </button>
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" /> {comments}
                </span>
                <button
                  type="button"
                  onClick={() => toast.success("链接已复制")}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  <Share2 className="h-3 w-3" /> 分享
                </button>
              </div>
              <Button
                size="sm"
                variant={tipped[title] ? "secondary" : "outline"}
                className="mt-2 w-full"
                onClick={() => {
                  setTipped((t) => ({ ...t, [title]: true }));
                  toast.success(`已打赏 10 NMS，创作者获得 7.1% 平台分成`);
                }}
              >
                <Coins className="h-3.5 w-3.5" /> {tipped[title] ? "已打赏" : "打赏 10 NMS"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
