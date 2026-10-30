import React, { useMemo, useState } from "react";
import { RefreshCw, Search } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEntityList } from "@/hooks/useEntity";
import ModuleState from "@/components/common/ModuleState";
import { cn } from "@/lib/utils";

/**
 * 模块外壳：配置驱动的列表页骨架
 *
 * 一次解决「数据绑定 / 加载态 / 错误态 / 空态 / 搜索 / 刷新 / 响应式」六件事，
 * 避免每个页面各写一遍、也避免写漏（写漏就是白屏当正常）。
 *
 * @param {object}   props
 * @param {string}   props.entity       实体名（必填）
 * @param {string}   props.title        页面标题
 * @param {string}   props.subtitle     副标题
 * @param {React.FC} props.icon         图标
 * @param {ReactNode} props.badge       标题徽标
 * @param {object}   props.query        过滤条件
 * @param {string}   props.sort         排序
 * @param {number}   props.limit        条数
 * @param {Array}    props.metrics      [{ label, get(rows), tone }]
 * @param {Array}    props.columns      [{ key, label, render(row), align, width }]
 * @param {Array}    props.searchKeys   可搜索字段
 * @param {Function} props.onRowClick   行点击
 * @param {ReactNode} props.actions     标题右侧动作
 * @param {ReactNode} props.children    表格下方追加内容
 */
export default function ModuleShell({
  entity,
  title,
  subtitle,
  icon,
  badge,
  query = {},
  sort = "-created_date",
  limit = 100,
  metrics = [],
  columns = [],
  searchKeys = [],
  onRowClick,
  actions,
  emptyHint = "暂无数据",
  children,
}) {
  const { data, loading, error, refresh } = useEntityList(entity, query, sort, limit);
  const [keyword, setKeyword] = useState("");

  const rows = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw || searchKeys.length === 0) return data;
    return data.filter((r) =>
      searchKeys.some((k) => String(r[k] ?? "").toLowerCase().includes(kw))
    );
  }, [data, keyword, searchKeys]);

  const tones = {
    cyan: "text-cyan-300",
    emerald: "text-emerald-300",
    amber: "text-amber-300",
    violet: "text-violet-300",
    rose: "text-rose-300",
  };

  return (
    <div className="space-y-4">
      <PageHeader icon={icon} title={title} subtitle={subtitle} badge={badge} actions={actions} />

      {metrics.length > 0 && (
        <div className={cn("grid gap-2", metrics.length >= 4 ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-2 lg:grid-cols-3")}>
          {metrics.map((m) => (
            <div key={m.label} className="glass glass-hover rounded-2xl px-3 py-2.5">
              <p className="text-[10px] text-muted-foreground">{m.label}</p>
              <p className={cn("num mt-0.5 text-[17px] font-semibold", tones[m.tone] || "text-foreground")}>
                {loading ? "—" : m.get(data)}
              </p>
              {m.hint && <p className="mt-0.5 text-[9px] text-muted-foreground">{m.hint}</p>}
            </div>
          ))}
        </div>
      )}

      <SectionCard
        title={`${title}记录`}
        desc={loading ? "加载中…" : `共 ${data.length} 条`}
        icon={icon}
        actions={
          <div className="flex items-center gap-1.5">
            {searchKeys.length > 0 && (
              <div className="relative hidden sm:block">
                <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="搜索"
                  className="h-7 w-32 pl-7 text-[10px]"
                />
              </div>
            )}
            <Button size="sm" variant="ghost" onClick={refresh} disabled={loading}>
              <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
            </Button>
          </div>
        }
      >
        <ModuleState
          loading={loading}
          error={error}
          empty={rows.length === 0}
          onRetry={refresh}
          emptyHint={keyword ? `没有匹配「${keyword}」的记录` : emptyHint}
        >
          <div className="-mx-1 overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/10">
                  {columns.map((c) => (
                    <th
                      key={c.key}
                      className={cn(
                        "whitespace-nowrap px-2 py-1.5 text-[9px] font-medium uppercase tracking-wide text-muted-foreground",
                        c.align === "right" && "text-right"
                      )}
                    >
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={row.id || i}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn(
                      "border-b border-white/[0.04] transition-colors hover:bg-white/[0.03]",
                      onRowClick && "cursor-pointer"
                    )}
                  >
                    {columns.map((c) => (
                      <td
                        key={c.key}
                        className={cn(
                          "px-2 py-1.5 text-[11px] align-middle",
                          c.align === "right" && "text-right",
                          c.className
                        )}
                      >
                        {c.render ? c.render(row) : (row[c.key] ?? "—")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ModuleState>

        {children}
      </SectionCard>
    </div>
  );
}

/** 常用徽标：状态着色 */
export function StatusBadge({ value }) {
  const v = String(value || "").toLowerCase();
  const variant =
    ["confirmed", "completed", "settled", "active", "approved", "auto_approved"].includes(v)
      ? "success"
      : ["failed", "rejected", "refunded", "error"].includes(v)
        ? "danger"
        : ["pending", "pending_second"].includes(v)
          ? "warning"
          : "outline";
  return <Badge variant={variant}>{value || "—"}</Badge>;
}
