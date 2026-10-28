import React, { useMemo, useState } from "react";
import { Gavel, Plus, ThumbsDown, ThumbsUp, Timer, Users, Vote } from "lucide-react";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { useSession } from "@/hooks/useSession";
import { fmtNum } from "@/lib/format";
import { cn } from "@/lib/utils";

const SEED = [
  {
    id: "p1",
    title: "提高西湖区商家补贴比例至 12%",
    type: "参数调整",
    desc: "将区级商家补贴池比例由 10% 上调至 12%，试运行 90 天，资金从 DAO 结余列支。",
    for: 62,
    against: 24,
    abstain: 14,
    votes: 1284,
    amount: 0,
    status: "voting",
    deadline: "2 天后",
  },
  {
    id: "p2",
    title: "从 DAO 资金池拨款 50,000 NMS 举办线下沙龙",
    type: "预算",
    desc: "用于杭州、上海两地共 6 场社区沙龙，含场地、物料与讲师费用，事后公开账目。",
    for: 48,
    against: 38,
    abstain: 14,
    votes: 862,
    amount: 50000,
    status: "voting",
    deadline: "4 天后",
  },
  {
    id: "p3",
    title: "新增 3 名多签委员会成员",
    type: "治理",
    desc: "将多签委员会由 5 人扩容至 8 人，阈值同步调整为 5/8，提升抗单点风险能力。",
    for: 78,
    against: 12,
    abstain: 10,
    votes: 2140,
    amount: 0,
    status: "passed",
    deadline: "已截止",
    signs: 2,
  },
  {
    id: "p4",
    title: "下调 OTC 商家质押门槛至 ¥20,000",
    type: "参数调整",
    desc: "降低中小商家入驻门槛，同时将 C 级商家单笔限额下调至 20,000 NMS。",
    for: 71,
    against: 21,
    abstain: 8,
    votes: 1860,
    amount: 0,
    status: "executed",
    deadline: "已执行",
    signs: 5,
  },
];

const STATUS_META = {
  voting: { label: "投票中", variant: "warning" },
  passed: { label: "已通过", variant: "success" },
  executed: { label: "已执行", variant: "default" },
  rejected: { label: "已否决", variant: "danger" },
};

