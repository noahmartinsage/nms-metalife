# NMS MetaLife — 技术架构设计文档 V9.1

> 公链四层架构 · 全栈模块技术实现详解 · DEX订单簿+一键兑换 · 多方式注册 · 统一推荐系统(单一真相源) · C2C法币OTC(担保+倒计时+图片聊天+日历同步) · AI智能搜索 · 9×9×9释放(999→31天) · VIP/商家大礼包(75%现金+25%NMS+首购翻倍赠送+9×9×9自动释放) · OTC商家审核+实时质押+双信誉等级+审核通过自动开通大礼包 · 团队增长可视化 · RWA交易市场融合AI商城 · 袾数输入防护 · 社交P2P化化 · 模块融合 · 复现参考

---

## 1. 系统总体架构

```
┌──────────────────────────────────────────────────────────┐
│                    用户层 (React SPA)                      │
│  Home · PaymentCenter · Wallet · NFTMarket · QuantDashboard │
│  DEXTrading ★ · Monitor · Social · Discover · AIAssistant   │
│  DeFi · PredictionMarket · Profile · Documentation          │
├──────────────────────────────────────────────────────────┤
│                  Base44 BaaS (后端即服务)                   │
│  实体存储 · 多方式认证(手机/邮箱/钱包) · 集成(LLM/Upload)    │
│  实时订阅 · AI量化 · 跨链桥接                               │
├──────────────────────────────────────────────────────────┤
│                    公链协议层                               │
│  RWA确权 · NFT1155/721 · CLOB订单簿(Hyperliquid L2)        │
│  AMM(Lighter) · AI风控熔断 · DAO治理 · 跨链桥(LayerZero)    │
│  DID身份 · 量子签名(Kyber-768) · 多周期K线                   │
├──────────────────────────────────────────────────────────┤
│                    共识与网络层                              │
│  PoS+AI验证 · 多签委员会 · Hyperswarm P2P · Kyber-768       │
│  Hyperliquid L2(21K TPS) · Lighter AMM · LayerZero         │
└──────────────────────────────────────────────────────────┘
```

## 2. 公链四层架构详解

### L1 网络层

- **Hyperswarm DHT**：去中心化节点发现，无中心服务器依赖。
- **Hypercore**：append-only log，钱包与社交数据去中心化存储同步。
- **Kyber-768**：抗量子 KEM，钱包公钥与交易签名。
- **0 Gas 机制**：交易手续费由平台补贴池承担，用户零成本。

### L2 共识层

- **PoS + AI 验证**：节点质押 NMS 出块，Minara-AI 评估节点行为，异常降权。
- **多签委员会**：RWA 确权、跨链大额调度需 3/5 多签。
- **区块结构**：每笔交易携带 `quantum_signature` + `signature_time_ms`。

### L3 协议层

| 协议 | 合约 | 触发条件 |
|------|------|----------|
| RWA 确权 | RWAMintContract | 商家上架 → 5 步流程 |
| NFT 版税 | RoyaltyDistributor | NFT 二次转售 |
| AI 熔断 | CircuitBreaker | 风险评分超阈值 |
| DAO 治理 | GovernanceContract | 提案投票通过 |
| 跨链桥 | LayerZeroBridge | 资产跨链调度 |

### L4 应用层

React + Tailwind + shadcn/ui，通过 Base44 SDK (`@/api/base44Client`) 访问实体与集成。

## 3. 数据模型（实体）

| 实体 | 核心字段 | 用途 |
|------|----------|------|
| Transaction | tx_hash, quantum_signature, gas_fee=0 | 链上交易记录 |
| NFTItem | nft_type, royalty_*, dividend_earned | NFT 资产 |
| MerchantStore | tip_ratio, *_nft_pool, *_nft_reserved | 商家与分红池 |
| PaymentOrder | tip_ratio, merchant_consumed, user_reward | 消费订单 |
| UserBalance | available_nms, pending_release_nms, major_level | 用户余额与等级 |
| WalletAccount | account_type, nms/acs/yse/gcp_balance | 五子账户 |
| TradingStrategy | type, win_rate, pnl, risk_level | 量化策略 |
| LiquidityPool | token_a/b, reserve_*, apy | 流动性池 |
| DataAsset | asset_type, data_hash, nft_token_id | 数据资产 NFT |
| DAORegion | region_code, level, dao_fund | 区划 DAO |
| ChatMessage | region_code, message_type, is_pinned | 社交消息 |
| RedPacket | total_amount, type, status | 红包 |
| PromotionLevel | level_name, reward_ratio, level_diff_ratio | 等级体系 |

## 4. RWA 确权技术实现

### 4.1 流程状态机

```
[基本信息] → [图片上传] → [RWA确权] → [版税设置] → [确认上链] → [完成]
                              │
                              ├─ 法律文件上传 (UploadFile)
                              ├─ AI 合规审核 (InvokeLLM → score/approved/risks)
                              ├─ DOI 存证生成 (哈希)
                              ├─ 多签委员会审核 (3/5)
                              └─ VC 凭证颁发
```

### 4.2 AI 合规审核 Schema

