import React, { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Mic, Search, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";

/** 可被搜索的模块（名称 100 分 > 关键词 50 分 > 包含 20 分） */
const MODULES = [
  { name: "钱包", keywords: ["wallet", "余额", "子账户", "转账", "收款", "释放"], page: "Wallet" },
  { name: "支付中心", keywords: ["支付", "扫码", "pay", "收款码", "打赏"], page: "PaymentCenter" },
  { name: "AI商城", keywords: ["nft", "商城", "rwa", "合成", "版税", "商品"], page: "NFTMarket" },
  { name: "DEX交易所", keywords: ["dex", "兑换", "swap", "k线", "订单簿", "杠杆"], page: "DEXTrading" },
  { name: "AI量化", keywords: ["量化", "策略", "alpha", "回测", "套利"], page: "QuantDashboard" },
  { name: "监控中心", keywords: ["监控", "熔断", "审计", "风控"], page: "Monitor" },
  { name: "元Social", keywords: ["社交", "聊天", "dao", "动态", "红包"], page: "Social" },
  { name: "C2C法币", keywords: ["otc", "法币", "c2c", "承兑", "商家"], page: "OTC" },
  { name: "预测市场", keywords: ["预测", "下注", "yes", "no"], page: "PredictionMarket" },
  { name: "DeFi", keywords: ["defi", "挖矿", "质押", "流动性", "apy"], page: "DeFi" },
  { name: "个人中心", keywords: ["我的", "等级", "推荐", "成就"], page: "Profile" },
  { name: "区块浏览器", keywords: ["浏览器", "区块", "交易查询", "hash"], page: "Explorer" },
  { name: "附近商家", keywords: ["附近", "门店", "地图", "商家"], page: "NearbyMerchants" },
  { name: "AI管家", keywords: ["ai", "管家", "助手"], page: "AIAssistant" },
  { name: "文档中心", keywords: ["文档", "说明", "docs"], page: "Documentation" },
  { name: "白皮书", keywords: ["白皮书", "whitepaper"], page: "Whitepaper" },
];

/** 客服知识库（18 条） */
const KB = [
  { q: "9×9×9 释放是什么", a: "NMS 积分按 999 天线性释放，通过消费、推荐、NFT 合成三维度（各 0-9 级，共 27 级）加速，最快 31 天释放完，加速倍数最高 32.2x。" },
  { q: "消费返利比例", a: "消费 1 元获得 1 NMS（1:1），同时自动铸造 RWA 实物 NFT，享永久 10% 版税（推荐人/商家/节点/平台各 2.5%）。" },
  { q: "打赏比例", a: "商家打赏比例可设 5-30%，默认 10%。商家成本为消费额 × 打赏比例，并获双倍返还进入分红池。" },
  { q: "级差奖励", a: "M1-M9 每级级差 8.1%，合计 72.9%；杰出贡献者额外 7.1%。" },
  { q: "VIP 推荐奖励", a: "VIP 推荐人永久获得消费额 20% 的奖励，不随层级衰减。" },
  { q: "如何晋升", a: "按团队人数与累计消费双门槛晋升，从金卡到黑金卡 M9，晋升后释放周期按单一真相源自动缩短。" },
  { q: "商家入驻", a: "提交申请 → KYC 实名 → 质押保证金 → 审核确认 → 权限自动开通，共 5 步。" },
  { q: "商家信誉等级", a: "S 级需质押 ≥¥100,000 且 ≥500 笔；A 级 ¥50,000/200 笔；B 级 ¥30,000/100 笔；C 级 ¥10,000/30 笔；D 级待评级。" },
  { q: "RWA 确权流程", a: "5 步：基本信息 → 图片上传 → 法律公证+AI 合规+DOI 存证+多签 → 版税设置 → 确认上链（冻结 10% 保证金）。" },
  { q: "NFT 合成", a: "3 个同稀有度 NFT 合成 1 个高阶 NFT，价值提升 25%，NFT 合成维度 +1（最高 9 级）。" },
  { q: "个人发布 NFT", a: "按发行总价锁定 25-45% 的 NMS 作为价值背书，锁定部分计入 locked_nms。" },
  { q: "消费凭证上链", a: "销毁消费额 25-45% 的 NMS，同时 1:1 返还消费额，凭证可作为交易标的或合成材料。" },
  { q: "AI 熔断阈值", a: "全网波动 >25% 暂停跨链；矿池风险 >75 撤回安全池；合约审计告警冻结资产；桥延迟 >30min 暂停通道。" },
  { q: "Gas 费用", a: "全站 0 Gas，交易手续费由平台补贴池承担。" },
  { q: "量子安全", a: "钱包与交易签名采用 ML-KEM-768 + ML-DSA-65，所有链上交易携带 quantum_signature 与 signature_time_ms。" },
  { q: "OTC 担保", a: "平台 Escrow 锁定卖家代币，买家付款确认后放行，15 分钟倒计时，争议由 DAO 3/5 多签仲裁。" },
  { q: "四代币", a: "NMS 绿色积分（19万亿→1.9亿）、ACS 稳定币（弹性发行）、YSE 收益币（5亿）、GCP 治理币（2.1亿）。" },
  { q: "Agentic 钱包", a: "Web4.0 AI+ZK 框架，自托管多链，Agent 一等公民但无资产转移权，私钥永不离开本地设备。" },
];

function score(module, q) {
  const query = q.toLowerCase().trim();
  if (!query) return 0;
  if (module.name.toLowerCase() === query) return 100;
  if (module.keywords.some((k) => k === query)) return 50;
  if (module.name.toLowerCase().includes(query)) return 60;
  if (module.keywords.some((k) => k.includes(query) || query.includes(k))) return 20;
  return 0;
}

/** AI 智能搜索（评分搜索 + 语音 + 任务执行 + 客服知识库 + LLM 兜底） */
export default function AISmartSearch() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);

  const results = useMemo(
    () =>
      MODULES.map((m) => ({ ...m, score: score(m, q) }))
        .filter((m) => m.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5),
    [q]
  );

  const run = async (text) => {
    const query = (text ?? q).trim();
    if (!query) return;

    // 1. 导航指令
    const top = MODULES.map((m) => ({ ...m, s: score(m, query) })).sort((a, b) => b.s - a.s)[0];
    if (top && top.s >= 60 && /打开|进入|去|跳转|open/i.test(query)) {
      navigate(createPageUrl(top.page));
      setAnswer(`已为你打开「${top.name}」。`);
      return;
    }

    // 2. 知识库
    const hit = KB.find((k) => k.q.includes(query) || query.includes(k.q) || k.q.includes(query.slice(0, 4)));
    if (hit) {
      setAnswer(hit.a);
      return;
    }

    // 3. LLM 兜底
    setLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({ prompt: query });
      setAnswer(res);
    } catch (e) {
      setAnswer("暂时无法回答，请换个说法试试。");
    } finally {
      setLoading(false);
    }
  };

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setAnswer("当前浏览器不支持语音识别，请使用 Chrome / Edge。");
      return;
    }
    const rec = new SR();
    rec.lang = "zh-CN";
    rec.interimResults = false;
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setQ(text);
      run(text);
    };
    recRef.current = rec;
    rec.start();
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-cyan-300" />
          <h3 className="text-sm font-semibold">AI 智能搜索</h3>
          <Badge variant="purple">四级响应</Badge>
        </div>

        <div className="mt-2 flex gap-1.5">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索功能，或提问「9×9×9 释放是什么」"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && run()}
              className="h-9 pl-8 text-xs"
            />
          </div>
          <Button size="icon" variant={listening ? "success" : "secondary"} onClick={startVoice} aria-label="语音">
            <Mic className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={() => run()} disabled={loading}>
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "搜索"}
          </Button>
        </div>

        {results.length > 0 && (
          <div className="mt-2 space-y-1">
            {results.map((r) => (
              <button
                key={r.page}
                type="button"
                onClick={() => navigate(createPageUrl(r.page))}
                className="flex w-full items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-1.5 text-left hover:border-cyan-400/30"
              >
                <span className="text-[11px]">{r.name}</span>
                <span className="num text-[9px] text-muted-foreground">匹配度 {r.score}</span>
              </button>
            ))}
          </div>
        )}

        {answer && (
          <div className="mt-2 rounded-xl border border-white/10 bg-black/20 p-2.5">
            <p className="whitespace-pre-wrap text-[11px] leading-relaxed text-muted-foreground">{answer}</p>
          </div>
        )}

        <p className="mt-2 text-[10px] text-muted-foreground">
          响应顺序：导航指令 → 模块搜索 → 客服知识库（18 条）→ LLM 兜底
        </p>
      </CardContent>
    </Card>
  );
}
