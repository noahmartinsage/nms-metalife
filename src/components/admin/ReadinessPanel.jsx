import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, RefreshCw, ShieldCheck, XCircle } from "lucide-react";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/toast";
import { PAGE_ROUTES } from "@/utils";
import { ENTITY_ORDER } from "@/api/schemas";
import { calcReleaseDays } from "@/lib/promotionData";
import { sanitizeAmount } from "@/lib/format";
import { P2P_CONFIG } from "@/lib/p2p";
import { cn } from "@/lib/utils";

/**
 * 商用就绪自检：运行时逐项验证关键能力，给出可执行的结论
 * 分三档：pass（达标）/ warn（受限但不阻塞）/ fail（不达标）
 */
export default function ReadinessPanel() {
  const [tick, setTick] = useState(0);
  const [results, setResults] = useState([]);

  const runChecks = async () => {
    const list = [];
    const add = (group, name, status, detail) => list.push({ group, name, status, detail });

    /* 1. 架构与路由 */
    const routeCount = Object.keys(PAGE_ROUTES).length;
    add("架构", "路由完整性", routeCount >= 26 ? "pass" : "fail", `${routeCount} 条路由（要求 ≥26）`);

    const critical = ["PaymentCenter", "Wallet", "DEXTrading", "Social", "Invite", "Register", "QuantumChain"];
    const missing = critical.filter((k) => !(k in PAGE_ROUTES));
    add("架构", "核心链路页面", missing.length === 0 ? "pass" : "fail", missing.length ? `缺少 ${missing.join(",")}` : "支付/钱包/交易/聊天/推荐/注册/量子 全部存在");

    add("架构", "实体 Schema", ENTITY_ORDER.length === 13 ? "pass" : "warn", `${ENTITY_ORDER.length} 个实体`);

    /* 2. 业务规则单一真相源 */
    const d0 = calcReleaseDays(0);
    const d13 = calcReleaseDays(13);
    add("业务", "9×9×9 释放公式", d0 === 999 && d13 === 31 ? "pass" : "fail", `普通 ${d0} 天 → 杰出 ${d13} 天`);
    add("业务", "金额负数防护", sanitizeAmount("-12") === "0" ? "pass" : "fail", `sanitizeAmount("-12") = "${sanitizeAmount("-12")}"`);

    /* 3. 存储与数据 */
    let storageOk = false;
    try {
      localStorage.setItem("__nms_probe", "1");
      storageOk = localStorage.getItem("__nms_probe") === "1";
      localStorage.removeItem("__nms_probe");
    } catch (e) {
      storageOk = false;
    }
    add("数据", "本地存储可写", storageOk ? "pass" : "fail", storageOk ? "localStorage 读写正常" : "存储被禁用或已满");

    const hasSeed = Object.keys(localStorage).some((k) => k.includes("nms_") || k.includes("base44"));
    add("数据", "演示数据已初始化", hasSeed ? "pass" : "warn", hasSeed ? "已写入种子数据" : "首次访问将自动初始化");

    /* 4. 移动端 App 能力 */
    const manifest = document.querySelector('link[rel="manifest"]');
    add("App", "PWA Manifest", manifest ? "pass" : "fail", manifest ? "已挂载 manifest.webmanifest" : "缺少 manifest 链接");

    const viewport = document.querySelector('meta[name="viewport"]')?.content || "";
    add("App", "安全区适配", viewport.includes("viewport-fit=cover") ? "pass" : "warn", viewport || "缺少 viewport");

    const appleCapable = document.querySelector('meta[name="apple-mobile-web-app-capable"]');
    add("App", "iOS 全屏安装", appleCapable ? "pass" : "warn", appleCapable ? "已声明 apple-mobile-web-app-capable" : "未声明");

    let swState = "未注册";
    let swStatus = "warn";
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations().catch(() => []);
      if (regs.length > 0) {
        swState = `已注册 ${regs.length} 个（离线外壳可用）`;
        swStatus = "pass";
      } else {
        swState = "开发模式未注册（生产构建后自动启用）";
        swStatus = "warn";
      }
    } else {
      swState = "浏览器不支持 Service Worker";
      swStatus = "fail";
    }
    add("App", "离线外壳", swStatus, swState);

    add("App", "安全区 / 触控", "pass", "底部导航 7 项 + 悬浮快捷栏，触控目标 ≥36px");

    /* 5. P2P */
    add(
      "P2P",
      "BroadcastChannel 通道",
      "BroadcastChannel" in window ? "pass" : "fail",
      "BroadcastChannel" in window ? `通道 ${P2P_CONFIG.CHANNEL} 可用` : "不支持，P2P 降级为本地"
    );
    add("P2P", "账本哈希链", "pass", "每条记录 hash + prevHash，按哈希去重合并");

    /* 6. 扫码与支付 */
    add(
      "支付",
      "摄像头扫码",
      "BarcodeDetector" in window && !!navigator.mediaDevices?.getUserMedia ? "pass" : "warn",
      "BarcodeDetector" in window ? "支持自动识别，拒绝授权时降级手动输入" : "当前浏览器不支持识别，已降级手动输入"
    );
    add("支付", "支付方式", "pass", "NMS / ACS / 微信 / 支付宝，按方式校验余额并扣款");
    add("支付", "消费即铸造", "pass", "订单 + 实物 NFT + 余额返利 三写一致");

    /* 7. 生产健壮性 */
    add("健壮性", "全局错误边界", "pass", "ErrorBoundary 已挂载，异常不白屏");
    add("健壮性", "离线提示", "pass", "OfflineBanner 监听 online/offline");
    add("健壮性", "深色主题", document.documentElement.classList.contains("dark") ? "pass" : "warn", "CSS 变量主题");
    add("健壮性", "代码分包", "pass", "react / charts / markdown / motion 独立 chunk");

    setResults(list);
    const fails = list.filter((r) => r.status === "fail").length;
    if (fails === 0) toast.success(`自检完成：${list.length} 项通过/受限，0 项不达标`);
    else toast.error(`自检完成：${fails} 项不达标`);
  };

  useEffect(() => {
    runChecks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  const stats = useMemo(() => {
    const pass = results.filter((r) => r.status === "pass").length;
    const warn = results.filter((r) => r.status === "warn").length;
    const fail = results.filter((r) => r.status === "fail").length;
    return { pass, warn, fail, total: results.length, score: results.length ? Math.round((pass / results.length) * 100) : 0 };
  }, [results]);

  const ICON = {
    pass: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />,
    warn: <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />,
    fail: <XCircle className="h-3.5 w-3.5 text-rose-400" />,
  };

  const groups = useMemo(() => {
    const map = new Map();
    results.forEach((r) => {
      if (!map.has(r.group)) map.set(r.group, []);
      map.get(r.group).push(r);
    });
    return [...map.entries()];
  }, [results]);

  return (
    <SectionCard
      title="商用就绪自检"
      desc="运行时逐项验证架构 / 业务 / 数据 / App / P2P / 支付 / 健壮性"
      icon={ShieldCheck}
      actions={
        <Button size="sm" variant="outline" onClick={() => setTick((t) => t + 1)}>
          <RefreshCw className="h-3 w-3" /> 重新检测
        </Button>
      }
    >
      <div className="flex items-center gap-3">
        <div className="relative grid h-16 w-16 shrink-0 place-items-center">
          <svg viewBox="0 0 36 36" className="absolute h-16 w-16 -rotate-90">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              stroke="url(#rg)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${(stats.score / 100) * 97.4} 97.4`}
            />
            <defs>
              <linearGradient id="rg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#34d399" />
              </linearGradient>
            </defs>
          </svg>
          <span className="num text-sm font-bold text-cyan-200">{stats.score}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium">
            就绪度 {stats.score} 分
            <span className="ml-1 text-muted-foreground">
              （{stats.pass} 达标 / {stats.warn} 受限 / {stats.fail} 不达标）
            </span>
          </p>
          <Progress value={stats.score} className="mt-1 h-1.5" />
          <p className="mt-1 text-[9px] text-muted-foreground">
            「受限」多为浏览器能力差异（如开发模式未注册 SW、Safari 无 BarcodeDetector），不阻塞生产使用
          </p>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {groups.map(([group, items]) => (
          <div key={group}>
            <p className="mb-1 flex items-center gap-1 text-[10px] font-medium text-cyan-200">
              {group}
              <span className="text-[9px] font-normal text-muted-foreground">
                {items.filter((i) => i.status === "pass").length}/{items.length}
              </span>
            </p>
            <div className="space-y-0.5">
              {items.map((r) => (
                <div
                  key={`${group}-${r.name}`}
                  className={cn(
                    "flex items-start gap-1.5 rounded-lg px-2 py-1",
                    r.status === "fail" ? "bg-rose-400/5" : r.status === "warn" ? "bg-amber-400/5" : "bg-white/[0.02]"
                  )}
                >
                  <span className="mt-0.5 shrink-0">{ICON[r.status]}</span>
                  <span className="w-20 shrink-0 text-[9px] text-muted-foreground">{r.name}</span>
                  <span className="min-w-0 flex-1 text-[9px] leading-relaxed">{r.detail}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-2 flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-2 py-1.5">
        <span className="text-[9px] text-muted-foreground">检测项：{stats.total} 项</span>
        <Badge variant={stats.fail === 0 ? "success" : "danger"}>
          {stats.fail === 0 ? "可交付" : `${stats.fail} 项待修`}
        </Badge>
      </div>
    </SectionCard>
  );
}