```json
{
  "type": "object",
  "properties": {
    "score": { "type": "number" },
    "approved": { "type": "boolean" },
    "risks": { "type": "array", "items": { "type": "string" } },
    "suggestion": { "type": "string" }
  }
}
```

### 4.3 保证金机制

上架自动冻结 `单价 × 数量 × 10%` NMS 作为保证金，保障买家权益。

## 5. AI 风控熔断技术实现

### 5.1 风险评分模型

```
风险评分 = w1×流动性波动 + w2×矿池风险 + w3×合约审计 + w4×跨链延迟
```

### 5.2 熔断触发与执行

| 评分区间 | 状态 | 自动动作 |
|----------|------|----------|
| 0-50 | 正常 | 无 |
| 50-75 | 警戒 | 发送风险通知 |
| 75-90 | 熔断 | 撤回高风险矿池资产至安全池 |
| 90-100 | 紧急 | 暂停所有跨链调度 + 冻结 |

### 5.3 组件

`AICircuitBreaker`（Monitor 页）+ `AutoRiskExecutor` + `QuantumRiskDashboard` + `AssetMonitorCenter`。

## 6. 链上资产仪表盘

`OnChainAssetDashboard` 组件（首页集成）：
- 实时显示 NMS/ACS/YSE/GCP 四代币余额。
- recharts 图表展示 7 日资产收益增长曲线。
- 一键质押 / 解质押操作。

## 7. P2P 社交技术栈

- **Hyperswarm DHT**：节点发现。
- **Hypercore / Hyperbee / Hyperdrive / Autobase**：去中心化数据。
- **DID + Kyber-768**：身份与端对端加密。
- **P2PWalletHub**：多链钱包，Rabby 式安全检测。

## 8. 前端路由与布局

- `App.jsx`：路由根，AuthProvider + QueryClientProvider + BrowserRouter + Toaster。
- `pages.config.js`：旧页面配置循环（新页面需显式 `<Route>`）。
- 移动端底部导航 `BottomNav`，桌面端 `Layout` 头部导航。

## 9. 模块合并说明（V8.0）

| 原模块 | 合并/迁移至 | 原因 |
|--------|-------------|------|
| 社交页-RWA权证 | 发现页 | 资产类功能归发现 |
| 社交页-RWA交易市场 | AI商城页 | 交易归商城 |
| 社交页-DAO资产池 | 发现页 | 资产类功能归发现 |
| 社交页-P2P社区聊天 | 社交页-P2P社区 | 去重合并 |
| 商家上架(3步) | RWA流程(5步) | 统一确权标准 |

## 10. 个人发布NFT与消费凭证（V8.0）

### 10.1 PersonalNFTPublish 组件

双模式弹窗：
- **发布NFT模式**：拍照/上传 → `UploadFile` + `InvokeLLM`识别 → 表单(名称/价格/数量) → NMS锁定滑块(25-45%) → 上链。
- **消费凭证模式**：上传小票 → `InvokeLLM` OCR识别总额 → 销毁比例滑块(25-45%) → 销毁NMS → 1:1返还。

### 10.2 NMS锁定/销毁经济闭环

```
个人NFT:  锁定 = 总价 × 25-45%  →  随交易释放  →  提升NMS使用率
消费凭证: 销毁 = 总额 × 25-45%  →  通缩        →  1:1返还激励消费
```

## 11. 推荐系统架构（V8.0）

### 11.1 ReferralSystem 组件

- 推荐码生成：`NMS` + 邮箱前6位。
- 推荐链接：`?ref=<code>`，新用户注册自动绑定 `referrer_email`。
- 数据源：`UserBalance` 实体（team_size, direct_referrals, major_level, royalty_earnings_total）。

### 11.2 晋升通道状态机

```
当前等级(M_n) → 检查 team_size >= M_{n+1}.team && total_consumption >= M_{n+1}.consume → 自动晋升
```

### 11.3 结算分红

每笔 `PaymentOrder` 创建时，智能合约按推荐关系自动分配：消费者返利、商家返还、VIP推荐20%、极差72.9%、杰出贡献7.1%、NFT分红池。

## 12. AI预测市场托管（V8.0）

- BetModal 增加 `aiCustody` 状态 + 一键开关。
- AI托管：概率≥85%止盈，≤30%止损。
- 我的持仓页：实时P&L、概率变化、托管状态。

## 13. AI Alpha系统（V8.0）

### 13.1 AlphaSystem 组件

- 六因子雷达（动量/均值回归/流动性/波动率/链上情绪/跨链价差）。
- `InvokeLLM` 生成Alpha信号（pair/direction/confidence/reason）。
- 一键总开关 + 自动执行开关。
- 30日回测曲线（Alpha vs 基准）。

## 14. DEX交易所架构（V8.2）

### 14.1 组件结构

```
pages/DEXTrading.jsx (主页面)
├── components/dex/CandlestickChart.jsx   — 多周期K线
├── components/dex/OrderBook.jsx          — 订单簿(买卖盘)
├── components/dex/RecentTrades.jsx       — 最近成交
├── components/dex/TradePanel.jsx         — 限价/市价/杠杆面板
├── components/dex/AITradingAssistant.jsx — AI交易助手
└── components/gamification/DailyChallenges.jsx
```

