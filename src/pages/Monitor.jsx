import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, Cpu, ShieldCheck, Signal } from "lucide-react";
import ModuleShell, { StatusBadge } from "@/components/common/ModuleShell";
import { SectionCard } from "@/components/common/SectionCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEntityList } from "@/hooks/useEntity";
import ModuleState from "@/components/common/ModuleState";
import kmsClient from "@/api/kmsClient";
import { API_MODE } from "@/api/base44Client";
import { fmtNum, shortHash } from "@/lib/format";

/**
 * 监控中心：全部指标来自真实数据
 * 数据源：Transaction（交易）、UserBalance（资金）、/api/chain/verify、/api/kms/health
 */
export default function Monitor() {
  const { data: txs, loading: txLoading, error: txError, refresh: refreshTx } = useEntityList("Transaction", {}, "-created_date", 200);
  const { data: balances, loading: balLoading, error: balError, refresh: refreshBal } = useEntityList("UserBalance", {}, "-created_date", 50);

  const [chain, setChain] = useState(null);
  const [kms, setKms] = useState(null);
  const [checking, setChecking] = useState(false);
  const [chainError, setChainError] = useState("");

  const isServer = API_MODE === "server";

  const loadChain = useCallback(async () => {
    if (!isServer) return;
    try {
      const [h, k] = await Promise.all([kmsClient.chainVerify(50), kmsClient.health()]);
      setChain(h);
      setKms(k);
      setChainError("");
    } catch (e) {
      setChainError(e.message);
    }
  }, [isServer]);

  useEffect(() => {
    loadChain();
  }, [loadChain]);

  const runVerify = async () => {
    setChecking(true);
    await Promise.all([loadChain(), refreshTx(), refreshBal()]);
    setChecking(false);
  };

  /* 风险信号：由真实数据算出，不是写死的文案 */
  const risks = useMemo(() => {
    const list = [];
    const failed = txs.filter((t) => t.status === "failed");
    const unsigned = txs.filter((t) => !t.signature_algorithm);
    const big = txs.filter((t) => Number(t.amount) >= 5000);
    const failRate = txs.length ? (failed.length / txs.length) * 100 : 0;

    if (failRate > 10) list.push({ level: "high", text: `交易失败率 ${failRate.toFixed(1)}%，超过 10% 阈值` });
    if (unsigned.length > 0) list.push({ level: "mid", text: `${unsigned.length} 笔交易缺少后量子签名（KMS 接入前数据）` });
    if (big.length > 0) list.push({ level: "mid", text: `${big.length} 笔大额交易（≥ 5000），建议人工复核` });
    if (chain && chain.invalid > 0) list.push({ level: "high", text: `链上验签失败 ${chain.invalid} 笔，可能存在篡改` });
    if (chain && chain.chain && !chain.chain.ok) list.push({ level: "high", text: "账本哈希链断裂，需立即排查" });
    if (list.length === 0) list.push({ level: "ok", text: "未发现异常信号" });
    return list;
  }, [txs, chain]);

  const riskTone = { high: "text-rose-300", mid: "text-amber-300", ok: "text-emerald-300" };

  return (
    <ModuleShell
      icon={Activity}
      title="链上监控"
      subtitle="交易吞吐、确认状态、账本哈希链与后量子签名验签，全部取自真实数据"
      badge={<Badge variant={chain && chain.ok === false ? "danger" : "success"}>{chain && chain.ok === false ? "异常" : "运行中"}</Badge>}
      entity="Transaction"
      limit={20}
      searchKeys={["tx_hash", "from_address", "to_address", "token_type"]}
      emptyHint="链上暂无交易，完成一笔支付后即可看到记录"
      actions={
        <Button size="sm" variant="outline" onClick={runVerify} disabled={checking}>
          <ShieldCheck className="h-3.5 w-3.5" /> {checking ? "校验中…" : "立即校验"}
        </Button>
      }
      metrics={[
        { label: "交易总数", get: (r) => r.length, tone: "cyan" },
        { label: "已确认", get: (r) => r.filter((x) => x.status === "confirmed").length, tone: "emerald" },
        {
          label: "失败 / 退款",
          get: (r) => r.filter((x) => ["failed", "refunded"].includes(x.status)).length,
          tone: "rose",
        },
        {
          label: "累计金额",
          get: (r) => fmtNum(r.reduce((a, x) => a + (Number(x.amount) || 0), 0)),
          tone: "violet",
          hint: "NMS / ACS 混合",
        },
      ]}
      columns={[
        {
          key: "tx_hash",
          label: "交易哈希",
          render: (r) => <span className="num text-cyan-200">{shortHash(r.tx_hash)}</span>,
        },
        {
          key: "block_number",
          label: "区块",
          render: (r) => <span className="num text-muted-foreground">{r.block_number ?? "—"}</span>,
        },
        { key: "token_type", label: "币种", render: (r) => <Badge variant="outline">{r.token_type || "NMS"}</Badge> },
        { key: "amount", label: "金额", align: "right", render: (r) => <span className="num">{fmtNum(r.amount)}</span> },
        { key: "status", label: "状态", render: (r) => <StatusBadge value={r.status} /> },
        {
          key: "signature_algorithm",
          label: "签名",
          render: (r) =>
            r.signature_algorithm ? (
              <span className="text-[10px] text-emerald-300">{r.signature_algorithm}</span>
            ) : (
              <span className="text-[10px] text-muted-foreground">历史无签名</span>
            ),
        },
      ]}
    >
      <div className="mt-3 grid gap-2 lg:grid-cols-3">
        <SectionCard title="账本哈希链" desc="prevHash 串联，可全量校验" icon={Signal}>
          {chainError ? (
            <p className="text-[10px] text-rose-300">验签接口异常：{chainError}</p>
          ) : !chain ? (
            <p className="text-[10px] text-muted-foreground">{isServer ? "读取中…" : "需服务端模式"}</p>
          ) : (
            <div className="space-y-1.5">
              <div className="grid grid-cols-3 gap-1.5 text-center">
                {[
                  {
                    k: "哈希链",
                    v: chain.chain?.ok ? "完整" : "断裂",
                    c: chain.chain?.ok ? "text-emerald-300" : "text-rose-300",
                  },
                  { k: "链长度", v: chain.chain?.length ?? 0, c: "text-foreground" },
                  {
                    k: "签名通过",
                    v: `${chain.valid}/${chain.checked}`,
                    c: chain.invalid ? "text-rose-300" : "text-emerald-300",
                  },
                ].map((x) => (
                  <div key={x.k} className="glass-soft rounded-lg py-1.5">
                    <p className="text-[8px] text-muted-foreground">{x.k}</p>
                    <p className={`num text-[12px] font-semibold ${x.c}`}>{x.v}</p>
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-muted-foreground">
                历史无签名交易 {chain.legacyUnsigned} 笔（早于 KMS 接入，仅哈希校验）
              </p>
            </div>
          )}
        </SectionCard>

        <SectionCard title="签名后端" desc="KMS 运行状态" icon={Cpu}>
          {!kms ? (
            <p className="text-[10px] text-muted-foreground">{isServer ? "读取中…" : "需服务端模式"}</p>
          ) : (
            <div className="space-y-1">
              {[
                ["算法", (kms.activeAlgorithm || "").toUpperCase()],
                ["后端", kms.provider],
                ["平均签名", `${kms.stats?.avgSignMs ?? 0}ms`],
                ["检查点", kms.checkpoints],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="num">{v}</span>
                </div>
              ))}
              <Badge variant={kms.pqcAvailable ? "success" : "warning"} className="mt-1">
                {kms.pqcAvailable ? "后量子签名已启用" : "降级 Ed25519"}
              </Badge>
            </div>
          )}
        </SectionCard>

        <SectionCard title="风险信号" desc="由真实交易数据计算" icon={AlertTriangle}>
          <div className="space-y-1">
            {risks.map((r) => (
              <div key={r.text} className="flex items-start gap-1.5 rounded-lg bg-white/[0.02] px-2 py-1.5">
                <span className={`mt-0.5 text-[10px] ${riskTone[r.level]}`}>●</span>
                <p className="text-[10px] leading-relaxed text-muted-foreground">{r.text}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="mt-3">
        <SectionCard title="资金分布" desc="用户余额与冻结资金" icon={Activity}>
          <ModuleState
            loading={balLoading}
            error={balError}
            empty={balances.length === 0}
            onRetry={refreshBal}
            emptyHint="暂无余额记录"
            skeletonRows={3}
          >
            <div className="space-y-1">
              {balances.slice(0, 6).map((b) => (
                <div key={b.id} className="flex items-center gap-2 rounded-lg bg-white/[0.02] px-2 py-1.5">
                  <span className="truncate text-[10px] text-muted-foreground">{b.user_email}</span>
                  <span className="num ml-auto text-[11px] text-cyan-200">{fmtNum(b.available_nms)} NMS</span>
                  {Number(b.locked_nms) > 0 && (
                    <span className="num text-[9px] text-amber-300">冻结 {fmtNum(b.locked_nms)}</span>
                  )}
                </div>
              ))}
            </div>
          </ModuleState>
        </SectionCard>
      </div>

      {txError && (
        <div className="mt-2">
          <ModuleState loading={false} error={txError} onRetry={refreshTx} empty={false}>
            <span />
          </ModuleState>
        </div>
      )}
    </ModuleShell>
  );
}
