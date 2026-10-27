import React, { useState } from "react";
import { Flame, Receipt, Sparkles } from "lucide-react";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { base44 } from "@/api/base44Client";
import { calcConsumptionProof } from "@/lib/engine";
import { fmtNum, sanitizeAmount } from "@/lib/format";

/** 消费凭证上链（销毁 25-45% NMS → 1:1 返还，规范 7.7） */
export default function ConsumptionProofMint({ balance, onDone }) {
  const [amount, setAmount] = useState("1280");
  const [ratio, setRatio] = useState(35);
  const [busy, setBusy] = useState(false);

  const calc = calcConsumptionProof(Number(amount) || 0, ratio);
  const insufficient = calc.burned > (balance?.available_nms || 0);

  const mint = async () => {
    if (!(Number(amount) > 0)) {
      toast.error("请输入消费金额");
      return;
    }
    if (insufficient) {
      toast.error("可用 NMS 不足以销毁");
      return;
    }
    setBusy(true);
    try {
      await base44.entities.NFTItem.create({
        name: `消费凭证 · ¥${fmtNum(calc.amount)} · ${new Date().toLocaleDateString("zh-CN")}`,
        description: `销毁 ${fmtNum(calc.burned)} NMS，1:1 返还 ${fmtNum(calc.returned)} NMS，凭证上链不可篡改。`,
        nft_type: "personal",
        category: "其他",
        price: calc.amount,
        original_value: calc.amount,
        royalty_percent: 10,
        owner_email: balance?.user_email,
        creator_email: balance?.user_email,
        token_id: `#C${Math.floor(Math.random() * 9000 + 1000)}`,
        is_for_sale: false,
        rarity: "common",
        trade_count: 0,
        total_royalty_earned: 0,
        dividend_earned: 0,
        synthesis_level: 0,
      });
      if (balance?.id) {
        await base44.entities.UserBalance.update(balance.id, {
          available_nms: (balance.available_nms || 0) - calc.burned + calc.returned,
          total_consumption: (balance.total_consumption || 0) + calc.amount,
          total_rewards: (balance.total_rewards || 0) + calc.returned,
        });
      }
      toast.success(`凭证已上链，净增 ${fmtNum(calc.returned - calc.burned)} NMS`);
      onDone?.();
    } catch (e) {
      toast.error("上链失败");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SectionCard
      title="消费凭证上链"
      desc="AI 识别消费额 → 销毁 25-45% NMS → 1:1 返还"
      icon={Receipt}
      actions={<Badge variant="warning">通缩机制</Badge>}
    >
      <div className="space-y-2.5">
        <div>
          <Label>消费总额（元，AI 识别）</Label>
          <Input
            className="mt-1"
            type="number"
            min="0"
            step="any"
            value={amount}
            onChange={(e) => setAmount(sanitizeAmount(e.target.value))}
          />
        </div>
        <div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">销毁比例</span>
            <span className="num text-rose-300">{ratio}%</span>
          </div>
          <Slider className="mt-2" value={ratio} min={25} max={45} step={1} onValueChange={setRatio} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-rose-400/20 bg-rose-400/5 p-2.5">
            <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Flame className="h-3 w-3 text-rose-300" /> 销毁
            </p>
            <p className="num mt-0.5 text-sm font-semibold text-rose-300">{fmtNum(calc.burned)}</p>
          </div>
          <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-2.5">
            <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Sparkles className="h-3 w-3 text-emerald-300" /> 返还（1:1）
            </p>
            <p className="num mt-0.5 text-sm font-semibold text-emerald-300">{fmtNum(calc.returned)}</p>
          </div>
        </div>

        <Button className="w-full" variant="success" onClick={mint} disabled={busy || insufficient}>
          <Flame className="h-4 w-4" />
          {insufficient ? "可用 NMS 不足" : busy ? "上链中…" : "销毁并铸造消费凭证"}
        </Button>
        <p className="text-[10px] text-muted-foreground">
          凭证可作为 RWA 二级市场交易标的，也可用于 NFT 合成维度提升。
        </p>
      </div>
    </SectionCard>
  );
}