### 14.2 Hyperliquid L2 撮合引擎

```
用户下单
  ↓
TradePanel (限价/市价)
  ↓
L2排序器 (链下撮合, 21K TPS)
  ↓
订单簿内存匹配 (OrderBook组件实时展示)
  ↓
批量提交 → L1结算 (量子签名验证)
  ↓
WebSocket推送 → K线/订单簿/成交 实时更新
```

**CandlestickChart**：recharts `ComposedChart` + 自定义 `CandleShape`，7个周期(1m~1W)切换，60根K线，涨跌颜色区分。

**OrderBook**：生成12档买卖盘，累计深度条(`bg-emerald/red-500/10`宽度按累计量)，中间价+价差展示。

**RecentTrades**：`setInterval` 2秒推送新成交，保留20条，买绿卖红。

**TradePanel**：限价/市价切换，买/卖切换，价格+数量输入，25/50/75/100%快捷，1-125x杠杆滑块，Hyperliquid L2标识。

### 14.3 Lighter AMM 兑换

一键兑换Tab使用Lighter集中流动性AMM，0滑点大额交易，简化Swap界面。

### 14.4 数据流

```
tradingPairs (静态) → 交易对选择条 → selectedPair/currentPrice state
  ↓
CandlestickChart(pair, currentPrice) → K线渲染
OrderBook(pair, currentPrice) → 订单簿渲染
RecentTrades(pair, currentPrice) → 成交流渲染
TradePanel(pair, currentPrice) → 下单面板
```

---

## 15. 多方式注册架构（V8.2）

### 15.1 组件结构

```
components/user/UserRegistration.jsx (注册弹窗)
├── Step 1: select  — 选择身份(普通/VIP/商家) + 推荐码
├── Step 2: account — 账户验证(手机/邮箱/钱包 三选一)
├── Step 3: payment — 支付(VIP/商家, NMS+现金混合)
└── Step 4: success — 注册成功(获得NMS + 推荐码)
```

### 15.2 三种注册方式

```jsx
const regMethods = [
  { id: "phone",  icon: Phone,  验证: "短信验证码" },
  { id: "email",  icon: Mail,   验证: "邮箱验证码" },
  { id: "wallet", icon: Wallet, 验证: "Web3签名(MetaMask/WalletConnect)" },
];
```

**手机/邮箱**：输入账号 → 发送验证码(60s冷却) → 输入6位验证码 → 验证通过。

**钱包**：一键连接 → 模拟钱包地址绑定 → 免验证码。

### 15.3 状态管理

```jsx
const [step, setStep] = useState("select");     // select→account→payment→success
const [regMethod, setRegMethod] = useState("phone");
const [accountValue, setAccountValue] = useState("");
const [verifyCode, setVerifyCode] = useState("");
const [walletConnected, setWalletConnected] = useState(false);
const canProceedAccount = regMethod === "wallet" ? walletConnected : (accountValue && verifyCode);
```

### 15.4 安全

- Kyber-768 量子加密保护账户信息。
- DID 去中心化身份，账户信息不上链。
- 推荐码绑定 `UserBalance.referrer_email`。

---

## 16. 模块融合架构（V8.2）

### 16.1 融合原则

- **同功能域合并**：功能重叠的组件统一到同一父组件的Tab中。
- **入口统一**：每个功能域一个页面入口，Tab内切换子功能。
- **组件保留**：原组件文件保留，通过Tab组织，不破坏现有导入。

### 16.2 融合映射表

| 功能域 | 统一入口 | 融合组件数 | Tab数 |
|--------|----------|-----------|-------|
| 社交 | pages/Social → P2PSocialHub | 11 | 7 |
| DAO聊天 | pages/Social → ChinaRegionChat | 6 | 5 |
| 量化 | pages/QuantDashboard | 15+ | 9 |
| NFT | pages/NFTMarket | 12+ | 6 |
| AI助手 | pages/AIAssistant | 25+ | 11 |
| DEX | pages/DEXTrading | 5 | 2 |
| 支付 | pages/PaymentCenter | 8+ | 4 |
| 监控 | pages/Monitor | 6+ | 4 |

### 16.3 页面路由总览

```
/              → Home (首页仪表盘)
/payment       → PaymentCenter (支付中心)
/wallet        → Wallet (钱包)
/nft           → NFTMarket (NFT市场)
/dex           → DEXTrading (DEX交易所) ★V8.2深化
/quant         → QuantDashboard (量化中心)
/monitor       → Monitor (监控中心)
/social        → Social (社交中心)
/discover      → Discover (发现页)
/ai            → AIAssistant (AI助手)
/defi          → DeFi (DeFi中心)
/prediction    → PredictionMarket (预测市场)
/profile       → Profile (个人中心)
```

---

## 17. 安全与合规

- 量子签名（Kyber-768 / Dilithium）抗量子计算。
- 多签委员会审核关键操作。
- AI 合规审核 + 法律公证双重保障 RWA。
- Rabby 式交易安全检测（无限额度授权告警）。
- 钱包输入数量强制 `min="0"`，禁止负数。

---

## 18. 统一推荐系统架构

### 18.1 useReferral Hook

