import React, { useState } from "react";
import { Bot, Loader2, Send, Sparkles } from "lucide-react";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";

const PRESETS = ["当前 NMS 适合加仓吗？", "帮我评估永续合约风险", "推荐一个低风险套利策略"];

/** AI 交易助手（InvokeLLM） */
export default function AITradingAssistant() {
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const ask = async (question) => {
    const text = question || q;
    if (!text.trim()) return;
    setLoading(true);
    setAnswer("");
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `作为 NMS MetaLife 的 Minara-AI 量化交易顾问，请分析：${text}`,
      });
      setAnswer(res);
    } catch (e) {
      setAnswer("AI 服务暂时不可用，请稍后重试。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard
      title="AI 交易助手"
      desc="Minara-AI · 实时行情 + 风控 + 策略建议"
      icon={Bot}
      actions={<Badge variant="purple">LLM</Badge>}
    >
      <div className="flex flex-wrap gap-1">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => {
              setQ(p);
              ask(p);
            }}
            className="rounded-lg border border-white/10 px-2 py-1 text-[10px] text-muted-foreground hover:border-cyan-400/30 hover:text-cyan-200"
          >
            {p}
          </button>
        ))}
      </div>

      <div className="mt-2 flex gap-1.5">
        <Input
          placeholder="向 AI 提问…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask()}
          className="h-9 text-xs"
        />
        <Button size="icon" onClick={() => ask()} disabled={loading} aria-label="发送">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>

      <div className="mt-2 min-h-[76px] rounded-xl border border-white/10 bg-black/20 p-3">
        {loading ? (
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> Minara-AI 正在分析链上数据…
          </p>
        ) : answer ? (
          <pre className="whitespace-pre-wrap font-sans text-[11px] leading-relaxed text-muted-foreground">{answer}</pre>
        ) : (
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Sparkles className="h-3 w-3 text-cyan-300" /> 输入问题或点击上方预设，获取实时策略建议
          </p>
        )}
      </div>
    </SectionCard>
  );
}
