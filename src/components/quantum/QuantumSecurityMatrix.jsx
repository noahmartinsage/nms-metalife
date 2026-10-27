import React, { useState } from "react";
import { Fingerprint, KeyRound, Lock, RefreshCw, ShieldCheck, Timer } from "lucide-react";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { mockHash } from "@/lib/format";

const ALGOS = [
  {
    name: "Kyber-768",
    type: "KEM 密钥封装",
    desc: "NIST PQC 标准，用于钱包公钥协商与交易签名",
    strength: 192,
    color: "#22d3ee",
  },
  {
    name: "Dilithium3",
    type: "数字签名",
    desc: "抗量子格基签名，用于合约签名验证",
    strength: 176,
    color: "#a78bfa",
  },
  {
    name: "AES-256-GCM",
    type: "对称加密",
    desc: "P2P 消息与会话内容加密",
    strength: 256,
    color: "#34d399",
  },
  {
    name: "SHA-3-256",
    type: "哈希存证",
    desc: "RWA 文件与内容哈希上链",
    strength: 128,
    color: "#fbbf24",
  },
];

/** 量子安全矩阵（Kyber-768 / Dilithium / 密钥轮换 / 交易签名演示） */
export default function QuantumSecurityMatrix() {
  const [signing, setSigning] = useState(false);
  const [record, setRecord] = useState(null);

  const sign = () => {
    setSigning(true);
    setRecord(null);
    const t0 = performance.now();
    setTimeout(() => {
      const ms = Math.round((performance.now() - t0) * 100) / 100;
      setRecord({
        sig: `KYBER768-${mockHash("", 24).toUpperCase()}`,
        ms,
        hash: mockHash("0x", 40),
      });
      setSigning(false);
      toast.success(`量子签名完成，验证耗时 ${ms} ms`);
    }, 620);
  };

  return (
    <SectionCard
      title="量子安全矩阵"
      desc="抗量子密码学 · 抗量子等级 L5 · 密钥每 8 小时轮换"
      icon={ShieldCheck}
      actions={<Badge variant="success">L5</Badge>}
    >
      <div className="grid gap-2 sm:grid-cols-2">
        {ALGOS.map((a) => (
          <div key={a.name} className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
            <div className="flex items-center justify-between">
              <span className="num text-[11px] font-semibold" style={{ color: a.color }}>
                {a.name}
              </span>
              <span className="text-[9px] text-muted-foreground">{a.type}</span>
            </div>
            <p className="mt-0.5 text-[9px] leading-relaxed text-muted-foreground">{a.desc}</p>
            <div className="mt-1.5 flex items-center gap-1.5">
              <Progress value={Math.min(100, (a.strength / 256) * 100)} className="h-1" />
              <span className="num shrink-0 text-[9px] text-muted-foreground">{a.strength} bit</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-1.5 text-center">
        {[
          ["密钥强度", "98%", "#22d3ee"],
          ["签名覆盖率", "100%", "#34d399"],
          ["后量子迁移", "86%", "#a78bfa"],
        ].map(([k, v, c]) => (
          <div key={k} className="rounded-lg border border-white/10 bg-black/20 py-1.5">
            <p className="num text-[11px] font-semibold" style={{ color: c }}>
              {v}
            </p>
            <p className="text-[9px] text-muted-foreground">{k}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 space-y-1.5">
        {[
          ["签名算法", "Kyber-768 KEM + Dilithium3"],
          ["交易字段", "quantum_signature · signature_time_ms"],
          ["密钥轮换", "每 8 小时 · 上次 08:02"],
          ["多签委员会", "3/5 · RWA 与跨链大额"],
        ].map(([k, v]) => (
          <div key={k} className="flex items-center justify-between border-b border-white/5 py-1 text-[10px] last:border-0">
            <span className="text-muted-foreground">{k}</span>
            <span className="num text-right">{v}</span>
          </div>
        ))}
      </div>

      <Button className="mt-2 w-full" size="sm" onClick={sign} disabled={signing}>
        <KeyRound className="h-3.5 w-3.5" /> {signing ? "签名中…" : "演示：签名一笔量子交易"}
      </Button>

      {record && (
        <div className="mt-2 space-y-1 rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-2.5">
          <p className="flex items-center gap-1 text-[9px] text-muted-foreground">
            <Fingerprint className="h-2.5 w-2.5" /> quantum_signature
          </p>
          <p className="num break-all text-[9px] text-cyan-200">{record.sig}</p>
          <p className="num break-all text-[9px] text-muted-foreground">tx_hash {record.hash}</p>
          <p className="flex items-center gap-1 text-[9px] text-emerald-300">
            <Timer className="h-2.5 w-2.5" /> signature_time_ms = {record.ms}
          </p>
        </div>
      )}

      <p className="mt-2 flex items-center gap-1 text-[9px] text-muted-foreground">
        <Lock className="h-2.5 w-2.5" /> 私钥永不离开本地设备，模型与服务端不接触私钥
        <RefreshCw className="ml-1 h-2.5 w-2.5" /> 轮换由链上合约强制执行
      </p>
    </SectionCard>
  );
}
