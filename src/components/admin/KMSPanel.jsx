import React, { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Check,
  Cpu,
  Fingerprint,
  KeyRound,
  Loader2,
  Lock,
  RefreshCw,
  ShieldCheck,
  Signature,
  X,
  Zap,
} from "lucide-react";
import { SectionCard } from "@/components/common/SectionCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import kmsClient from "@/api/kmsClient";
import { API_MODE } from "@/api/base44Client";

const short = (s, n = 18) => (s ? `${s.slice(0, n)}${s.length > n ? "…" : ""}` : "—");

/**
 * KMS / HSM 面板
 * 展示真实签名后端、密钥指纹、检查点，并提供签名→验签→篡改测试的闭环演示。
 */
export default function KMSPanel() {
  const [health, setHealth] = useState(null);
  const [keys, setKeys] = useState([]);
  const [audit, setAudit] = useState([]);
  const [checkpoints, setCheckpoints] = useState([]);
  const [chain, setChain] = useState(null);
  const [busy, setBusy] = useState("");

  const [payload, setPayload] = useState('{"order":"NMS-DEMO-001","amount":268,"to":"store_1"}');
  const [signed, setSigned] = useState(null);
  const [verified, setVerified] = useState(null);
  const [tampered, setTampered] = useState(null);

  const isServer = API_MODE === "server";

  const load = useCallback(async () => {
    if (!isServer) return;
    try {
      const [h, k, a, cp] = await Promise.all([
        kmsClient.health(),
        kmsClient.keys().catch(() => ({ keys: [] })),
        kmsClient.audit(8).catch(() => ({ items: [] })),
        kmsClient.checkpoints(3).catch(() => ({ items: [] })),
      ]);
      setHealth(h);
      setKeys(k.keys || []);
      setAudit(a.items || []);
      setCheckpoints(cp.items || []);
    } catch (e) {
      toast.error(`KMS 状态读取失败：${e.message}`);
    }
  }, [isServer]);

  useEffect(() => {
    load();
  }, [load]);

  const parsePayload = () => {
    try {
      return JSON.parse(payload);
    } catch (e) {
      return payload;
    }
  };

  const doSign = async () => {
    setBusy("sign");
    setVerified(null);
    setTampered(null);
    try {
      const res = await kmsClient.sign(parsePayload(), "admin.panel");
      setSigned(res);
      toast.success(`已签名 · ${res.algorithm} · ${res.latencyMs}ms`);
      load();
    } catch (e) {
      toast.error(`签名失败：${e.message}`);
    } finally {
      setBusy("");
    }
  };

  const doVerify = async () => {
    if (!signed) return;
    setBusy("verify");
    try {
      const res = await kmsClient.verify(parsePayload(), signed.signature, signed.keyId);
      setVerified(res);
      res.valid ? toast.success("验签通过") : toast.error(`验签失败：${res.reason}`);
    } catch (e) {
      toast.error(`验签异常：${e.message}`);
    } finally {
      setBusy("");
    }
  };

  const doTamper = async () => {
    if (!signed) return;
    setBusy("tamper");
    try {
      const obj = parsePayload();
      const mutated =
        typeof obj === "object" && obj !== null
          ? { ...obj, amount: (Number(obj.amount) || 0) + 1 }
          : `${obj}#tampered`;
      const res = await kmsClient.verify(mutated, signed.signature, signed.keyId);
      setTampered(res);
      res.valid ? toast.error("异常：篡改后仍通过验签") : toast.success("篡改被拒绝（符合预期）");
    } catch (e) {
      toast.error(`篡改测试异常：${e.message}`);
    } finally {
      setBusy("");
    }
  };

  const doRotate = async () => {
    setBusy("rotate");
    try {
      const res = await kmsClient.rotate();
      toast.success(`密钥已轮换至 v${res.version}`);
      setSigned(null);
      setVerified(null);
      setTampered(null);
      load();
    } catch (e) {
      toast.error(`轮换失败：${e.message}`);
    } finally {
      setBusy("");
    }
  };

  const doCheckpoint = async () => {
    setBusy("checkpoint");
    try {
      const cp = await kmsClient.checkpoint();
      toast.success(`检查点 #${cp.height} 已签名`);
      load();
    } catch (e) {
      toast.error(`生成检查点失败：${e.message}`);
    } finally {
      setBusy("");
    }
  };

  const doChainVerify = async () => {
    setBusy("chain");
    try {
      const res = await kmsClient.chainVerify(50);
      setChain(res);
      res.ok ? toast.success(`链上验签通过：${res.valid}/${res.checked}`) : toast.error(`发现 ${res.invalid} 笔验签失败`);
    } catch (e) {
      toast.error(`链验签失败：${e.message}`);
    } finally {
      setBusy("");
    }
  };

  if (!isServer) {
    return (
      <SectionCard title="KMS / HSM" desc="后量子签名密钥托管" icon={KeyRound}>
        <div className="flex items-start gap-2 rounded-xl border border-amber-400/25 bg-amber-400/[0.07] px-3 py-2">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
          <p className="text-[10px] leading-relaxed text-amber-200/90">
            当前为 localStorage 模式，签名由浏览器本地生成（仅演示）。切换到服务端模式
            （<span className="num">VITE_API_MODE=server</span>）后启用真实 ML-DSA 签名与密钥托管。
          </p>
        </div>
      </SectionCard>
    );
  }

  const activeKey = keys.find((k) => k.status === "active");
  const pqc = health?.pqcAvailable;

  return (
    <div className="space-y-3">
      <SectionCard
        title="KMS / HSM 密钥托管"
        desc="私钥信封加密落库，签名在服务端完成，前端只拿公钥与指纹"
        icon={KeyRound}
        actions={
          <div className="flex items-center gap-1.5">
            <Badge variant={pqc ? "success" : "warning"}>{pqc ? "后量子可用" : "降级 Ed25519"}</Badge>
            <Button size="sm" variant="ghost" onClick={load}>
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        }
      >
        <div className="grid gap-1.5 sm:grid-cols-2">
          <div className="glass-soft rounded-xl px-2.5 py-2">
            <p className="text-[9px] text-muted-foreground">签名算法</p>
            <p className="num mt-0.5 text-[13px] font-semibold text-cyan-200">
              {(health?.activeAlgorithm || "—").toUpperCase()}
            </p>
            <p className="mt-0.5 text-[8px] text-muted-foreground">
              {pqc ? "NIST FIPS 204 · 抗量子" : "Ed25519 · 经典曲线"}
            </p>
          </div>
          <div className="glass-soft rounded-xl px-2.5 py-2">
            <p className="text-[9px] text-muted-foreground">后端</p>
            <p className="mt-0.5 text-[11px] font-medium">{health?.provider || "—"}</p>
            <p className="num mt-0.5 text-[8px] text-muted-foreground">{short(health?.openssl, 28)}</p>
          </div>
          <div className="glass-soft rounded-xl px-2.5 py-2">
            <p className="text-[9px] text-muted-foreground">活动密钥</p>
            <p className="num mt-0.5 text-[11px]">
              {activeKey ? `${activeKey.alias} · v${activeKey.keyVersion}` : "—"}
            </p>
            <p className="mt-0.5 text-[8px] text-muted-foreground">共 {keys.length} 个（含历史）</p>
          </div>
          <div className="glass-soft rounded-xl px-2.5 py-2">
            <p className="text-[9px] text-muted-foreground">签名统计</p>
            <p className="num mt-0.5 text-[11px]">
              {health?.stats?.signs ?? 0} 次 · 平均 {health?.stats?.avgSignMs ?? 0}ms
            </p>
            <p className="mt-0.5 text-[8px] text-muted-foreground">失败 {health?.stats?.fails ?? 0} 次</p>
          </div>
        </div>

        {activeKey && (
          <div className="mt-2 flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/25 px-2 py-1.5">
            <Fingerprint className="h-3 w-3 shrink-0 text-violet-300" />
            <span className="num truncate text-[9px] text-muted-foreground">{activeKey.fingerprint}</span>
          </div>
        )}

        <div className="mt-2 grid grid-cols-3 gap-1.5">
          <Button size="sm" variant="outline" onClick={doRotate} disabled={!!busy}>
            {busy === "rotate" ? <Loader2 className="h-3 w-3 animate-spin" /> : <KeyRound className="h-3 w-3" />}
            轮换密钥
          </Button>
          <Button size="sm" variant="outline" onClick={doCheckpoint} disabled={!!busy}>
            {busy === "checkpoint" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Signature className="h-3 w-3" />}
            生成检查点
          </Button>
          <Button size="sm" variant="outline" onClick={doChainVerify} disabled={!!busy}>
            {busy === "chain" ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShieldCheck className="h-3 w-3" />}
            全链验签
          </Button>
        </div>

        <div className="mt-2 flex items-start gap-1.5 rounded-lg border border-white/10 bg-black/20 px-2 py-1.5">
          <Lock className="mt-0.5 h-3 w-3 shrink-0 text-emerald-300" />
          <p className="text-[8px] leading-relaxed text-muted-foreground">
            私钥使用 AES-256-GCM 信封加密，主密钥来自
            <span className="num"> NMS_KMS_MASTER_KEY </span>
            （当前：
            {health?.keystore === "env"
              ? "环境变量"
              : health?.keystore === "aliyun-kms"
                ? "阿里云 KMS 云托管"
                : "本地文件，生产请改用环境变量或云 KMS"}
            ）。轮换后旧密钥标记为 retired，仍可验签历史交易。
          </p>
        </div>

        {health?.aliyun && (
          <div className="mt-1.5 rounded-lg border border-white/10 bg-black/20 px-2 py-1.5">
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-medium">阿里云 KMS</p>
              <Badge variant={health.aliyun.configured ? "success" : "outline"}>
                {health.aliyun.configured ? "已配置" : "未配置"}
              </Badge>
            </div>
            <div className="mt-1 space-y-0.5 text-[8px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">区域</span>
                <span className="num">{health.aliyun.region}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">云托管根密钥</span>
                <span className={health.aliyun.cloudKek ? "text-emerald-300" : "text-muted-foreground"}>
                  {health.aliyun.cloudKek ? "已启用" : "未启用"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">云签名</span>
                <span className={health.aliyun.cloudSigner ? "text-emerald-300" : "text-muted-foreground"}>
                  {health.aliyun.cloudSigner ? health.aliyun.signAlgorithm : "未启用（用本地 ML-DSA）"}
                </span>
              </div>
            </div>
            {!health.aliyun.configured && (
              <p className="mt-1 text-[8px] leading-relaxed text-muted-foreground">
                接入步骤见 <span className="num">docs/aliyun-kms.md</span>，或运行{" "}
                <span className="num">npm run kms:aliyun:dry</span> 查看。
              </p>
            )}
          </div>
        )}
      </SectionCard>

      <SectionCard title="签名 → 验签 → 篡改测试" desc="在浏览器里跑一遍真实的后量子签名闭环" icon={Cpu}>
        <textarea
          className="h-16 w-full rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-2 text-[10px] num text-foreground backdrop-blur-md focus:border-cyan-400/40 focus:outline-none"
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
          spellCheck={false}
        />

        <div className="mt-1.5 grid grid-cols-3 gap-1.5">
          <Button size="sm" onClick={doSign} disabled={!!busy}>
            {busy === "sign" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Signature className="h-3 w-3" />}
            签名
          </Button>
          <Button size="sm" variant="outline" onClick={doVerify} disabled={!signed || !!busy}>
            {busy === "verify" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
            验签
          </Button>
          <Button size="sm" variant="outline" onClick={doTamper} disabled={!signed || !!busy}>
            {busy === "tamper" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
            篡改测试
          </Button>
        </div>

        {signed && (
          <div className="mt-2 space-y-1 rounded-lg border border-cyan-400/20 bg-cyan-400/[0.05] px-2 py-1.5">
            <div className="flex items-center justify-between text-[9px]">
              <span className="text-muted-foreground">签名值（base64）</span>
              <span className="num text-cyan-200">{signed.signature.length} 字符</span>
            </div>
            <p className="num break-all text-[8px] text-muted-foreground">{short(signed.signature, 96)}</p>
            <div className="flex flex-wrap gap-1 pt-0.5">
              <Badge variant="default">{signed.algorithm}</Badge>
              <Badge variant="purple">v{signed.keyVersion}</Badge>
              <Badge variant={signed.cached ? "outline" : "success"}>{signed.cached ? "缓存命中" : `${signed.latencyMs}ms`}</Badge>
            </div>
          </div>
        )}

        {verified && (
          <div
            className={`mt-1.5 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[9px] ${
              verified.valid
                ? "border border-emerald-400/25 bg-emerald-400/[0.07] text-emerald-200"
                : "border border-rose-400/25 bg-rose-400/[0.07] text-rose-200"
            }`}
          >
            {verified.valid ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
            原始载荷验签：{verified.valid ? "通过" : `失败（${verified.reason}）`}
          </div>
        )}

        {tampered && (
          <div
            className={`mt-1.5 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[9px] ${
              tampered.valid
                ? "border border-rose-400/25 bg-rose-400/[0.07] text-rose-200"
                : "border border-emerald-400/25 bg-emerald-400/[0.07] text-emerald-200"
            }`}
          >
            {tampered.valid ? <X className="h-3 w-3" /> : <Check className="h-3 w-3" />}
            篡改后验签：{tampered.valid ? "仍通过（异常）" : `已拒绝（${tampered.reason}）`}
          </div>
        )}
      </SectionCard>

      {chain && (
        <SectionCard title="全链验签结果" desc="逐笔用公钥验证交易签名" icon={ShieldCheck}>
          <div className="grid grid-cols-4 gap-1.5 text-center">
            {[
              { k: "检查", v: chain.checked, c: "text-foreground" },
              { k: "通过", v: chain.valid, c: "text-emerald-300" },
              { k: "失败", v: chain.invalid, c: chain.invalid ? "text-rose-300" : "text-muted-foreground" },
              { k: "历史无签名", v: chain.legacyUnsigned, c: "text-amber-300" },
            ].map((x) => (
              <div key={x.k} className="glass-soft rounded-lg py-1.5">
                <p className="text-[8px] text-muted-foreground">{x.k}</p>
                <p className={`num text-[13px] font-semibold ${x.c}`}>{x.v}</p>
              </div>
            ))}
          </div>
          <div className="mt-1.5 space-y-0.5">
            {(chain.details || []).slice(0, 6).map((d) => (
              <div key={d.txHash} className="flex items-center gap-1.5 rounded bg-white/[0.02] px-2 py-1 text-[8px]">
                <span className="num truncate text-muted-foreground">{short(d.txHash, 20)}</span>
                <span className="ml-auto shrink-0">
                  {d.valid === true ? (
                    <span className="text-emerald-300">{d.algorithm} ✓</span>
                  ) : d.valid === false ? (
                    <span className="text-rose-300">失败</span>
                  ) : (
                    <span className="text-amber-300">历史无签名</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        <SectionCard title="检查点" desc="账本根哈希的后量子签名" icon={Signature}>
          {checkpoints.length === 0 ? (
            <p className="text-[10px] text-muted-foreground">暂无检查点，点击「生成检查点」创建。</p>
          ) : (
            <div className="space-y-1">
              {checkpoints.map((c) => (
                <div key={c.id} className="rounded-lg border border-white/5 bg-white/[0.02] px-2 py-1.5">
                  <div className="flex items-center justify-between text-[9px]">
                    <span className="num">高度 {c.height}</span>
                    <Badge variant="outline">{c.algorithm}</Badge>
                  </div>
                  <p className="num mt-0.5 truncate text-[8px] text-muted-foreground">root {short(c.root_hash, 32)}</p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="签名审计" desc="每次签名/验签都留痕" icon={ShieldCheck}>
          {audit.length === 0 ? (
            <p className="text-[10px] text-muted-foreground">暂无记录。</p>
          ) : (
            <div className="space-y-0.5">
              {audit.map((a) => (
                <div key={a.id} className="flex items-center gap-1.5 rounded bg-white/[0.02] px-2 py-1 text-[8px]">
                  <span className={a.ok ? "text-emerald-300" : "text-rose-300"}>{a.op}</span>
                  <span className="num truncate text-muted-foreground">{short(a.payloadHash, 12)}</span>
                  <span className="ml-auto shrink-0 text-muted-foreground">
                    {a.latencyMs != null ? `${a.latencyMs}ms` : "—"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
