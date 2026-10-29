import React, { useState } from "react";
import { Camera, Check, CreditCard, QrCode, ScanLine, Store, Wallet } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { base44 } from "@/api/base44Client";
import { calcPaymentSplit } from "@/lib/engine";
import { fmtNum, mockQuantumSignature, sanitizeAmount } from "@/lib/format";
import { useEntityList } from "@/hooks/useEntity";
import SmartScanner from "./SmartScanner";

/** 扫码支付（DID 打赏 → 链上结算 → 消费即铸造） */
const METHODS = [
  { key: "nms", label: "NMS", desc: "1:1 返利" },
  { key: "acs", label: "ACS", desc: "稳定币" },
  { key: "wechat", label: "微信", desc: "第三方" },
  { key: "alipay", label: "支付宝", desc: "第三方" },
];

export default function ScanPayModal({ open, onOpenChange, balance, onComplete }) {
  const { data: stores } = useEntityList("MerchantStore", {}, "-created_date", 20);
  const [step, setStep] = useState(1);
  const [merchant, setMerchant] = useState(null);
  const [amount, setAmount] = useState("268");
  const [tip, setTip] = useState(10);
  const [busy, setBusy] = useState(false);
  const [method, setMethod] = useState("nms");

  const split = calcPaymentSplit(Number(amount) || 0, merchant?.tip_ratio ?? tip);

  const handleScan = ({ code }) => {
    const hit = stores.find((s) => s.qr_code?.toUpperCase() === code.toUpperCase());
    if (hit) {
      setMerchant(hit);
      setTip(hit.tip_ratio);
      setStep(2);
      return;
    }
    if (stores[0]) {
      setMerchant(stores[0]);
      setTip(stores[0].tip_ratio);
      setStep(2);
      toast.message(`未匹配到 ${code}，已按示例商家结算（演示）`);
    }
  };

  const reset = () => {
    setStep(1);
    setMerchant(null);
    setAmount("268");
  };

  const pay = async () => {
    if (!merchant) return;
    if (!(Number(amount) > 0)) {
      toast.error("请输入有效金额");
      return;
    }
    setBusy(true);
    try {
      const result = calcPaymentSplit(Number(amount), merchant.tip_ratio);

      // 支付前余额校验（按支付方式）
      if (method === "nms" && (balance?.available_nms || 0) < result.amount) {
        toast.error("可用 NMS 不足，请切换支付方式或先充值");
        setBusy(false);
        return;
      }
      if (method === "acs" && (balance?.acs_balance || 0) < result.amount) {
        toast.error("ACS 余额不足，请切换支付方式");
        setBusy(false);
        return;
      }

      const order = await base44.entities.PaymentOrder.create({
        order_no: `NMS${Date.now().toString().slice(-9)}`,
        merchant_id: merchant.id,
        merchant_email: merchant.owner_email,
        merchant_name: merchant.store_name,
        user_email: balance?.user_email,
        amount: result.amount,
        payment_method: method,
        tip_ratio: result.tipRatio,
        merchant_consumed: result.merchantConsumed,
        user_reward: result.userReward,
        merchant_return: result.merchantReturn,
        vip_reward: result.vipReward,
        level_diff_reward: result.levelDiffReward,
        contributor_reward: result.contributorReward,
        physical_nft_pool_add: result.physicalPoolAdd,
        nft_minted: true,
        burned_amount: result.amount * 0.35,
        status: "completed",
        quantum_signature: mockQuantumSignature(),
      });

      const nft = await base44.entities.NFTItem.create({
        name: `${merchant.store_name} · 消费凭证 #${order.order_no.slice(-4)}`,
        description: `消费 ¥${result.amount} 铸造的 RWA 实物凭证，享永久 10% 版税四方分成。`,
        nft_type: "physical",
        category: merchant.category,
        price: result.amount,
        original_value: result.amount,
        royalty_percent: 10,
        owner_email: balance?.user_email,
        creator_email: merchant.owner_email,
        merchant_id: merchant.id,
        merchant_name: merchant.store_name,
        token_id: `#${order.order_no.slice(-6)}`,
        rarity: result.amount > 1000 ? "epic" : "common",
        trade_count: 0,
        total_royalty_earned: 0,
        dividend_earned: 0,
        is_for_sale: false,
      });

      if (balance?.id) {
        const patch = {
          total_consumption: (balance.total_consumption || 0) + result.amount,
          total_rewards: (balance.total_rewards || 0) + result.userReward,
          nft_physical_count: (balance.nft_physical_count || 0) + 1,
        };

        if (method === "nms") {
          // NMS 支付：扣本币，再按 1:1 返利
          patch.available_nms = Math.max(
            0,
            (balance.available_nms || 0) - result.amount + result.userReward
          );
        } else if (method === "acs") {
          // ACS 支付：扣稳定币，返 NMS
          patch.acs_balance = Math.max(0, (balance.acs_balance || 0) - result.amount);
          patch.available_nms = (balance.available_nms || 0) + result.userReward;
        } else {
          // 微信 / 支付宝：站外现金结算，仅入账返利
          patch.available_nms = (balance.available_nms || 0) + result.userReward;
        }

        await base44.entities.UserBalance.update(balance.id, patch);
      }

      await base44.entities.MerchantStore.update(merchant.id, {
        total_transactions: (merchant.total_transactions || 0) + 1,
        total_sales: (merchant.total_sales || 0) + result.amount,
        dividend_pool: (merchant.dividend_pool || 0) + result.merchantReturn,
        physical_nft_pool: (merchant.physical_nft_pool || 0) + result.physicalPoolAdd,
        store_nft_pool: (merchant.store_nft_pool || 0) + result.storePoolAdd,
        total_tips_given: (merchant.total_tips_given || 0) + result.merchantConsumed,
        physical_nft_issued: (merchant.physical_nft_issued || 0) + 1,
      });

      await base44.entities.Transaction.create({
        tx_hash: `0x${Math.random().toString(16).slice(2).padEnd(40, "0")}`,
        block_number: 18492000 + Math.floor(Math.random() * 5000),
        from_address: balance?.user_email || "demo",
        to_address: merchant.owner_email,
        amount: result.amount,
        token_type: "NMS",
        status: "confirmed",
        gas_fee: 0,
        quantum_signature: mockQuantumSignature(),
        signature_time_ms: Date.now(),
      });

      onOpenChange(false);
      reset();
      onComplete?.({ merchant, split: result, order, nft });
    } catch (e) {
      toast.error("支付失败，请重试");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanLine className="h-4 w-4 text-cyan-300" /> 扫码支付
          </DialogTitle>
          <DialogDescription>
            {step === 1 ? "对准商家收款码，或从附近商家列表选择" : "确认金额与打赏比例，链上即时结算"}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-3">
            <SmartScanner onScan={handleScan} sampleCode={stores[0]?.qr_code || "NMS-STORE-0001"} />

            <div>
              <Label>选择商家</Label>
              <div className="mt-1 max-h-52 space-y-1 overflow-y-auto">
                {stores.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setMerchant(s);
                      setTip(s.tip_ratio);
                      setStep(2);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-2 text-left hover:border-cyan-400/30"
                  >
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-400/10 text-[10px] font-bold text-cyan-200">
                      {s.store_name.slice(0, 1)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-medium">{s.store_name}</p>
                      <p className="truncate text-[9px] text-muted-foreground">
                        {s.category} · 打赏 {s.tip_ratio}%
                      </p>
                    </div>
                    <QrCode className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && merchant && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <Store className="h-4 w-4 text-cyan-300" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">{merchant.store_name}</p>
                <p className="truncate text-[10px] text-muted-foreground">{merchant.address}</p>
              </div>
              <Badge variant="outline">{merchant.category}</Badge>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label>支付金额（元）</Label>
                <span className="text-[10px] text-muted-foreground">
                  可用 {fmtNum(balance?.available_nms || 0)} NMS
                </span>
              </div>
              <Input
                type="number"
                min="0"
                step="any"
                value={amount}
                onChange={(e) => setAmount(sanitizeAmount(e.target.value))}
                className="mt-1 text-lg"
              />
              <div className="mt-1.5 flex gap-1">
                {[50, 100, 268, 500, 1000].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setAmount(String(v))}
                    className="flex-1 rounded-md border border-white/10 py-1 text-[10px] text-muted-foreground hover:text-foreground"
                  >
                    ¥{v}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">DID 打赏比例</span>
                <span className="num text-cyan-300">{split.tipRatio}%（5-30%）</span>
              </div>
              <Slider
                className="mt-2"
                value={split.tipRatio}
                min={5}
                max={30}
                step={1}
                onValueChange={(v) => setTip(v)}
              />
              <p className="mt-1 text-[10px] text-muted-foreground">
                商家成本 {fmtNum(split.merchantConsumed)} NMS · 双倍返还 {fmtNum(split.merchantReturn)} NMS
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label>支付方式</Label>
                <span className="text-[10px] text-muted-foreground">第三方支付为演示回调</span>
              </div>
              <div className="mt-1 grid grid-cols-4 gap-1">
                {METHODS.map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setMethod(m.key)}
                    className={`rounded-lg border px-1 py-1.5 text-center transition-colors ${
                      method === m.key
                        ? "border-cyan-400/45 bg-cyan-400/10 text-cyan-200"
                        : "border-white/10 text-muted-foreground hover:border-white/25"
                    }`}
                  >
                    <span className="block text-[10px] font-medium">{m.label}</span>
                    <span className="block text-[8px] opacity-70">{m.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-[10px] text-muted-foreground">支付后你将获得</p>
              <p className="num mt-0.5 text-lg font-semibold text-emerald-300">
                +{fmtNum(split.userReward)} NMS
              </p>
              <p className="text-[10px] text-muted-foreground">
                1:1 消费返利 · 自动铸造实物 NFT · 永久版税 10%
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 2 && (
            <Button variant="ghost" onClick={() => setStep(1)}>
              返回
            </Button>
          )}
          {step === 2 && (
            <Button variant="success" onClick={pay} disabled={busy}>
              <Wallet className="h-4 w-4" /> {busy ? "链上结算中…" : "确认支付"}
            </Button>
          )}
          {step === 1 && (
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              关闭
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { Check };
