import React from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { CalendarClock } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { buildReleaseSchedule, calcReleaseProgress } from "@/lib/engine";
import { fmtNum } from "@/lib/format";

/** 释放计划弹窗（7 日前瞻） */
export default function ReleaseScheduleModal({ open, onOpenChange, balance }) {
  const pending = balance?.pending_release_nms || 0;
  const days = balance?.release_days || 999;
  const p = calcReleaseProgress({ pendingNms: pending, releaseDays: days, elapsedDays: Math.round(days * 0.32) });
  const schedule = buildReleaseSchedule({ pendingNms: pending, releaseDays: days, elapsedDays: Math.round(days * 0.32), days: 7 });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-cyan-300" /> 未来 7 日释放计划
          </DialogTitle>
          <DialogDescription>
            每日释放 {fmtNum(p.dailyRelease, 4)} NMS，按 9×9×9 线性释放，等级提升后可重新计算周期
          </DialogDescription>
        </DialogHeader>

        <div className="h-[150px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={schedule} margin={{ top: 6, right: 4, left: -28, bottom: 0 }}>
              <CartesianGrid stroke="rgba(148,163,184,0.1)" vertical={false} />
              <XAxis dataKey="day" tickFormatter={(v) => `D+${v}`} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: "rgba(13,21,38,0.96)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 10,
                  fontSize: 11,
                }}
                formatter={(v) => [`${v} NMS`, "累计释放"]}
              />
              <Bar dataKey="amount" fill="#22d3ee" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-3 overflow-hidden rounded-xl border border-white/10">
          <table className="w-full text-[11px]">
            <thead className="bg-white/5 text-muted-foreground">
              <tr>
                <th className="px-2 py-1.5 text-left font-medium">日期</th>
                <th className="px-2 py-1.5 text-right font-medium">当日释放</th>
                <th className="px-2 py-1.5 text-right font-medium">剩余待释放</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((s) => (
                <tr key={s.day} className="border-t border-white/5">
                  <td className="px-2 py-1.5">
                    {new Date(Date.now() + s.day * 86400000).toLocaleDateString("zh-CN", {
                      month: "2-digit",
                      day: "2-digit",
                    })}
                  </td>
                  <td className="num px-2 py-1.5 text-right text-emerald-300">{fmtNum(p.dailyRelease, 4)}</td>
                  <td className="num px-2 py-1.5 text-right text-muted-foreground">{fmtNum(s.remaining)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