```js
// src/hooks/useReferral.js — 全局唯一推荐码入口
export function useReferral() {
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(null);

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);
  useEffect(() => {
    if (user?.email)
      base44.entities.UserBalance.filter({ user_email: user.email })
        .then(r => setBalance(r[0] || null)).catch(() => {});
  }, [user?.email]);

  const referralCode = user?.email
    ? "NMS" + user.email.split("@")[0].toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6)
    : "NMSDEMO01";
  const referralLink = `${window.location.origin}?ref=${referralCode}`;

  return { user, balance, referralCode, referralLink };
}
```

### 18.2 组件接入映射

| 组件 | 文件路径 | 接入方式 |
|------|----------|----------|
| ReferralSystem | `src/components/referral/ReferralSystem.jsx` | `useReferral()` 全量 |
| ReferralTopCard | `src/components/profile/ReferralTopCard.jsx` | `useReferral()` 推荐码+链接 |
| ShareCodeCard | `src/components/profile/ShareCodeCard.jsx` | `shareCode` prop由Profile传入 |
| ReferralQRCode | `src/components/referral/ReferralQRCode.jsx` | `useReferral()` 推荐码+链接 |
| UserRegistration | `src/components/user/UserRegistration.jsx` | `useReferral()` 成功页推荐码 |
| Profile | `src/pages/Profile.jsx` | `useReferral()` 传码给ShareCodeCard |

### 18.3 数据流

```
useReferral Hook
  ├── base44.auth.me() → user (当前登录用户)
  ├── base44.entities.UserBalance.filter() → balance (余额+等级)
  ├── referralCode = "NMS" + email前缀
  └── referralLink = origin?ref=code
        ↓
  所有推荐组件共享同一推荐码
  零硬编码、零不一致
```

---

## 19. 多方式注册流程

### 19.1 组件结构

```
UserRegistration (Dialog弹窗)
  ├── Step 1: 身份选择 (普通/VIP/商家)
  ├── Step 2: 账户验证 (手机/邮箱/钱包)
  ├── Step 3: 支付 (NMS比例+现金)
  └── Step 4: 成功 (推荐码+积分)
```

### 19.2 状态管理

```js
const [step, setStep] = useState("select|account|payment|success");
const [selectedType, setSelectedType] = useState(null);     // normal|vip|merchant
const [regMethod, setRegMethod] = useState("phone|email|wallet");
const [accountValue, setAccountValue] = useState("");
const [verifyCode, setVerifyCode] = useState("");
const [countdown, setCountdown] = useState(0);              // 60s倒计时
const [walletConnected, setWalletConnected] = useState(false);
const [nmsPercent, setNmsPercent] = useState(0);            // 0-25%滑块
```

### 19.3 验证码倒计时

```js
useEffect(() => {
  if (countdown <= 0) return;
  const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
  return () => clearTimeout(timer);
}, [countdown]);
```

### 19.4 安全保障

- Kyber-768量子加密：所有账户信息传输加密
- DID去中心化身份：注册即生成DID，不上链明文
- 钱包签名即身份：MetaMask/WalletConnect免验证码
- 账户信息不上链：隐私保护，仅DID哈希上链

---

## 20. DEX交易引擎架构

### 20.1 组件结构

```
DEXTrading (src/pages/DEXTrading.jsx)
  ├── CandlestickChart (src/components/dex/CandlestickChart.jsx)
  │     └── recharts ComposedChart + 自定义蜡烛图
  ├── OrderBook (src/components/dex/OrderBook.jsx)
  │     └── 12档买卖盘 + 累计深度条 + 价差
  ├── RecentTrades (src/components/dex/RecentTrades.jsx)
  │     └── 2秒实时推送成交流
  ├── TradePanel (src/components/dex/TradePanel.jsx)
  │     └── 限价/市价 + 25-100%快捷 + 1-125x杠杆
  └── AITradingAssistant (src/components/dex/AITradingAssistant.jsx)
        └── AI交易建议
```

### 20.2 双引擎模式

| 模式 | 引擎 | 特点 |
|------|------|------|
| 专业交易 | Hyperliquid L2 CLOB | 订单簿撮合，21K TPS，1-125x杠杆 |
| 闪兑 | Lighter AMM | 集中流动性，低滑点，一键兑换 |

### 20.3 K线数据结构

```js
// 7个周期: 1m, 5m, 15m, 1h, 4h, 1d, 1W
const [period, setPeriod] = useState("15m");
// 每根K线: { time, open, high, low, close, volume }
// recharts ComposedChart: Bar(volume) + 自定义蜡烛(open/close)
```

---

## 21. 全栈复现清单

### 21.1 目录结构

```
src/
├── pages/          # 20+页面组件
├── components/
│   ├── ui/         # shadcn/ui基础组件
│   ├── dex/        # DEX交易组件
│   ├── quant/      # 量化组件
│   ├── nft/        # NFT组件
│   ├── social/     # 社交组件
│   ├── dao/        # DAO组件
│   ├── referral/   # 推荐系统组件
│   ├── profile/    # 个人中心组件
│   ├── payment/    # 支付组件
│   ├── merchant/   # 商家组件
│   ├── ai-assistant/ # AI助手组件
│   └── ...
├── hooks/
│   ├── useReferral.js  # 统一推荐Hook
│   └── use-mobile.jsx
├── docs/
│   ├── WHITEPAPER.md
│   └── ARCHITECTURE.md
├── App.jsx         # 路由配置
├── Layout.jsx      # 响应式布局
└── index.css       # 设计Token
base44/
└── entities/       # 16个实体Schema
```