/** DAO 治理提案与投票（白皮书 8.2 / 技术白皮书 13） */
export default function GovernancePanel() {
  const { balance } = useSession();
  const [proposals, setProposals] = useState(SEED);
  const [activeId, setActiveId] = useState("p1");
  const [myVotes, setMyVotes] = useState({});
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ title: "", type: "参数调整", amount: "0" });

  const active = proposals.find((p) => p.id === activeId) || proposals[0];
  const weight = balance?.gcp_balance || 0;

  const stats = useMemo(() => {
    const total = proposals.length;
    return {
      total,
      voting: proposals.filter((p) => p.status === "voting").length,
      passed: proposals.filter((p) => p.status !== "voting").length,
      participation: Math.round(
        (proposals.reduce((s, p) => s + p.votes, 0) / (total * 3000)) * 100
      ),
    };
  }, [proposals]);

  const vote = (side) => {
    if (!weight) {
      toast.error("GCP 余额为 0，无法投票");
      return;
    }
    if (myVotes[active.id]) {
      toast.error("该提案你已投过票");
      return;
    }
    const delta = Math.max(1, Math.round(weight / 10));
    setProposals((list) =>
      list.map((p) =>
        p.id === active.id
          ? {
              ...p,
              for: side === "for" ? p.for + delta : p.for,
              against: side === "against" ? p.against + delta : p.against,
              abstain: side === "abstain" ? p.abstain + delta : p.abstain,
              votes: p.votes + 1,
            }
          : p
      )
    );
    setMyVotes((m) => ({ ...m, [active.id]: side }));
    toast.success(`投票成功，权重 ${fmtNum(weight)} GCP`);
  };

  const create = () => {
    if (!form.title.trim()) {
      toast.error("请填写提案标题");
      return;
    }
    const id = `p${Date.now()}`;
    setProposals((list) => [
      {
        id,
        title: form.title.trim(),
        type: form.type,
        desc: "由社区成员发起，等待投票与多签执行。",
        for: 0,
        against: 0,
        abstain: 0,
        votes: 1,
        amount: Number(form.amount) || 0,
        status: "voting",
        deadline: "7 天后",
      },
      ...list,
    ]);
    setActiveId(id);
    setCreateOpen(false);
    setForm({ title: "", type: "参数调整", amount: "0" });
    toast.success("提案已提交，进入 7 天投票期");
  };

  return (
    <SectionCard
      title="DAO 治理"
      desc={`提案 → 讨论 → GCP 投票 → 多签执行 → 链上记录`}
      icon={Gavel}
      actions={
        <Button size="sm" variant="outline" onClick={() => setCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> 发起提案
        </Button>
      }
    >
      <div className="grid grid-cols-4 gap-1.5 text-center">
        {[
          ["提案总数", stats.total, "text-cyan-300"],
          ["投票中", stats.voting, "text-amber-300"],
          ["已通过", stats.passed, "text-emerald-300"],
          ["投票率", `${stats.participation}%`, "text-violet-300"],
        ].map(([k, v, c]) => (
          <div key={k} className="rounded-lg border border-white/10 bg-white/[0.03] py-1.5">
            <p className={cn("num text-[11px] font-semibold", c)}>{v}</p>
            <p className="text-[9px] text-muted-foreground">{k}</p>
          </div>
        ))}
      </div>

      <div className="mt-2 space-y-1">
        {proposals.map((p) => {
          const meta = STATUS_META[p.status];
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setActiveId(p.id)}
              className={cn(
                "w-full rounded-lg border px-2.5 py-1.5 text-left transition-colors",
                activeId === p.id ? "border-cyan-400/40 bg-cyan-400/[0.07]" : "border-white/5 bg-white/[0.02]"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="line-clamp-1 text-[10px] font-medium">{p.title}</p>
                <Badge variant={meta.variant}>{meta.label}</Badge>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <div className="flex h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                  <span className="bg-emerald-400" style={{ width: `${p.for}%` }} />
                  <span className="bg-rose-400" style={{ width: `${p.against}%` }} />
                  <span className="bg-slate-500" style={{ width: `${p.abstain}%` }} />
                </div>
                <span className="num shrink-0 text-[9px] text-muted-foreground">{p.for}% 赞成</span>
              </div>
            </button>
          );
        })}
      </div>

      {active && (
        <div className="mt-2 rounded-xl border border-white/10 bg-black/20 p-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[11px] font-medium leading-snug">{active.title}</p>
              <p className="mt-0.5 text-[9px] text-muted-foreground">
                {active.type} · {active.votes} 票 · {active.deadline}
                {active.amount > 0 ? ` · 预算 ${fmtNum(active.amount)} NMS` : ""}
              </p>
            </div>
            <Badge variant={STATUS_META[active.status].variant}>{STATUS_META[active.status].label}</Badge>
          </div>
          <p className="mt-1 text-[9px] leading-relaxed text-muted-foreground">{active.desc}</p>

          <div className="mt-2 space-y-0.5">
            {[
              ["赞成", active.for, "bg-emerald-400", "text-emerald-300"],
              ["反对", active.against, "bg-rose-400", "text-rose-300"],
              ["弃权", active.abstain, "bg-slate-500", "text-muted-foreground"],
            ].map(([label, pct, bar, color]) => (
              <div key={label} className="flex items-center gap-2">
                <span className="w-7 shrink-0 text-[9px] text-muted-foreground">{label}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div className={bar} style={{ width: `${pct}%` }} />
                </div>
                <span className={cn("num w-8 shrink-0 text-right text-[9px]", color)}>{pct}%</span>
              </div>
            ))}
          </div>

          {active.status === "voting" && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-[9px]">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Vote className="h-2.5 w-2.5" /> 我的投票权重 {fmtNum(weight)} GCP
                </span>
                {myVotes[active.id] && <span className="text-emerald-300">已投票</span>}
              </div>
              <div className="mt-1 flex gap-1">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => vote("for")}>
                  <ThumbsUp className="h-3 w-3" /> 赞成
                </Button>
                <Button size="sm" variant="outline" className="flex-1" onClick={() => vote("against")}>
                  <ThumbsDown className="h-3 w-3" /> 反对
                </Button>
                <Button size="sm" variant="ghost" onClick={() => vote("abstain")}>
                  弃权
                </Button>
              </div>
            </div>
          )}

          {active.status === "passed" && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-[9px]">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Users className="h-2.5 w-2.5" /> 多签执行进度（3/5）
                </span>
                <span className="num">{active.signs || 0}/5</span>
              </div>
              <Progress value={((active.signs || 0) / 5) * 100} className="mt-1 h-1" />
              <Button
                size="sm"
                className="mt-1.5 w-full"
                onClick={() => {
                  setProposals((list) =>
                    list.map((p) =>
                      p.id === active.id ? { ...p, signs: Math.min(5, (p.signs || 0) + 1) } : p
                    )
                  );
                  toast.success(`多签已签名 ${Math.min(5, (active.signs || 0) + 1)}/5`);
                }}
              >
                <Timer className="h-3 w-3" /> 模拟多签执行
              </Button>
            </div>
          )}

          {active.status === "executed" && (
            <p className="mt-2 flex items-center gap-1 rounded-lg bg-emerald-400/10 px-2 py-1 text-[9px] text-emerald-300">
              <Gavel className="h-2.5 w-2.5" /> 已由 GovernanceContract 执行并上链存证
            </p>
          )}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent onClose={() => setCreateOpen(false)} className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-cyan-300" /> 发起 DAO 提案
            </DialogTitle>
            <DialogDescription>提交后进入 7 天投票期，赞成率 &gt; 50% 且达到法定人数即通过</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <div>
              <Label>提案标题</Label>
              <Input
                className="mt-1 h-9 text-xs"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="如：增设区级商家补贴池"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>类型</Label>
                <Input
                  className="mt-1 h-9 text-xs"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                />
              </div>
              <div>
                <Label>预算（NMS）</Label>
                <Input
                  className="mt-1 h-9 text-xs"
                  type="number"
                  min="0"
                  step="any"
                  value={form.amount}
                  onChange={(e) => {
                    const v = e.target.value;
                    setForm({ ...form, amount: parseFloat(v) < 0 ? "0" : v });
                  }}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              取消
            </Button>
            <Button onClick={create}>提交提案</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SectionCard>
  );
}
