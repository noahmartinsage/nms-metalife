import React, { useState } from "react";
import { Calculator, ChevronDown, Info, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { calcThreeDimension, releaseDaysByOrder } from "@/lib/engine";
import { RELEASE_TABLE } from "@/lib/engine";
import { fmtNum } from "@/lib/format";
import { cn } from "@/lib/utils";

/** NMS 介绍卡：9×9×9 释放机制（全站唯一公式来源） */
export default function NMSIntro() {
  const [dims, setDims] = useState({ consumption: 6, referral: 4, nft: 3 });
  const [pending, setPending] = useState("48000");
  const [open, setOpen] = useState(false);
  const r = calcThreeDimension(dims);
  const daily = (Number(pending) || 0) / r.days;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-cyan-300" />
            <h3 className="text-sm font-semibold">NMS 是什么？</h3>
          </div>
          <Badge variant="default">
            <Zap className="h-2.5 w-2.5" /> 999 → 31 天
          </Badge>
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          消费即铸造：每消费 1 元获得 1 NMS，并铸造 RWA 实物 NFT 享永久版税与分红。
          积分按 <span className="text-cyan-300">9×9×9 三维度</span> 加速释放：消费 + 推荐 + NFT 合成，最高 27 级，
          释放周期从 999 天压缩至 31 天（32.2x）。
        </p>

        <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="flex items-center gap-1.5 text-[11px] font-medium">
            <Calculator className="h-3 w-3 text-emerald-300" /> 释放周期试算
          </p>
          <div className="mt-2 space-y-2">
            {[
              ["消费维度", "consumption", "#22c55e"],
              ["推荐维度", "referral", "#06b6d4"],
              ["NFT 合成", "nft", "#a855f7"],
            ].map(([label, key, color]) => (
              <div key={key}>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="num" style={{ color }}>
                    {dims[key]} / 9
                  </span>
                </div>
                <Slider
                  className="mt-1"
                  value={dims[key]}
                  min={0}
                  max={9}
                  step={1}
                  onValueChange={(v) => setDims((d) => ({ ...d, [key]: v }))}
                />
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <Input
              type="number"
              min="0"
              step="any"
              value={pending}
              onChange={(e) => {
                const v = e.target.value;
                setPending(parseFloat(v) < 0 ? "0" : v);
              }}
              className="h-8 text-xs"
            />
            <span className="text-[10px] text-muted-foreground">待释放 NMS</span>
          </div>

          <div className="mt-2 grid grid-cols-3 gap-1.5 text-center">
            {[
              ["总等级", `${r.total}/27`],
              ["释放天数", `${r.days} 天`],
              ["日释放", fmtNum(daily, 2)],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg bg-white/5 py-1.5">
                <p className="num text-xs font-semibold text-cyan-300">{v}</p>
                <p className="text-[9px] text-muted-foreground">{k}</p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">
            加速倍数 {r.speed}x · 公式：999 − (总等级/27) × 968
          </p>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="mt-3 flex w-full items-center justify-between rounded-lg px-1 py-1 text-[11px] text-muted-foreground hover:text-foreground"
        >
          <span>各晋升等级释放周期</span>
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
        </button>

        {open && (
          <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-white/10">
            <table className="w-full text-[10px]">
              <thead className="sticky top-0 bg-[#0d1526] text-muted-foreground">
                <tr>
                  <th className="px-2 py-1.5 text-left font-medium">等级</th>
                  <th className="px-2 py-1.5 text-right font-medium">序号</th>
                  <th className="px-2 py-1.5 text-right font-medium">天数</th>
                  <th className="px-2 py-1.5 text-right font-medium">加速</th>
                </tr>
              </thead>
              <tbody>
                {RELEASE_TABLE.map((t) => (
                  <tr key={t.level} className="border-t border-white/5">
                    <td className="px-2 py-1.5" style={{ color: t.color }}>
                      {t.level}
                    </td>
                    <td className="num px-2 py-1.5 text-right">{t.order}</td>
                    <td className="num px-2 py-1.5 text-right">{t.days}</td>
                    <td className="num px-2 py-1.5 text-right text-emerald-300">{t.speed}x</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-2 text-[10px] text-muted-foreground/70">
          基准：普通用户 {releaseDaysByOrder(0)} 天 · 杰出贡献者 {releaseDaysByOrder(13)} 天
        </p>
      </CardContent>
    </Card>
  );
}