### 21.2 复现检查清单

- [ ] 16个实体Schema创建 (`base44/entities/`)
- [ ] 20+页面路由注册 (`src/App.jsx`)
- [ ] 响应式布局 (`src/Layout.jsx` 移动端底部栏+桌面端头部)
- [ ] 暗色主题Token (`src/index.css` + `tailwind.config.js`)
- [ ] 统一推荐Hook (`src/hooks/useReferral.js`)
- [ ] DEX交易组件 (`src/components/dex/` 4个组件)
- [ ] 多方式注册 (`src/components/user/UserRegistration.jsx`)
- [ ] 量化系统 (`src/components/quant/` 15+组件)
- [ ] NFT生态 (`src/components/nft/` 12+组件)
- [ ] 社交系统 (`src/components/social/` 11+组件)
- [ ] DAO治理 (`src/components/dao/` 6+组件)
- [ ] AI助手 (`src/components/ai-assistant/` 25+组件)
- [ ] 支付系统 (`src/components/payment/` 8+组件)
- [ ] 监控系统 (`src/components/monitor/` 4+组件)
- [ ] 白皮书 (`src/docs/WHITEPAPER.md`)
- [ ] 架构文档 (`src/docs/ARCHITECTURE.md`)

---

## 22. C2C法币OTC交易引擎

### 22.1 组件结构

```
OTC (src/pages/OTC.jsx)
  └── OTCExchange (src/components/otc/OTCExchange.jsx)
        ├── 交易类型切换 (买/卖)
        ├── 法币选择器 (8种: CNY/USD/EUR/JPY/KRW/HKD/SGD/GBP)
        ├── 稳定币选择器 (USDT/USDC/ACS)
        ├── 参考价格展示
        ├── 商家筛选 (搜索+支付方式)
        ├── 商家广告列表 (信誉/限额/支付方式/在线状态)
        ├── 下单弹窗 (金额输入+支付方式选择+担保确认)
        └── 交易状态 (确认→付款中→完成)
```

### 22.2 数据模型

```js
// 商家广告
{
  id, merchant, avatar, orders, rate, price,
  min, max, methods: ["alipay","wechat","bank"],
  online, verified, avgTime
}
```

### 22.3 担保机制与安全保障 (V8.5深化)

- 平台Escrow锁定卖家稳定币
- 买家付款后上传凭证
- 卖家确认后释放
- 量子签名不可篡改
- DAO争议仲裁
- **商家质押保证金**: 100%交易限额等值质押，违约全额赔付
- **实名+企业认证**: KYC实名审核 + 营业执照验证
- **防骗提醒**: 所有交易必须在平台内完成，禁止私下转账
- **商家资格审核**: 申请→KYC→营业执照→质押保证金→平台审核→上线

---

## 23. NMS走势图组件

### 23.1 技术实现

```js
// recharts AreaChart
<AreaChart data={priceData}>
  <Area dataKey="price" stroke="#10b981" fill="url(#gradient)" />
  <ReferenceLine y={guidePrice} stroke="#f59e0b" dasharray="5 5" />
</AreaChart>
```

### 23.2 数据生成

- 30天模拟价格数据(正弦波动+随机噪声)
- 指导价 = 基准价 + 正弦波动
- RMB估值 = 持有量 × 当前价

### 23.3 组件

- `src/components/wallet/NMSPriceChart.jsx`
- Props: `nmsBalance` (持有量)

---

## 24. AI智能搜索架构

### 24.1 模块索引设计

```js
const moduleIndex = [
  { name, route, icon, keywords: [...] },
  // 18个模块，每个含精确关键词(法币/c2c/otc专属OTC，dex/订单簿专属DEX)
];
```

### 24.2 评分搜索算法 (V8.5升级)

```js
// 评分: 精确名称匹配(100) > 名称包含(60) > 关键词精确(50) > 关键词包含(30/20)
const scoreModule = (module, query) => {
  let score = 0;
  if (module.name.toLowerCase() === q) score += 100;
  else if (module.name.toLowerCase().includes(q)) score += 60;
  for (const kw of module.keywords) {
    if (kwLower === q) score += 50;
    else if (kwLower.includes(q)) score += 30;
    else if (q.includes(kwLower)) score += 20;
  }
  return score;
};
// 按评分排序，最高分优先 → 解决"C2C法币交易"误匹配DEX的问题
```

### 24.3 语音识别

```js
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
recognition.lang = "zh-CN";
recognition.onresult = (event) => {
  setQuery(event.results[0][0].transcript);
  // 语音输入后自动发送
  setTimeout(() => handleSend(transcript), 300);
};
```

### 24.4 四级响应 (V8.5升级)

