# NMS MetaLife — 技术架构白皮书 V10.0

> 公链四层架构 · 全栈功能模块技术实现详解 · 复现参考文档
> 基于当前所有功能模块的完整技术架构设计与实现规范

版本：V11.0　|　更新日期：2026-08-28　|　状态：生产就绪

---

## 目录

1. [系统总体架构](#1-系统总体架构)
2. [公链四层技术架构](#2-公链四层技术架构)
3. [数据模型与实体设计](#3-数据模型与实体设计)
4. [核心功能模块技术实现](#4-核心功能模块技术实现)
5. [商家质押与OTC审核机制](#5-商家质押与otc审核机制)
6. [推荐系统与9×9×9晋升体系](#6-推荐系统与9x9x9晋升体系)
7. [VIP大礼包与翻倍NMS释放](#7-vip大礼包与翻倍nms释放)
8. [日历同步系统](#8-日历同步系统)
9. [AI量化与风控熔断](#9-ai量化与风控熔断)
10. [RWA资产代币化流程](#10-rwa资产代币化流程)
11. [NFT生态与合成系统](#11-nft生态与合成系统)
12. [P2P社交与隐私通信](#12-p2p社交与隐私通信)
13. [DAO治理体系](#13-dao治理体系)
14. [跨链桥接与多链资产](#14-跨链桥接与多链资产)
15. [安全模型与量子签名](#15-安全模型与量子签名)
16. [模块融合与系统整合](#16-模块融合与系统整合)
17. [Web4.0 Agentic钱包架构](#17-web40-agentic钱包架构)
18. [复现与部署指南](#18-复现与部署指南)

---

## 1. 系统总体架构

```
┌──────────────────────────────────────────────────────────────┐
│                    用户层 (React SPA)                          │
│  Home · PaymentCenter · Wallet · NFTMarket · QuantDashboard    │
│  DEXTrading · OTC · Monitor · Social · Discover · AIAssistant  │
│  DeFi · PredictionMarket · Profile · Documentation · Admin     │
├──────────────────────────────────────────────────────────────┤
│                  Base44 BaaS (后端即服务)                       │
│  实体存储 · 多方式认证(手机/邮箱/钱包) · 集成(LLM/Upload/Email)  │
│  实时订阅 · AI量化 · 跨链桥接 · OAuth连接器                      │
├──────────────────────────────────────────────────────────────┤
│                    公链协议层                                   │
│  RWA确权 · NFT1155/721 · CLOB订单簿(Hyperliquid L2)            │
│  AMM(Lighter) · AI风控熔断 · DAO治理 · 跨链桥(LayerZero)         │
│  DID身份 · 量子签名(Kyber-768) · 多周期K线 · 9×9×9释放          │
├──────────────────────────────────────────────────────────────┤
│                    共识与网络层                                  │
│  PoS+AI验证 · 多签委员会 · Hyperswarm P2P · Kyber-768           │
│  Hyperliquid L2(21K TPS) · Lighter AMM · LayerZero              │
└──────────────────────────────────────────────────────────────┘
```

### 技术栈

| 层级 | 技术 | 用途 |
|------|------|------|
| 前端 | React 18 + Vite + Tailwind CSS + shadcn/ui | 单页应用、响应式UI |
| 状态 | @tanstack/react-query + React Context | 数据获取、全局状态 |
| 路由 | react-router-dom v6 | SPA路由 |
| 动画 | framer-motion + three.js | UI动画、3D渲染 |
| 图表 | recharts | 金融图表可视化 |
| 后端 | Base44 BaaS (实体/认证/集成) | 后端即服务 |
| 公链 | 自研四层架构 | 去中心化协议 |

---

## 2. 公链四层技术架构

### L1 网络层

- **Hyperswarm DHT**：去中心化节点发现，无中心服务器依赖
- **Hypercore**：append-only log，钱包与社交数据去中心化存储同步
- **Kyber-768**：抗量子 KEM，钱包公钥与交易签名
- **0 Gas 机制**：交易手续费由平台补贴池承担，用户零成本

```typescript
// 交易结构
interface Transaction {
  tx_hash: string;           // 交易哈希
  block_number: number;      // 区块高度
  from_address: string;      // 发送地址
  to_address: string;        // 接收地址
  amount: number;            // 交易金额
  token_type: "NMS"|"ACS"|"YSE"|"GCP";
  status: "pending"|"confirmed"|"failed";
  gas_fee: number;           // 0 Gas机制
  quantum_signature: string; // Kyber-768量子签名
  signature_time_ms: number; // 签名验证时间(毫秒)
}
```

### L2 共识层

- **PoS + AI 验证**：节点质押 NMS 出块，Minara-AI 评估节点行为，异常降权
- **多签委员会**：RWA 确权、跨链大额调度需 3/5 多签
- **区块结构**：每笔交易携带 `quantum_signature` + `signature_time_ms`

### L3 协议层

| 协议 | 合约 | 触发条件 |
|------|------|----------|
| RWA 确权 | RWAMintContract | 商家上架 → 5 步流程 |
| NFT 版税 | RoyaltyDistributor | NFT 二次转售 |
| AI 熔断 | CircuitBreaker | 风险评分超阈值 |
| DAO 治理 | GovernanceContract | 提案投票通过 |
| 跨链桥 | LayerZeroBridge | 资产跨链调度 |
| 9×9×9释放 | ReleaseAccelerator | 消费/推荐触发 |
| 商家质押 | MerchantStakingContract | 保证金锁定 |

### L4 应用层

React + Tailwind + shadcn/ui，通过 Base44 SDK (`@/api/base44Client`) 访问实体与集成。

---

## 3. 数据模型与实体设计

### 核心实体清单

| 实体 | 用途 | 关键字段 |
|------|------|----------|
| User | 用户(平台内置) | id, email, full_name, role |
| UserBalance | 用户余额与等级 | major_level, release_speed_factor, release_days |
| WalletAccount | 五子钱包 | account_type, nms_balance, kyber_public_key |
| Transaction | 链上交易 | tx_hash, quantum_signature, gas_fee(0) |
| PaymentOrder | 消费订单 | amount, tip_ratio, merchant_return, vip_reward |
| MerchantStore | 商家门店 | deposit, is_verified, dividend_pool |
| NFTItem | NFT资产 | nft_type, royalty_*, synthesis_level |
| PromotionLevel | 晋升等级 | level_name, required_team_size, reward_ratio |
| LiquidityPool | 流动性池 | token_a, token_b, tvl, apy |
| RedPacket | 红包 | total_amount, type, status |
| DataAsset | 数据资产 | asset_type, estimated_value, is_listed |
| DAORegion | DAO区域 | region_code, member_count, dao_fund |
| ChatMessage | 聊天消息 | region_code, message_type, content |
| TradingStrategy | 量化策略 | type, win_rate, pnl, risk_level |

### 实体关系

```
User ─┬─ UserBalance (1:1)
      ├─ WalletAccount (1:N 五子账户)
      ├─ PaymentOrder (1:N 消费记录)
      ├─ NFTItem (1:N 持有NFT)
      └─ DataAsset (1:N 数据资产)

MerchantStore ─┬─ NFTItem (1:N 发行NFT)
               ├─ PaymentOrder (1:N 收款订单)
               └─ User (N:1 所有者)

PromotionLevel ← UserBalance.major_level (枚举匹配)
```

---

## 4. 核心功能模块技术实现

### 4.1 钱包系统 (Wallet.jsx)

**五子账户架构**：
- 主账户(main)、储蓄账户(savings)、交易账户(trading)、质押账户(staking)、消费账户(spending)

**NMS价格趋势** (`NMSPriceChart.jsx`)：
- 30天历史价格正弦波动模拟
- 指导价参考线
- 人民币估值计算
- 实时资产估值

**释放进度** (`ReleaseScheduleModal.jsx`)：
- 9×9×9加速系统可视化
- 999→31天线性释放
- 七日前瞻释放计划
- 收入来源分解

### 4.2 支付中心 (PaymentCenter.jsx)

**扫码付流程**：
1. EnhancedScanPay → CameraScanPay(摄像头扫码)
2. 识别商家二维码 → 拉取MerchantStore
3. 输入金额 → DID手动打赏
4. 链上结算 → PaymentResultModal展示分配

**结算分配逻辑** (以¥100消费为例)：
```
消费者: +100 NMS (1:1返利)
商家成本: -10 NMS (打赏10%)
商家返还: +20 NMS (双倍返还)
VIP推荐人: +20 NMS (永久20%)
级差奖励: 72.9% (级差分配)
杰出贡献: 7.1% (DAO分配)
NFT分红池: +10 NMS (实物+门店)
```

### 4.3 DEX交易 (DEXTrading.jsx)

**订单簿模式 (Hyperliquid L2)**：
- `OrderBook.jsx`：买卖盘深度
- `CandlestickChart.jsx`：多周期K线
- `TradePanel.jsx`：下单面板
- `RecentTrades.jsx`：最近成交
- `AITradingAssistant.jsx`：AI辅助决策

**一键兑换 (SwapInterface.jsx)**：
- AMM模式 (Lighter)
- 滑点配置
- 流动性管理
- 实时汇率计算

### 4.4 NFT市场 (NFTMarket.jsx)

**NFT类型**：
- 实物NFT (physical)：对应线下商品
- 门店NFT (store)：商家股权凭证
- 节点NFT (node)：节点服务凭证
- 个人NFT (personal)：用户发布

**版税分配** (`RoyaltyDistributor`)：
```
永久版税: 10%
├─ 推荐人: 2.5%
├─ 商家: 2.5%
├─ 节点: 2.5%
└─ 平台: 2.5%
```

**合成系统** (`NFTSynthesisSystem.jsx`)：
- 多NFT合成升级
- synthesis_level 0-9
- can_synthesize_with 关联
- synthesized_from 来源追溯

### 4.5 AI量化 (QuantDashboard.jsx)

**策略工作室** (`StrategyStudio.jsx`)：
- 策略类型：套利、收益农场、做市、趋势跟踪、情绪
- 回测系统 (`QuantBacktest.jsx`)
- 可视化编辑器 (`StrategyVisualEditor.jsx`)
- 多智能体竞技场 (`MultiAgentArena.jsx`)

**AI引擎** (`MinaraAIEngine.jsx`)：
- InvokeLLM 集成
- 市场情绪分析
- 策略推荐
- 自动风控熔断

---

## 5. 商家质押与OTC审核机制

### 5.1 商家质押流程 (`MerchantStakingFlow.jsx`)

**5步流程**：
```
提交申请 → KYC实名 → 质押保证金 → 审核确认 → 权限开通
```

**保证金阶梯** (对应信誉等级)：

| 等级 | 质押金额 | 最少交易数 | 权限 |
|------|----------|-----------|------|
| S级 | ¥100,000 | 500 | 顶级展示·无限额 |
| A级 | ¥50,000 | 200 | 推荐·大额通道 |
| B级 | ¥30,000 | 100 | 正常交易 |
| C级 | ¥10,000 | 30 | 限额交易 |

**质押机制**：
- 保证金锁定于 `MerchantStakingContract` 智能合约
- 链上每3秒更新质押状态
- 3/5多签委员会确认
- 违约全额赔付买家

**自动开通权限**：
审核通过后系统自动授权：
1. C2C广告上架权
2. VIP/商家大礼包购买权
3. 9×9×9释放加速 (周期701天)
4. 信誉等级排序展示

### 5.2 OTC审核中心 (`OTCAuditPanel.jsx`)

**双维度信誉等级**：

用户信誉等级 (`USER_REPUTATION_GRADES`)：
| 等级 | 标签 | 消费门槛 |
|------|------|----------|
| VIP3 | 钻石用户 | ≥¥20,000 |
| VIP2 | 白金用户 | ≥¥5,000 |
| VIP1 | 金卡用户 | ≥¥1,000 |
| 普通 | 普通用户 | 未购礼包 |

商家信誉等级 (`MERCHANT_REPUTATION_GRADES`)：
| 等级 | 标签 | 质押门槛 | 交易数 |
|------|------|----------|--------|
| S | S级商家 | ≥¥100,000 | ≥500 |
| A | A级商家 | ≥¥50,000 | ≥200 |
| B | B级商家 | ≥¥30,000 | ≥100 |
| C | C级商家 | ≥¥10,000 | ≥30 |
| D | 待评级 | 0 | 0 |

**审核状态**：
- approved(已通过)：自动开通大礼包
- pending(审核中)：待质押保证金
- rejected(已拒绝)：保证金不足/KYC未过

**实时质押状态指示**：
- `Radio` 图标脉冲动画
- 链上每3秒更新
- 进度条三段着色(红/琥珀/绿)

### 5.3 C2C安全机制 (`OTCExchange.jsx`)

**四大保障**：
1. **平台担保Escrow**：卖家代币先锁定，买家付款后才释放
2. **商家质押保证金**：100%保证金质押，违约全额赔付
3. **实名+企业认证**：KYC实名审核，营业执照验证
4. **DAO争议仲裁**：量子签名存证，DAO社区投票裁决

**交易流程**：
```
选择商家广告 → 确认金额/支付方式 → 平台Escrow锁定代币
→ 买家线下付款(C2C聊天+倒计时) → 买家确认付款 → 卖家放行
→ 交易完成(量子签名存证) → 日历同步截止日期
```

---

## 6. 推荐系统与9×9×9晋升体系

### 6.1 单一真相源 (`src/lib/promotionData.js`)

**核心数据结构**：
```javascript
PROMOTION_TIERS = [
  { level: "普通用户", order: 0, team: 0, consume: 0, reward: 0, diff: 0 },
  { level: "金卡", order: 1, team: 3, consume: 1000, reward: 10, diff: 10 },
  { level: "白金卡", order: 2, team: 10, consume: 5000, reward: 15, diff: 15 },
  { level: "钻石卡", order: 3, team: 30, consume: 20000, reward: 20, diff: 20 },
  { level: "黑金卡M1", order: 4, team: 100, consume: 50000, reward: 15, diff: 8.1 },
  // ... M2-M9 级差统一8.1%
  { level: "黑金卡M9", order: 12, team: 1000000, reward: 50, diff: 8.1 },
  { level: "杰出贡献者", order: 13, reward: 7.1, diff: 7.1 },
];
```

**释放周期计算**：
```javascript
calcReleaseDays = (order) => Math.round(999 - (order / 13) * (999 - 31));
// 普通用户: 999天 → 杰出贡献者: 31天
```

### 6.2 推荐系统全景 (`ReferralSystem.jsx`)

**四标签页**：
1. **晋升通道**：14级完整通道(金卡→黑金卡M9→杰出贡献者)
2. **团队矩阵**：9层关系矩阵 + 用户/商家信誉等级区分
3. **结算分红**：单笔消费结算分配明细
4. **奖励明细**：最近奖励记录

**9层关系矩阵** (`MATRIX_LAYERS`)：
| 层级 | 人数 | 比例 |
|------|------|------|
| 直推 | 8 | 20% |
| 2层 | 32 | 10% |
| 3层 | 128 | 5% |
| 4层 | 256 | 3% |
| 5层 | 512 | 2% |
| 6层 | 1024 | 1% |
| 7层 | 2048 | 0.5% |
| 8层 | 4096 | 0.3% |
| 9层 | 8192 | 0.2% |

### 6.3 晋升双条件

- **团队人数** + **累计消费** 双条件满足自动晋升
- 级差比例与9×9×9释放系统完全同步
- `PromotionLevelCard.jsx` 与 `ReferralSystem.jsx` 共享同一数据源

---

## 7. VIP大礼包与翻倍NMS释放

### 7.1 礼包配置 (`VIPGiftPackage.jsx`)

| 礼包 | 价格 | 现金(75%) | NMS(25%) | 基础NMS | 翻倍NMS | 释放周期 |
|------|------|----------|----------|---------|---------|----------|
| 金卡 | ¥99 | ¥74 | 25 | 100 | 200 | 925天 |
| 白金卡 | ¥199 | ¥149 | 50 | 200 | 400 | 850天 |
| 钻石卡 | ¥499 | ¥374 | 125 | 500 | 1000 | 776天 |
| 商家 | ¥499 | ¥374 | 125 | 500 | 1000 | 701天 |

### 7.2 翻倍NMS释放机制

**首购翻倍赠送**：
- 购买后立即获得 `bonusNms`（基础NMS × 2）
- 翻倍NMS按9×9×9机制线性释放到钱包
- 每日到账，周期对应会员卡等级

**激活模式**：
- `self`：为自己购买，直接激活本人账户
- `referral`：为下线激活，推荐人代为操作

**释放加速**：
- 购买后同步更新 `release_speed_factor`
- 释放周期从999天降至701-925天
- 通过 `ReleaseScheduleModal` 可视化进度

---

## 8. 日历同步系统

### 8.1 CalendarSync组件 (`src/components/calendar/CalendarSync.jsx`)

**同步事件类型**：
- `otc_deadline`：OTC交易付款截止/确认截止
- `dividend`：NFT分红支付/推荐奖励释放

**ICS日历文件生成**：
```javascript
const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//NMS MetaLife//Calendar Sync//CN
BEGIN:VEVENT
UID:${event.id}@nms-metaLife
DTSTAMP:${dtStart}
DTSTART:${dtStart}
DTEND:${dtEnd}
SUMMARY:${event.title}
DESCRIPTION:${event.desc}
END:VEVENT
END:VCALENDAR`;
```

**功能**：
- 单事件同步：生成 `.ics` 文件下载
- 全部同步：批量下载所有事件
- 提醒开关：可开启/关闭提醒
- 紧急事件标记：红色高亮

### 8.2 集成位置

- OTC交易页面 (`OTCExchange.jsx`)：OTC截止日期 + 股息支付日期
- 钱包页面：释放计划日期
- 商家仪表盘：订单截止日期

---

## 9. AI量化与风控熔断

### 9.1 AI量化引擎

**策略类型** (`TradingStrategy` 实体)：
- `arbitrage`：套利
- `yield_farming`：收益农场
- `market_making`：做市
- `trend_following`：趋势跟踪
- `sentiment`：情绪

**核心组件**：
- `StrategyStudio.jsx`：策略创建与管理
- `QuantBacktest.jsx`：历史回测
- `StrategyVisualEditor.jsx`：可视化策略编辑
- `MultiAgentArena.jsx`：多智能体竞争
- `AlphaSystem.jsx`：Alpha信号生成

### 9.2 风控熔断机制

**自动风控** (`QuantumRiskDashboard.jsx` + `AutoRiskExecutor.jsx`)：
1. Minara-AI 全网监控流动性异常
2. 风险评分超阈值触发 `CircuitBreaker`
3. 自动将资产从高风险矿池撤回安全池
4. 跨链再平衡 (`CrossChainRebalancer.jsx`)
5. AI断路器 (`AICircuitBreaker.jsx`)

**监控指标**：
- 流动性深度
- 价格偏离度
- 节点行为评分
- 跨链资产分布

---

## 10. RWA资产代币化流程

### 10.1 五步确权流程

```
Step 1: 商家上架 → 提交实物资产信息
Step 2: 法律公证 → 法律文书上链存证
Step 3: 多签审核 → 3/5委员会确认
Step 4: DOI存证 → 生成唯一标识
Step 5: NFT铸造 → 生成可分享VC凭证
```

### 10.2 RWA组件

- `RWATokenizationHub.jsx`：代币化中心
- `RWADigitalTwin.jsx`：数字孪生
- `RWASecondaryMarket.jsx`：二级市场
- `RWADashboard.jsx`：资产仪表盘
- `AssetProvenance.jsx`：溯源验证

### 10.3 RWA交易市场融合

RWA交易市场已融合至AI商城(NFTMarket)，统一入口：
- 实物NFT + 门店NFT + 节点NFT 统一展示
- 二级市场交易 (`NFTSecondaryMarket.jsx`)
- 仲裁系统 (`NFTArbitration.jsx`)

---

## 11. NFT生态与合成系统

### 11.1 NFT类型与版税

**四类NFT**：
- `physical`：实物NFT，对应线下商品
- `store`：门店NFT，商家股权凭证
- `node`：节点NFT，节点服务凭证
- `personal`：个人NFT，用户发布

**版税永久分配**：
```
总版税10% = 推荐人2.5% + 商家2.5% + 节点2.5% + 平台2.5%
```

### 11.2 NFT合成系统

**合成规则**：
- `can_synthesize_with`：可合成的NFT类型
- `synthesized_from`：合成来源追溯
- `synthesis_level`：合成等级 0-9
- 合成后NFT价值提升、版税增加

**合成组件**：
- `NFTSynthesisSystem.jsx`：合成系统
- `NFTForgeWorkshop.jsx`：锻造工坊
- `SynthesisMaterialsCard.jsx`：材料卡

### 11.3 NFT发行

**商家发行** (`NFTMintConsole.jsx`)：
- 门店NFT限量发行 (store_nft_limit)
- 实物NFT按消费铸造
- 节点NFT按服务发行

**个人发布** (`PersonalNFTPublish.jsx`)：
- 用户个人NFT发布
- 数据资产NFT化 (`DataAsset` 实体)

---

## 12. P2P社交与隐私通信

### 12.1 P2P社交架构

**基于 Hyperswarm/Holepunch**：
- 端对端加密通信
- DID身份认证
- 无中心服务器

**社交组件**：
- `P2PSocialHub.jsx`：社交中心
- `P2PMessenger.jsx`：即时通讯
- `DIDEncryptedChat.jsx`：DID加密聊天
- `DigitalAvatarChat.jsx`：数字分身聊天
- `RedPacketRain.jsx`：红包雨

### 12.2 社区动态

`UserActivity.jsx` (首页)：
- 消费动态、NFT动态、晋升动态、推荐动态
- 多标签筛选
- 实时更新

### 12.3 DAO区域聊天

- `ChinaRegionChat.jsx`：中国区域聊天
- `RegionChat.jsx`：区域聊天
- `DAOCommunityChat.jsx`：DAO社区聊天
- `P2PDAOChat.jsx`：P2P DAO聊天

---

## 13. DAO治理体系

### 13.1 DAO区域结构

`DAORegion` 实体四级行政：
- `province`：省级
- `city`：市级
- `district`：区级
- `street`：街道级

### 13.2 治理组件

- `GovernanceDashboard.jsx`：治理仪表盘
- `EnhancedGovernance.jsx`：增强治理
- `DAOBadgeSystem.jsx`：徽章系统
- `DAOAssetPool.jsx`：资产池

### 13.3 DAO仲裁

- 量子签名存证
- 社区投票裁决
- 多签委员会执行
- 争议保证金机制

---

## 14. 跨链桥接与多链资产

### 14.1 跨链桥

- `QuantumBridge.jsx`：量子跨链桥
- `LayerZeroBridge.jsx`：LayerZero跨链
- `CrossChainNFTPool.jsx`：跨链NFT池
- `NFTCrossChainSynth.jsx`：跨链NFT合成

### 14.2 跨链量化

- `CrossChainRebalancer.jsx`：跨链再平衡
- `CrossChainDispatch.jsx`：跨链调度
- `CrossChainYieldFarm.jsx`：跨链收益农场

---

## 15. 安全模型与量子签名

### 15.1 Kyber-768量子签名

**抗量子密码学**：
- KEM (Key Encapsulation Mechanism)
- 钱包公钥/交易签名
- 量子签名存证 (`quantum_signature`)
- 签名验证时间 (`signature_time_ms`)

### 15.2 隐私审计

- `QuantumPrivacyDashboard.jsx`：量子隐私面板
- `QuantumPrivacyAudit.jsx`：隐私审计
- `QuantumAssetInsurance.jsx`：量子资产保险

### 15.3 身份系统

- `DOAIdentityHub.jsx`：DAO身份中心
- `ChainIdentityHub.jsx`：链上身份
- DID去中心化身份

---

## 16. 模块融合与系统整合

### 16.1 已完成融合

| 原模块 | 融合至 | 统一入口 |
|--------|--------|----------|
| RWA交易市场 | AI商城(NFTMarket) | NFTMarket页面 |
| 社交多标签 | P2P社交(Social) | Social页面 |
| NFT二级市场 | NFTMarket增强 | NFTMarket页面 |
| 推荐等级数据 | promotionData.js | 单一真相源 |

### 16.2 单一真相源原则

`src/lib/promotionData.js` 统一管理：
- `PROMOTION_TIERS`：14级晋升通道
- `MATRIX_LAYERS`：9层关系矩阵
- `MERCHANT_REPUTATION_GRADES`：商家信誉等级
- `USER_REPUTATION_GRADES`：用户信誉等级
- `calcReleaseDays`：释放周期计算

所有组件统一引用，杜绝数值漂移：
- `ReferralSystem.jsx`
- `PromotionLevelCard.jsx`
- `OTCAuditPanel.jsx`
- `MerchantStakingFlow.jsx`
- `ReleaseScheduleModal.jsx`
- `VIPGiftPackage.jsx`

### 16.3 输入防护

所有金融模块(钱包、兑换、OTC、支付)统一：
- 负数输入防护
- 金额范围校验
- 余额充足检查

---

## 17. 复现与部署指南

### 17.1 环境要求

- Node.js 18+
- npm 或 yarn
- Base44 平台账户

### 17.2 项目结构

```
src/
├── pages/              # 页面组件
├── components/
│   ├── ui/            # shadcn/ui 基础组件
│   ├── payment/       # 支付相关
│   ├── wallet/        # 钱包相关
│   ├── otc/           # OTC交易
│   ├── referral/      # 推荐系统
│   ├── promotion/     # 晋升等级
│   ├── nft/           # NFT生态
│   ├── merchant/      # 商家系统
│   ├── dex/           # DEX交易
│   ├── quant/         # AI量化
│   ├── dao/           # DAO治理
│   ├── social/        # P2P社交
│   ├── ai-assistant/  # AI助手
│   ├── bridge/        # 跨链桥
│   ├── calendar/      # 日历同步
│   └── home/          # 首页组件
├── lib/               # 工具与配置
│   ├── promotionData.js  # 晋升单一真相源
│   ├── utils.js       # 通用工具
│   └── AuthContext.jsx # 认证上下文
├── hooks/             # 自定义Hooks
├── api/               # API客户端
└── docs/              # 文档
    ├── WHITEPAPER.md
    ├── ARCHITECTURE.md
    └── TECHNICAL_ARCHITECTURE.md
```

### 17.3 核心依赖

```json
{
  "react": "^18.2.0",
  "react-router-dom": "^6.26.0",
  "@tanstack/react-query": "^5.84.1",
  "framer-motion": "^11.16.4",
  "recharts": "^2.15.4",
  "lucide-react": "^0.475.0",
  "three": "^0.171.0",
  "react-leaflet": "^4.2.1",
  "@hello-pangea/dnd": "^17.0.0"
}
```

### 17.4 实体创建顺序

复现时按依赖顺序创建实体：
1. User (平台内置)
2. UserBalance (用户余额)
3. WalletAccount (五子钱包)
4. MerchantStore (商家门店)
5. PromotionLevel (晋升等级)
6. PaymentOrder (消费订单)
7. NFTItem (NFT资产)
8. Transaction (链上交易)
9. LiquidityPool (流动性池)
10. RedPacket (红包)
11. DataAsset (数据资产)
12. DAORegion (DAO区域)
13. ChatMessage (聊天消息)
14. TradingStrategy (量化策略)

### 17.5 关键配置

**pages.config.js**：
```javascript
export const pagesConfig = {
    mainPage: "Champions",  // 首页指向社区动态
    Pages: PAGES,
    Layout: __Layout,
};
```

**App.jsx 路由**：
```jsx
<Route path="/" element={<MainPage />} />
{Object.entries(Pages).map(([path, Page]) => (
  <Route key={path} path={`/${path}`} element={<Page />} />
))}
<Route path="/OTC" element={<OTC />} />
```

### 17.6 部署

- Base44 平台自动构建部署
- 支持iOS/Android发布(同一代码库)
- 自定义域名配置

---

## 17. Web4.0 Agentic钱包架构

> 自托管多链 Agentic 钱包 — 将"自主智能体"当作一等公民，人类保留资产控制权，Agent 可编程地与去中心化环境交互。

### 18.1 设计理念

- **AI + ZK 框架**：零知识证明保障隐私，AI Agent 在不暴露私钥的前提下自主执行策略。
- **自托管多链**：用户保留全部私钥控制权，支持 NMS Chain / Ethereum / Polygon / BNB Chain 多链资产管理。
- **Agent 一等公民**：Minara AI Agent 可编程交互（套利、复投、跨链再平衡），但不可转移资产。

### 18.2 技术实现

| 组件 | 实现 | 说明 |
|------|------|------|
| AgenticWallet.jsx | React组件 | 多链资产展示 + Agent状态 + ZK证明 |
| ZK证明系统 | Kyber-768 KEM | 交易隐私保护，链上验证 |
| Agent策略引擎 | Minara-AI | 套利扫描 + 风控熔断 + 自动复投 |
| 多链同步 | Hyperswarm DHT | P2P节点发现与链状态同步 |

### 18.3 Agent 能力矩阵

1. **自主套利**：AI Agent 自动扫描跨链价差，在最优路径执行交易。
2. **风控熔断**：ZK 证明实时验证交易安全性，异常自动拦截。
3. **自动复投**：收益自动再投入最优流动性池。
4. **跨链调度**：多链资产自动再平衡，维持最优配置。

### 18.4 安全模型

```
用户私钥(本地) → ZK证明生成 → Agent策略执行 → 链上验证 → 资产控制权(人类)
```

- 私钥永不离开本地设备
- Agent 仅获得"可编程交互权"，无资产转移权
- 所有关键操作需 ZK 证明 + 用户授权

---

## 附录：版本变更

| 版本 | 日期 | 主要变更 |
|------|------|----------|
| V9.1 | 2026-07-29 | 晋升单一真相源、OTC双信誉等级、翻倍NMS |
| V10.0 | 2026-07-31 | 商家质押流程组件、技术架构白皮书、模块融合完善 |
| V11.0 | 2026-08-28 | Web4.0 Agentic钱包、RWA模块融合至AI商城、9×9×9释放进度可视化 |
| V12.0 | 2026-08-28 | 白皮书V12.0、全站逻辑一致性核验、MerchantStakingFlow释放周期修复(701→31天) |
| V13.0 | 2026-08-29 | ZK智能审计面板、AI释放策略顾问、AIAssistant标签页合并优化(37→32) |

---

*本文档基于 NMS MetaLife 项目当前所有功能模块生成，涵盖公链技术架构、全栈功能模块实现、数据模型、复现指南，可供后续生态查阅与复现参考。*