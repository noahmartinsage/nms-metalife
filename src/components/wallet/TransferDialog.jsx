import React, { useState } from "react";
import { ArrowUpRight, Send, ShieldCheck, Zap } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/textarea";
import { Select, SelectOption } from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { base44 } from "@/api/base44Client";
import { fmtNum, mockHash, mockQuantumSignature, sanitizeAmount } from "@/lib/format";

const TOKEN_FIELD = { NMS: "nms_balance", ACS: "acs_balance", YSE: "yse_balance", GCP: "gcp_balance" };

/** 转账弹窗（五子账户 → 链上地址 / 邮箱） */
export default function TransferDialog({ open, onOpenChange, accounts = [], onDone }) {
  const [fromId, setFromId] = useState(accounts[0]?.id || "");
  const [to, setTo] = useState("");
  const [token, setToken] = useState("NMS");
  const [amount, setAmount] = useState("100");
  const [busy, setBusy] = useState(false);

  const from = accounts.find((a) => a.id === fromId) || accounts[0];
  const available = from?.[TOKEN_FIELD[token]] || 0;
  const value = Number(amount) || 0;

  const submit = async () => {
    if (!from) return;
    if (!to.trim()) {
      toast.error("请输入收款地址或邮箱");
      return;
    }
    if (value <= 0) {
      toast.error("转账金额必须大于 0");
      return;
    }
    if (value > available) {
      toast.error("余额不足");
      return;
    }
    setBusy(true);
    try {
      await base44.entities.WalletAccount.update(from.id, { [TOKEN_FIELD[token]]: available - value });
      await base44.entities.Transaction.create({
        tx_hash: mockHash(),
        block_number: 18492000 + Math.floor(Math.random() * 5000),
        from_address: from.address,
        to_address: to.trim(),
        amount: value,
        token_type: token,
        status: "confirmed",
        gas_fee: 0,
        quantum_signature: mockQuantumSignature(),
        signature_time_ms: Date.now(),
      });
      toast.success(`已转出 ${fmtNum(value)} ${token}，Gas 由平台补贴`);
      onOpenChange(false);
      onDone?.();
    } catch (e) {
      toast.error("转账失败");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-4 w-4 text-cyan-300" /> 转账
          </DialogTitle>
          <DialogDescription>0 Gas · ML-DSA-65 量子签名 · 实时风控校验</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label>付款账户</Label>
            <Select value={fromId} onChange={(e) => setFromId(e.target.value)} className="mt-1">
              {accounts.map((a) => (
                <SelectOption key={a.id} value={a.id}>
                  {a.account_name} · {fmtNum(a[TOKEN_FIELD[token]] || 0)} {token}
                </SelectOption>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-[1fr_110px] gap-2">
            <div>
              <Label>收款地址 / 邮箱</Label>
              <Input
                className="mt-1"
                placeholder="0x… 或 friend@nms.ai"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
            <div>
              <Label>币种</Label>
              <Select value={token} onChange={(e) => setToken(e.target.value)} className="mt-1">
                {["NMS", "ACS", "YSE", "GCP"].map((t) => (
                  <SelectOption key={t} value={t}>
                    {t}
                  </SelectOption>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label>金额</Label>
              <span className="text-[10px] text-muted-foreground">
                可用 {fmtNum(available)} {token}
              </span>
            </div>
            <Input
              className="mt-1"
              type="number"
              min="0"
              step="any"
              value={amount}
              onChange={(e) => setAmount(sanitizeAmount(e.target.value))}
            />
            <div className="mt-1.5 flex gap-1">
              {[25, 50, 75, 100].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setAmount(String(((available * p) / 100).toFixed(4)))}
                  className="flex-1 rounded-md border border-white/10 py-1 text-[10px] text-muted-foreground hover:text-foreground"
                >
                  {p}%
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-[11px]">
            <div className="flex justify-between">
              <span className="text-muted-foreground">网络手续费</span>
              <span className="flex items-center gap-1 text-emerald-300">
                <Zap className="h-3 w-3" /> 0 Gas（平台补贴）
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">签名算法</span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-cyan-300" /> ML-DSA-65 + Dilithium
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={submit} disabled={busy}>
            <ArrowUpRight className="h-4 w-4" /> {busy ? "签名中…" : "确认转账"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
