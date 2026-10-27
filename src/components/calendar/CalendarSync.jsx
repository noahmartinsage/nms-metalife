import React from "react";
import { CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const pad = (n) => String(n).padStart(2, "0");

const toICSDate = (d) =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(
    d.getUTCMinutes()
  )}00Z`;

/**
 * 日历同步（技术白皮书第 8 章 CalendarSync）
 * 生成 RFC 5545 .ics 文件，可导入 iOS 日历 / Google Calendar / Outlook
 */
export default function CalendarSync({ events = [], label = "同步到日历", filename = "nms-events", className }) {
  const exportICS = () => {
    if (!events.length) {
      toast.error("暂无可同步的日程");
      return;
    }
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//NMS MetaLife//CalendarSync//CN",
      "CALSCALE:GREGORIAN",
    ];

    events.forEach((e, i) => {
      const start = new Date(e.date);
      const end = new Date(start.getTime() + (e.durationMin || 30) * 60000);
      lines.push(
        "BEGIN:VEVENT",
        `UID:nms-${Date.now()}-${i}@nms.ai`,
        `DTSTAMP:${toICSDate(new Date())}`,
        `DTSTART:${toICSDate(start)}`,
        `DTEND:${toICSDate(end)}`,
        `SUMMARY:${(e.title || "NMS 事件").replace(/[\r\n]/g, " ")}`,
        `DESCRIPTION:${(e.desc || "").replace(/[\r\n]/g, " ")}`,
        e.location ? `LOCATION:${e.location}` : "",
        "END:VEVENT"
      );
    });

    lines.push("END:VCALENDAR");

    const blob = new Blob([lines.filter(Boolean).join("\r\n")], {
      type: "text/calendar;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`已导出 ${events.length} 个日程（.ics）`);
  };

  return (
    <Button size="sm" variant="outline" onClick={exportICS} className={cn(className)}>
      <CalendarPlus className="h-3.5 w-3.5" /> {label}
    </Button>
  );
}