1. **导航指令**：检测"打开/去/找/进入"等词 → 模块评分搜索 → 自动跳转
2. **模块搜索**：评分≥30 → 推荐最相关模块 + 跳转按钮
3. **知识库**：18条FAQ评分匹配(≥30) → 即时回答
4. **LLM兜底**：InvokeLLM调用 → AI生成回答
5. **降级**：LLM失败 → 模块搜索推荐

### 24.4 组件

- `src/components/ai-assistant/AISmartSearch.jsx`

---

## 25. 支付结果分红展示 (元Pay)

### 25.1 数据流

```
扫码支付完成 → onPaymentComplete回调
  → 构建分红数据(消费返利/商家返还/VIP/级差/贡献/NFT池/门店版税)
  → 弹出元Pay PaymentResultModal
  → 展示余额更新+释放计划(9×9×9)+分红明细+门店版税分配
```

### 25.2 分红计算

```js
userReward = amount;                    // 1:1返利
merchantReturn = amount * tipRatio/100 * 2;  // 双倍返还
vipReward = amount * 0.2;              // VIP 20%
levelDiffReward = amount * 0.729;      // 级差 72.9%
contributorReward = amount * 0.071;     // 贡献 7.1%
nftPoolAdd = amount * 0.1;             // NFT池 10%

// 门店版税 (永久10%)
royaltyTotal = amount * 0.1;
royaltyReferrer = royaltyTotal * 0.25;  // 推荐人 2.5%
royaltyMerchant = royaltyTotal * 0.25; // 商家 2.5%
royaltyNode = royaltyTotal * 0.25;      // 节点 2.5%
royaltyPlatform = royaltyTotal * 0.25;  // 平台 2.5%
```

### 25.3 组件

- `src/components/payment/PaymentResultModal.jsx`

---

## 26. V8.4新增路由与组件清单

### 26.1 新增路由

| 路由 | 页面 | 功能 |
|------|------|------|
| /OTC | OTC.jsx | C2C法币交易 |

### 26.2 新增组件

| 组件 | 路径 | 功能 |
|------|------|------|
| OTCExchange | src/components/otc/ | C2C法币兑换 |
| NMSPriceChart | src/components/wallet/ | NMS走势图 |
| AISmartSearch | src/components/ai-assistant/ | AI智能搜索+语音 |
| PaymentResultModal | src/components/payment/ | 支付结果分红 |

### 26.3 修改页面

| 页面 | 修改内容 |
|------|----------|
| App.jsx | 新增/OTC路由 |
| Discover.jsx | 金融交易分类新增C2C入口 |
| Wallet.jsx | 资产Tab顶部新增NMS走势图 |
| AIAssistant.jsx | 新增AI智能搜索Tab(默认激活) |
| PaymentCenter.jsx | 支付完成回调新增结果弹窗 |

---

## 28. DEX一键兑换自动计算 (V8.6)

### 28.1 技术实现

```js
// SwapInterface.jsx - 输入支付数量自动计算接收量
const getExchangeRate = () => {
  const key = `${fromToken.symbol}-${toToken.symbol}`;
  const reverseKey = `${toToken.symbol}-${fromToken.symbol}`;
  if (exchangeRates[key]) return exchangeRates[key];
  if (exchangeRates[reverseKey]) return 1 / exchangeRates[reverseKey];
  return fromToken.price / toToken.price; // 兜底: 价格比
};

const exchangeRate = getExchangeRate();
const toAmount = fromAmount ? (parseFloat(fromAmount) * exchangeRate).toFixed(4) : "";
```

### 28.2 集成

- DEXTrading.jsx兑换Tab使用SwapInterface组件(替换原静态表单)
- 支持5种代币互兑、快捷比例、滑点设置

---

## 29. VIP & 商家大礼包 (V8.6)

### 29.1 组件结构

```
VIPGiftPackage (src/components/home/VIPGiftPackage.jsx)
  ├── 4个礼包卡片 (VIP1/VIP2/VIP3/商家)
  ├── 购买确认弹窗 (权益+价格+支付方式)
  └── 购买成功提示
```

### 29.2 数据模型

```js
const giftPackages = [
  { id, name, icon, color, cashPrice, nmsPrice, desc, privileges: [...] },
  // VIP1: ¥99 + 500 NMS, 释放925天
  // VIP2: ¥499 + 2500 NMS, 释放850天
  // VIP3: ¥1999 + 10000 NMS, 释放776天
  // 商家: ¥2999 + 15000 NMS, 释放701天
];
```

---

## 30. 晋升系统每级释放天数 (V8.6)

### 30.1 计算公式

```js
// PromotionLevelCard.jsx
const calcReleaseDays = (order) => {
  return Math.round(999 - (order / 13) * (999 - 31));
};
// 14个等级(0-13)映射到999→31天
```

### 30.2 推荐结算统一

所有推荐结算(直推20%/级差72.9%/贡献7.1%)均按用户当前等级的释放周期线性释放。

---

## 31. 9×9×9 NMS释放机制深化 (V8.5)

### 27.1 核心参数

