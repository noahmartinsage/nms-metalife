import React, { useState } from "react";
import { Lock, Plus, Rocket } from "lucide-react";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/components/ui/toast";
import { base44 } from "@/api/base44Client";
import { calcNftLock } from "@/lib/engine";
import { fmtNum, sanitizeAmount } from "@/lib/format";

/** 个人发布 NFT（NMS 锁定 25-45%，规范 7.6） */
export default function PersonalNFTPublish({ balance, onDone }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("500");
  const [qty, setQty] = useState("10");
  const [ratio, setRatio] = useState(35);
  const [busy, setBusy] = useState(false);

  const calc = calcNftLock(Number(price) || 0, Number(qty) || 0, ratio);
  const insufficient = calc.locked > (balance?.available_nms || 0);

  const publish = async () => {
    if (!name.trim()) {
      toast.error("请填写 NFT 名称");
      return;
    }
    if (insufficient) {
      toast.error("可用 NMS 不足以锁定");
      return;
    }
    setBusy(true);
    try {
      await base44.entities.NFTItem.create({
        name,
        description: `个人发行 · 发行 ${qty} 份 · 锁定比例 ${ratio}%（${fmtNum(calc.locked)} NMS）`,
        nft_type: "personal",
        category: "其他",
        price: Number(price),
        original_value: calc.total,
        royalty_percent: 10,
        owner_email: balance?.user_email,
        creator_email: balance?.user_email,
        token_id: `#P${Math.floor(Math.random() * 9000 + 1000)}`,
        is_for_sale: true,
        rarity: "rare",
        trade_count: 0,
        total_royalty_earned: 0,
        dividend_earned: 0,
        synthesis_level: 0,
      });
      if (balance?.id) {
        await base44.entities.UserBalance.update(balance.id, {
          available_nms: (balance.available_nms || 0) - calc.locked,
          locked_nms: (balance.locked_nms || 0) + calc.locked,
        });
      }
      toast.success(`发行成功，已锁定 ${fmtNum(calc.locked)} NMS`);
      setName("");
      onDone?.();
    } catch (e) {
      toast.error("发行失败");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SectionCard title="个人发布 NFT" desc="按发行总价锁定 25-45% NMS，作为价值背书" icon={Rocket}>
      <div className="space-y-2.5">
        <div>
          <Label>NFT 名称</Label>
          <Input
            className="mt-1"
            placeholder="如：我的摄影作品《晨雾》"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>单价（NMS）</Label>
            <Input
              className="mt-1"
              type="number"
              min="0"
              step="any"
              value={price}
              onChange={(e) => setPrice(sanitizeAmount(e.target.value))}
            />
          </div>
          <div>
            <Label>发行数量</Label>
            <Input
              className="mt-1"
              type="number"
              min="1"
              step="1"
              value={qty}
              onChange={(e) => setQty(sanitizeAmount(e.target.value))}
            />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">锁定比例</span>
            <span className="num text-cyan-300">{ratio}%（25-45%）</span>
          </div>
          <Slider className="mt-2" value={ratio} min={25} max={45} step={1} onValueChange={setRatio} />
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-[11px]">
          <div className="flex justify-between">
            <span className="text-muted-foreground">发行总价</span>
            <span className="num">{fmtNum(calc.total)} NMS</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">需锁定</span>
            <span className={`num ${insufficient ? "text-rose-300" : "text-emerald-300"}`}>
              {fmtNum(calc.locked)} NMS
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">可用余额</span>
            <span className="num">{fmtNum(balance?.available_nms || 0)} NMS</span>
          </div>
        </div>

        <Button className="w-full" onClick={publish} disabled={busy || insufficient}>
          {insufficient ? <Lock className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {insufficient ? "余额不足" : busy ? "上链中…" : "确认发行"}
        </Button>
      </div>
    </SectionCard>
  );
}
