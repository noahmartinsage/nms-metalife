import React, { useState } from "react";
import { Cloud, Download, HardDrive, Lock, Upload, Users } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { SectionCard, EmptyState } from "@/components/common/SectionCard";
import { StatCard } from "@/components/common/StatCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import { fmtDate } from "@/lib/format";

const INITIAL = [
  { name: "RWA-确权材料-2026.zip", size: 128, type: "档案", date: "2026-10-21" },
  { name: "门店实景照片.tar.gz", size: 86, type: "图片", date: "2026-10-18" },
  { name: "消费凭证备份.json", size: 2.4, type: "数据", date: "2026-10-16" },
  { name: "白皮书-V13.pdf", size: 6.8, type: "文档", date: "2026-10-12" },
  { name: "量子密钥备份.enc", size: 0.4, type: "密钥", date: "2026-10-09" },
];

export default function CloudStorage() {
  const [files, setFiles] = useState(INITIAL);
  const [encrypt, setEncrypt] = useState(true);
  const [peers, setPeers] = useState(true);

  const used = files.reduce((s, f) => s + f.size, 0);

  return (
    <div className="space-y-4">
      <PageHeader
        icon={Cloud}
        title="元存储"
        subtitle="Hypercore 去中心化存储 · 端对端加密 · 内容哈希上链"
        badge={<Badge variant="success">P2P</Badge>}
        actions={
          <Button
            size="sm"
            onClick={() => {
              const f = {
                name: `上传-${new Date().toISOString().slice(0, 10)}-${files.length + 1}.dat`,
                size: Math.round(Math.random() * 40 + 1),
                type: "上传",
                date: new Date().toISOString().slice(0, 10),
              };
              setFiles((p) => [f, ...p]);
              toast.success("文件已分片存储至 12 个对等节点");
            }}
          >
            <Upload className="h-3.5 w-3.5" /> 上传文件
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard label="已用空间" value={used.toFixed(1)} unit="GB" icon={HardDrive} accent="cyan" />
        <StatCard label="文件数" value={files.length} unit="个" icon={Cloud} accent="emerald" />
        <StatCard label="对等节点" value="12" unit="个" icon={Users} accent="violet" />
        <StatCard label="加密状态" value={encrypt ? "已加密" : "未加密"} icon={Lock} accent="amber" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <SectionCard title="我的文件" desc={`${files.length} 个文件 · ${used.toFixed(1)} GB`} icon={Cloud}>
          <Progress value={(used / 500) * 100} className="h-1.5" />
          <p className="mt-1 text-[9px] text-muted-foreground">共 500 GB 配额（演示）</p>
          <div className="mt-2 space-y-1">
            {files.length === 0 ? (
              <EmptyState title="暂无文件" />
            ) : (
              files.map((f) => (
                <div key={f.name} className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-1.5">
                  <HardDrive className="h-3.5 w-3.5 shrink-0 text-cyan-300" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[10px]">{f.name}</p>
                    <p className="text-[9px] text-muted-foreground">
                      {f.type} · {fmtDate(f.date)}
                    </p>
                  </div>
                  <span className="num shrink-0 text-[9px] text-muted-foreground">{f.size} MB</span>
                  <button
                    type="button"
                    onClick={() => toast.success("已开始下载（演示）")}
                    className="shrink-0 rounded p-1 text-muted-foreground hover:text-foreground"
                    aria-label="下载"
                  >
                    <Download className="h-3 w-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard title="存储设置" icon={Lock}>
          <div className="flex items-center justify-between border-b border-white/5 py-2">
            <div>
              <p className="text-[11px]">端对端加密</p>
              <p className="text-[9px] text-muted-foreground">Kyber-768 + AES-256-GCM</p>
            </div>
            <Switch checked={encrypt} onCheckedChange={setEncrypt} />
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-[11px]">对等节点冗余</p>
              <p className="text-[9px] text-muted-foreground">文件分片存储于 12 个节点</p>
            </div>
            <Switch checked={peers} onCheckedChange={setPeers} />
          </div>
          <div className="mt-2 rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-[10px] leading-relaxed text-muted-foreground">
            文件内容经 SHA-256 计算哈希并上链存证，任何篡改都会导致哈希不匹配。私钥与解密材料永不离开本地设备。
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