```js
const BASE_CYCLE = 999;  // 基础周期(天)
const MIN_CYCLE = 31;    // 最短周期(天)
const MAX_SPEED = 32.2;  // 最大加速(999/31)

// 释放天数计算 (线性插值)
const calcReleaseDays = (totalLevel) => {
  return 999 - (totalLevel / 27) * (999 - 31);
  // totalLevel: 0-27 (消费0-9 + 推荐0-9 + NFT0-9)
};

// 加速倍数
const calcSpeedFactor = (totalLevel) => {
  return 999 / calcReleaseDays(totalLevel);
};
```

### 27.2 三维度九级

| 维度 | 等级 | 提升方式 |
|------|------|----------|
| 消费 | 0-9 | 累计消费金额 |
| 推荐 | 0-9 | 团队规模 |
| NFT | 0-9 | 持有NFT数量 |

- 总等级: 0-27
- 组合数: 9×9×9 = 729种
- 释放周期: 999天(1x) → 31天(32.2x)

### 27.3 组件更新

- `ReleaseScheduleModal.jsx`: 999→31天周期、32.2x加速、729种组合展示
- `NMSIntro.jsx`: 首页释放周期显示更新为"999→31天"

---

## 32. V8.9 深化完善 — 技术实现细节 (2026-07)

### 32.1 VIPGiftPackage 组件架构

```jsx
// 大礼包定价模型
const giftPackages = [
  { id: "gold",      price: 99,  cash: 74,  nms: 25,  bonusNms: 200  },
  { id: "platinum",  price: 199, cash: 149, nms: 50,  bonusNms: 400  },
  { id: "diamond",   price: 499, cash: 374, nms: 125, bonusNms: 1000 },
  { id: "merchant",  price: 499, cash: 374, nms: 125, bonusNms: 1000 },
];

// 推荐人代激活流程
// 1. activateMode = "self" | "referral"
// 2. referral模式下输入下线用户邮箱/DID
// 3. 系统将卡资格+赠送NMS分配到下线账户
// 4. 推荐人享受对应级差奖励(金卡10%/白金15%/钻石20%)
```

### 32.2 OTCChatDialog 实时聊天+倒计时

```jsx
// 倒计时机制 (15分钟)
const [countdown, setCountdown] = useState(900);
useEffect(() => {
  if (!open || orderStatus !== "pending") return;
  const timer = setInterval(() => {
    setCountdown(prev => prev <= 1 ? 0 : prev - 1);
  }, 1000);
  return () => clearInterval(timer);
}, [open, orderStatus]);

// 图片发送 (FileReader → base64)
const sendImage = (e) => {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = () => {
    setMessages(prev => [...prev, { type: "image", content: reader.result }]);
  };
  reader.readAsDataURL(file);
};

// 醒目倒计时UI: 最后5分钟红色脉冲+进度条
```

### 32.3 OTCAuditPanel 质押可视化

```jsx
// 质押进度条
<div className="h-2.5 rounded-full bg-slate-700 overflow-hidden">
  <div
    className={`h-full rounded-full ${
      ratio >= 100 ? "bg-emerald-500" :
      ratio >= 50  ? "bg-amber-500"  : "bg-red-500"
    }`}
    style={{ width: `${ratio}%` }}
  />
</div>
// 强制规则: 100%质押+KYC+营业执照 三项全过才能上架
```

### 32.4 统一推荐系统数据流

```
统一推荐码 (一个用户一个码)
├── 用户层级: 普通用户 → 金卡 → 白金卡 → 钻石卡
├── 商家层级: 商家资格 (优先购买推荐人NMS+额外红包)
├── 黑金卡M1-M9: 100人→1,000,000人团队
└── 奖励明细实时展示: 级差奖励+NMS红包+团队业绩
```

### 32.5 模块交互验证清单

| 模块 | 交互验证点 |
|------|-----------|
| VIPGiftPackage → Wallet | 购买后赠送NMS释放到钱包 |
| VIPGiftPackage → PromotionLevelCard | 购买后卡等级同步更新 |
| PaymentCenter → Wallet | 支付完成后余额刷新 |
| PaymentCenter → PaymentResultModal | 分红明细实时展示 |
| OTCExchange → OTCChatDialog | 下单后打开聊天+倒计时 |
| OTCExchange → OTCAuditPanel | 商家审核状态展示 |
| ReferralQRCode → PromotionLevelCard | 团队人数/级差比例同步 |
| Home → VIPGiftPackage | 首页礼包专区入口 |

---

## 34. V9.1 晋升系统单一真相源 + 信誉等级 + 翻倍NMS技术实现 (2026-07-29)

### 34.1 单一真相源架构

```js
// src/lib/promotionData.js — 晋升系统唯一数据源
export const PROMOTION_TIERS = [ /* 金卡→黑金卡M9→杰出贡献者 共14级 */ ];

// 释放周期公式 (与 PromotionLevelCard/ReleaseScheduleModal 一致)
const calcReleaseDays = (order) => Math.round(999 - (order / 13) * (999 - 31));

// 双键匹配: 实体枚举(M1-M9) + 显示名(金卡/黑金卡M1)
export const findTier = (levelName) =>
  PROMOTION_TIERS.find(c => c.level === levelName || c.matchKey === levelName) || PROMOTION_TIERS[0];
```

