import React, { useState } from "react";
import {
  BadgeCheck,
  Building2,
  Camera,
  FileCheck2,
  Landmark,
  Link2,
  Lock,
  ScanLine,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, Textarea } from "@/components/ui/textarea";
import { Select, SelectOption } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { base44 } from "@/api/base44Client";
import { calcRoyaltySplit } from "@/lib/engine";
import { fmtNum, mockHash, sanitizeAmount } from "@/lib/format";
import { cn } from "@/lib/utils";

const CATEGORIES = ["餐饮", "零售", "服务", "娱乐", "教育", "医疗", "其他"];

const STEPS = [
  { key: 1, label: "基本信息", icon: FileCheck2 },
  { key: 2, label: "图片上传", icon: Camera },
  { key: 3, label: "RWA 确权", icon: ShieldCheck },
  { key: 4, label: "版税设置", icon: Landmark },
  { key: 5, label: "确认上链", icon: Link2 },
];

/** RWA 5 步确权上架流程（规范 7.10 / 8.5） */
export default function RWANFTListingModal({ open, onOpenChange, balance, onDone }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    category: "餐饮",
    price: "1280",
    original_value: "1680",
    description: "",
    image: "",
    nft_type: "physical",
  });
  const [audit, setAudit] = useState(0);
  const [busy, setBusy] = useState(false);

  const price = Number(form.price) || 0;
  const royalty = calcRoyaltySplit(price, 10);
  const deposit = price * 0.1;

  const runAudit = () => {
    setAudit(0);
    let p = 0;
    const timer = setInterval(() => {
      p += 20;
      setAudit(p);
      if (p >= 100) clearInterval(timer);
    }, 220);
  };

  const submit = async () => {
    if (!form.name.trim()) {
      toast.error("请填写资产名称");
      return;
    }
    setBusy(true);
    try {
      await base44.entities.NFTItem.create({
        name: form.name,
        description:
          form.description ||
          "已完成 RWA 确权：法律公证 + AI 合规评分 + 3/5 多签 + DOI 存证，可分享 VC 凭证。",
        image_url: form.image,
        nft_type: form.nft_type,
        category: form.category,
        price,
        original_value: Number(form.original_value) || price,
        royalty_percent: 10,
        royalty_referrer: 2.5,
        royalty_merchant: 2.5,
        royalty_node: 2.5,
        royalty_platform: 2.5,
        owner_email: balance?.user_email,
        creator_email: balance?.user_email,
        token_id: `#${Math.floor(Math.random() * 9000 + 1000)}`,
        is_for_sale: true,
        rarity: price > 5000 ? "legendary" : price > 2000 ? "epic" : "rare",
        trade_count: 0,
        total_royalty_earned: 0,
        dividend_earned: 0,
        synthesis_level: 0,
      });

      if (balance?.id) {
        await base44.entities.UserBalance.update(balance.id, {
          locked_nms: (balance.locked_nms || 0) + deposit,
        });
      }

      toast.success(`RWA 资产已上链，冻结保证金 ${fmtNum(deposit)} NMS`);
      onOpenChange(false);
      setStep(1);
      setAudit(0);
      onDone?.();
    } catch (e) {
      toast.error("上链失败，请重试");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) {
          setStep(1);
          setAudit(0);
        }
      }}
    >
      <DialogContent onClose={() => onOpenChange(false)} className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-cyan-300" /> RWA 资产确权上架
          </DialogTitle>
          <DialogDescription>5 步完成实物资产代币化：信息 → 图片 → 确权审计 → 版税 → 上链</DialogDescription>
        </DialogHeader>

        {/* 步骤条 */}
        <div className="flex items-center gap-1">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const done = step > s.key;
            const active = step === s.key;
            return (
              <React.Fragment key={s.key}>
                <div className="flex flex-1 flex-col items-center gap-1">
                  <span
                    className={cn(
                      "grid h-8 w-8 place-items-center rounded-full border text-[10px]",
                      done && "border-emerald-400/40 bg-emerald-400/15 text-emerald-300",
                      active && "border-cyan-400/50 bg-cyan-400/15 text-cyan-300",
                      !done && !active && "border-white/10 text-muted-foreground"
                    )}
                  >
                    {done ? <BadgeCheck className="h-4 w-4" /> : <Icon className="h-3.5 w-3.5" />}
                  </span>
                  <span className={cn("text-[9px]", active ? "text-cyan-300" : "text-muted-foreground")}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && <div className="mb-4 h-px flex-1 bg-white/10" />}
              </React.Fragment>
            );
          })}
        </div>

        <div className="mt-2 space-y-3">
          {step === 1 && (
            <>
              <div>
                <Label>资产名称</Label>
                <Input
                  className="mt-1"
                  placeholder="如：西湖龙井·明前特级 250g"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>类目</Label>
                  <Select
                    className="mt-1"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    {CATEGORIES.map((c) => (
                      <SelectOption key={c} value={c}>
                        {c}
                      </SelectOption>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>NFT 类型</Label>
                  <Select
                    className="mt-1"
                    value={form.nft_type}
                    onChange={(e) => setForm({ ...form, nft_type: e.target.value })}
                  >
                    <SelectOption value="physical">实物资产</SelectOption>
                    <SelectOption value="store">门店股权</SelectOption>
                    <SelectOption value="personal">个人权益</SelectOption>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>上架价格（NMS）</Label>
                  <Input
                    className="mt-1"
                    type="number"
                    min="0"
                    step="any"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: sanitizeAmount(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>资产原值（元）</Label>
                  <Input
                    className="mt-1"
                    type="number"
                    min="0"
                    step="any"
                    value={form.original_value}
                    onChange={(e) => setForm({ ...form, original_value: sanitizeAmount(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <Label>资产描述</Label>
                <Textarea
                  className="mt-1"
                  rows={2}
                  placeholder="产地、规格、权属说明…"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </>
          )}

          {step === 2 && (
            <div className="space-y-2">
              <div className="grid h-40 place-items-center rounded-xl border border-dashed border-white/15 bg-white/[0.02]">
                {form.image ? (
                  <img src={form.image} alt="资产" className="h-full w-full rounded-xl object-cover" />
                ) : (
                  <div className="text-center">
                    <ScanLine className="mx-auto h-7 w-7 text-muted-foreground" />
                    <p className="mt-1 text-[11px] text-muted-foreground">点击上传实物照片 / 质检报告 / 权属证明</p>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setForm({ ...form, image: "" })}
                >
                  清除
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setForm({ ...form, image: "local://uploads/asset-demo.png" });
                    toast.success("已上传 1 张图片（演示）");
                  }}
                >
                  <Camera className="h-3.5 w-3.5" /> 模拟上传
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">
                支持 JPG/PNG，单张 ≤ 5MB。图片将存储于去中心化存储（Hypercore）并生成内容哈希。
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-2">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">确权审计进度</span>
                  <span className="num text-cyan-300">{audit}%</span>
                </div>
                <Progress value={audit} className="mt-1.5" />
                <div className="mt-2 space-y-1">
                  {[
                    ["法律公证", "公证处电子签章已核验"],
                    ["AI 合规评分", "Minara-AI 评分 92/100"],
                    ["多签公证", "3/5 委员会签名通过"],
                    ["DOI 存证", `DOI 10.5281/nms.${mockHash("", 6)}`],
                  ].map(([k, v], i) => {
                    const ok = audit >= (i + 1) * 25;
                    return (
                      <div key={k} className="flex items-center justify-between text-[10px]">
                        <span className={ok ? "text-foreground" : "text-muted-foreground"}>{k}</span>
                        <span className={ok ? "text-emerald-300" : "text-muted-foreground"}>
                          {ok ? v : "待处理"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <Button size="sm" variant="outline" className="w-full" onClick={runAudit}>
                <ShieldCheck className="h-3.5 w-3.5" /> 开始确权审计
              </Button>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-2">
              <p className="text-[11px] text-muted-foreground">
                永久版税 10%，四方各 2.5%。每次二级市场成交自动结算，无需手动申领。
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ["推荐人", royalty.referrer],
                  ["商家", royalty.merchant],
                  ["节点", royalty.node],
                  ["平台", royalty.platform],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
                    <p className="text-[10px] text-muted-foreground">{k} 2.5%</p>
                    <p className="num text-sm font-semibold text-emerald-300">{fmtNum(v)} NMS</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-[11px]">
                <span className="text-muted-foreground">单次成交版税总额</span>
                <span className="num font-semibold">{fmtNum(royalty.total)} NMS</span>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-2">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-[11px]">
                {[
                  ["资产名称", form.name || "未命名资产"],
                  ["类目", form.category],
                  ["上架价格", `${fmtNum(price)} NMS`],
                  ["版税比例", "10%（四方各 2.5%）"],
                  ["冻结保证金", `${fmtNum(deposit)} NMS（10%）`],
                  ["确权状态", "法律公证 + AI 合规 + 多签 + DOI"],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between py-0.5">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="font-medium">{v}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-start gap-2 rounded-xl border border-amber-400/20 bg-amber-400/5 p-2.5">
                <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
                <p className="text-[10px] leading-relaxed text-muted-foreground">
                  确认上链后将冻结 {fmtNum(deposit)} NMS 作为质量保证金，180 天后无争议自动释放。
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <Badge variant="success">
                  <Building2 className="h-2.5 w-2.5" /> 已通过多签
                </Badge>
                <Badge variant="purple">VC 凭证可分享</Badge>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {step > 1 && (
            <Button variant="ghost" onClick={() => setStep(step - 1)}>
              上一步
            </Button>
          )}
          {step < 5 ? (
            <Button
              onClick={() => {
                if (step === 1 && !form.name.trim()) {
                  toast.error("请先填写资产名称");
                  return;
                }
                if (step === 3 && audit < 100) {
                  toast.error("请先完成确权审计");
                  return;
                }
                setStep(step + 1);
              }}
            >
              下一步
            </Button>
          ) : (
            <Button variant="success" onClick={submit} disabled={busy}>
              {busy ? "上链中…" : "确认上链并冻结保证金"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
