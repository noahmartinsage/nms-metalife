import React, { useEffect, useState } from "react";
import { Cloud, Database, HardDrive, RefreshCw, Server, Upload } from "lucide-react";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { API_MODE, base44, localClient } from "@/api/base44Client";
import { ENTITY_ORDER } from "@/api/schemas";
import { fmtNum } from "@/lib/format";

/**
 * 数据后端面板：展示运行模式（localStorage / SQLite 服务端），
 * 支持把本地演示数据一键迁移到服务端数据库。
 */
export default function BackendPanel() {
  const [health, setHealth] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const isServer = API_MODE === "server";

  const probe = async () => {
    if (!isServer || typeof base44.health !== "function") return;
    try {
      const h = await base44.health();
      setHealth(h);
      setError("");
    } catch (e) {
      setHealth(null);
      setError(String(e.message || e));
    }
  };

  useEffect(() => {
    probe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const migrate = async () => {
    if (!isServer) {
      toast.error("当前为 localStorage 模式，请用 VITE_API_MODE=server 启动");
      return;
    }
    setBusy(true);
    try {
      const payload = {};
      let total = 0;
      for (const name of ENTITY_ORDER) {
        const rows = await localClient.entities[name].list("-created_date", 1000);
        if (rows?.length) {
          payload[name] = rows;
          total += rows.length;
        }
      }
      const res = await base44.bulkSeed(payload);
      toast.success(`已迁移 ${fmtNum(res?.inserted ?? total, 0)} 条记录到 SQLite`);
      probe();
    } catch (e) {
      toast.error(`迁移失败：${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  const resetServer = async () => {
    setBusy(true);
    try {
      await base44.resetDemoData();
      toast.success("服务端数据库已重置为种子数据");
      probe();
    } catch (e) {
      toast.error(`重置失败：${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  const counts = health?.db?.counts || {};

  return (
    <SectionCard
      title="数据后端"
      desc={isServer ? "SQLite 持久化（node:sqlite）· 可迁移至 Cloudflare D1" : "localStorage 模拟层 · 离线可用"}
      icon={isServer ? Server : HardDrive}
      actions={<Badge variant={isServer ? "success" : "outline"}>{isServer ? "server" : "local"}</Badge>}
    >
      <div className="grid grid-cols-3 gap-1.5 text-center">
        {[
          ["运行模式", isServer ? "SQLite" : "LocalStorage", isServer ? "text-emerald-300" : "text-cyan-300"],
          ["实体数", health?.db?.entities ?? ENTITY_ORDER.length, "text-violet-300"],
          ["记录总数", Object.values(counts).reduce((s, v) => s + v, 0), "text-amber-300"],
        ].map(([k, v, c]) => (
          <div key={k} className="rounded-lg border border-white/10 bg-white/[0.03] py-1.5">
            <p className={`num text-[11px] font-semibold ${c}`}>{typeof v === "number" ? fmtNum(v, 0) : v}</p>
            <p className="text-[9px] text-muted-foreground">{k}</p>
          </div>
        ))}
      </div>

      {isServer && (
        <div className="mt-2 rounded-xl border border-white/10 bg-black/20 p-2.5">
          <p className="flex items-center gap-1 text-[10px] font-medium">
            <Database className="h-3 w-3 text-cyan-300" /> 服务端状态
          </p>
          {health ? (
            <>
              <p className="num mt-1 break-all text-[9px] text-muted-foreground">{health.db?.file}</p>
              <div className="mt-1 grid grid-cols-2 gap-x-2 gap-y-0.5">
                {Object.entries(counts).slice(0, 8).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-[9px]">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="num">{v}</span>
                  </div>
                ))}
              </div>
              <p className="mt-1 text-[9px] text-emerald-300">
                已连接 · v{health.version} · {new Date(health.time).toLocaleTimeString("zh-CN", { hour12: false })}
              </p>
            </>
          ) : (
            <p className="mt-1 text-[9px] text-rose-300">
              {error || "未连接"} · 请先运行 npm run server
            </p>
          )}
        </div>
      )}

      {!isServer && (
        <div className="mt-2 rounded-xl border border-amber-400/20 bg-amber-400/5 p-2.5 text-[9px] leading-relaxed text-amber-200/90">
          当前数据存在浏览器 localStorage。要启用真正的服务端数据库：
          <span className="num ml-1 rounded bg-black/30 px-1">npm run server</span>
          <span className="num ml-1 rounded bg-black/30 px-1">VITE_API_MODE=server npm run dev</span>
        </div>
      )}

      <div className="mt-2 grid grid-cols-2 gap-1.5">
        <Button size="sm" variant="outline" onClick={migrate} disabled={busy || !isServer}>
          <Upload className="h-3 w-3" /> 迁移本地数据
        </Button>
        <Button size="sm" variant="ghost" onClick={resetServer} disabled={busy || !isServer}>
          <RefreshCw className="h-3 w-3" /> 重置服务端
        </Button>
      </div>

      <div className="mt-2 flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-2 py-1.5 text-[9px]">
        <span className="flex items-center gap-1 text-muted-foreground">
          <Cloud className="h-2.5 w-2.5" /> 部署目标：Cloudflare Workers + D1（同一套 SQL 方言）
        </span>
        <span className="num text-muted-foreground">:8787</span>
      </div>
    </SectionCard>
  );
}