消费方统一引用，杜绝多组件各自维护导致数值漂移：
- `ReferralSystem.jsx`: `import { PROMOTION_TIERS, findTier } from "@/lib/promotionData"`
- `PromotionLevelCard.jsx`: 内联同源 `calcReleaseDays` 公式 (后续可迁移至共享)

### 34.2 双维度信誉等级评定

```js
// 商家信誉: 质押保证金 + 交易笔数双门槛
const getMerchantGrade = (deposit, trades) =>
  MERCHANT_REPUTATION_GRADES.find(g => deposit >= g.minDeposit && trades >= g.minTrades) || GRADES.last;

// 用户信誉: 累计消费单维度
const getUserGrade = (consume) =>
  USER_REPUTATION_GRADES.find(g => consume >= g.minConsume) || GRADES.last;
```

OTC列表渲染双标签: `<span>商{mGrade.grade}</span><span>用{uGrade.grade}</span>`，颜色来自等级对象 hex 值 (非Tailwind动态类，避免purge丢失)。

### 34.3 翻倍NMS自动释放链路

```
购买大礼包(¥99/¥199/¥499)
  → 立即激活会员卡资格 (major_level 更新)
  → 翻倍NMS (baseNms×2 = bonusNms) 进入待释放池 (pending_release_nms)
  → 按 releaseDays(925/850/776/701) 线性释放
  → 每日自动到账 available_nms
  → 钱包页 ReleaseScheduleModal 同步显示进度
```

礼包数据结构新增 `baseNms`(原值) + `releaseDays`(释放周期)，UI展示划线原值+翻倍值+×2徽标。

### 34.4 OTC审核通过自动开通大礼包

```jsx
// 审核状态 approved 时自动展示开通提示
{selectedRecord.status === "approved" && (
  <div className="bg-amber-500/10">
    <Gift /> 大礼包购买权限已自动开通
    "审核通过后系统自动授权，享受双倍NMS赠送+9×9×9释放加速"
  </div>
)}
```

实时质押: `<Radio className="animate-pulse" />` + "链上每3秒更新"指示，进度条按 depositRatio 三段着色。

---

## 33. V9.0 模块融合技术实现 (2026-07-28)

### 33.1 脉数输入防护模式

```jsx
// 统一负数防护模式，所有数值输入框采用
<Input
  type="number"
  min="0"
  step="any"
  value={amount}
  onChange={(e) => {
    const v = e.target.value;
    setAmount(parseFloat(v) < 0 ? "0" : v);
  }}
/>
// 涵盖文件: Wallet.jsx, SwapInterface.jsx, OTCExchange.jsx, MerchantDashboard.jsx
```

### 33.2 TeamGrowthChart 组件架构

```jsx
// recharts双线折线图
<LineChart data={monthlyData}>
  <Line dataKey="users" name="用户团队" stroke="#10b981" />
  <Line dataKey="merchants" name="商家团队" stroke="#f59e0b" />
</LineChart>

// 末目晋升进度计算
const nextMilestone = milestones.find(m => m.team > currentTeam);
const progressPct = ((currentTeam - prevMilestone.team) /
  (nextMilestone.team - prevMilestone.team)) * 100;
```

### 33.3 CalendarSync ICS生成

```js
// 生成标准.ics日历文件
const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:${eventId}@nms-metaLife
DTSTART:${formatDate(event.date, event.time)}
SUMMARY:${event.title}
DESCRIPTION:${event.desc}
END:VEVENT
END:VCALENDAR`;
// Blob下载，支持单个和批量同步
```

### 33.4 社交页面P2P化化

- 删除6个非P2P社交标签（ClawAI/元宇宙名片/多语言/链上身份/影响力图谱/跨链声誉）
- 保留7个核心P2P标签：动态广场/P2P社交/隐私加密聊天/P2P社区/数字分身/全国区划/精英俱乐部
- RWA组件（RWADashboard/DAOAssetPool）已剥离至Discover页面
- RWA交易市场（RWASecondaryMarket）已融合进NFTMarket（AI商城）rwamarket标签

### 33.5 RWA 5步流程验证

```
步骤1: 基本信息 (商品名称+打赏比例5-30%+分红率)
步骤2: 图片上传 (FileReader→base64预览)
步骤3: RWA确权 (法律文档上传+InvokeLLM AI合规审核+DOI存证哈哈)
步骤4: 版税设置 (推荐2.5%+商家2.5%+节点2.5%+平台2.5%)
步骤5: 上链确认 (多签公证pending→confirmed)
```

### 33.6 模块合并对照表

| 墀模块 | 保留位置 | 合并方向 |
|---------|---------|---------|
| RWA权证 | Discover页面 | Social→Discover |
| RWA交易市场 | NFTMarket(rwamarket) | Social→AI商城 |
| DAO资产池 | Discover页面 | Social→Discover |
| ClawAI社交 | 删除（冗余） | 社社交 |
| 元宇宙名片 | 删除（冗冗） | 社社交 |
| 多语言协作 | 删除（冗冗） | 社社交 |
| 链上身份 | 删除（冗冗） | 社社交 |
| 影响力图谱 | 删除（冗冗） | 社社交 |
| 跨链声誉 | 删除（冗冗） | 社社交 |

---

*本文档随项目迭代持续更新，配合 `WHITEPAPER.md` 使用。*