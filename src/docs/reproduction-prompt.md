# NMS MetaLife — 全系统提示词工程复现文档 V1.0

> **用途**：将本文档完整输入给 AI 开发助手（如 Base44 Builder），即可从零复现整个 NMS MetaLife Web3 生态系统。
> 本文档涵盖项目愿景、技术架构、数据模型、全部功能模块、UI/UX 规范、业务逻辑公式与复现步骤。

版本：V1.0 ｜ 更新日期：2026-10-26 ｜ 对应系统版本：V13.0

---

## 目录

1. [项目概述与愿景](#1-项目概述与愿景)
2. [技术栈与依赖清单](#2-技术栈与依赖清单)
3. [公链四层架构](#3-公链四层架构)
4. [数据模型与实体定义](#4-数据模型与实体定义)
5. [设计系统与UI规范](#5-设计系统与ui规范)
6. [页面路由与布局系统](#6-页面路由与布局系统)
7. [核心业务逻辑与公式](#7-核心业务逻辑与公式)
8. [功能模块详细规格](#8-功能模块详细规格)
9. [组件清单与分类](#9-组件清单与分类)
10. [安全模型](#10-安全模型)
11. [复现步骤](#11-复现步骤)
12. [验收标准](#12-验收标准)

---

## 1. 项目概述与愿景

### 1.1 项目名称
NMS MetaLife — AI 驱动的去中心化金融与生活生态系统

### 1.2 一句话描述
一个「消费即分红、共同富裕」的 Web3 生活生态平台，集成 RWA 资产代币化、AI 量化交易、P2P 社交、DAO 治理、C2C 法币 OTC、9×9×9 释放机制与 Web4.0 Agentic 钱包。

### 1.3 核心目标

1. **消费即铸造**：用户消费即获得 1:1 NMS 积分并铸造 NFT，享受永久版税与分红
2. **RWA 确权**：实物资产经法律公证 + AI 合规 + 多签审核 + DOI 存证，生成可分享 VC 凭证
3. **AI 风控**：Minara-AI 全网监控流动性异常，自动触发智能合约熔断
4. **P2P 社交**：基于 Hyperswarm/Holepunch 的端对端加密社交，DID 身份 + Kyber-768 量子签名
5. **9×9×9 释放**：NMS 积分从 999 天线性释放，通过三维度（消费/推荐/NFT）加速至最快 31 天

### 1.4 四代币体系

| 代币 | 全称 | 用途 | 总量 |
|------|------|------|------|
| NMS | NMS 绿色积分 | 消费返利、打赏、质押、分红 | 19万亿（通缩至1.9亿） |
| ACS | ACS 稳定币 | 价值尺度、跨链桥锚定 | 弹性发行 |
| YSE | YSE 收益币 | 收益分配、流动性挖矿奖励 | 5亿 |
| GCP | GCP 治理币 | DAO投票权、节点治理 | 2.1亿 |

---

## 2. 技术栈与依赖清单

### 2.1 前端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | ^18.2.0 | UI框架 |
| Vite | 最新 | 构建工具 |
| Tailwind CSS | 3 | 样式系统 |
| shadcn/ui (Radix UI) | 最新 | 无障碍组件库 |
| framer-motion | ^11.16.4 | 动画 |
| recharts | ^2.15.4 | 图表（K线/饼图/柱状图/面积图） |
| react-router-dom | ^6.26.0 | SPA路由 |
| @tanstack/react-query | ^5.84.1 | 数据请求与缓存 |
| react-hook-form | ^7.54.2 | 表单管理 |
| lucide-react | ^0.475.0 | 图标库（仅使用存在的图标） |
| moment | ^2.30.1 | 日期处理 |
| date-fns | ^3.6.0 | 日期工具 |
| lodash | ^4.17.21 | 工具函数 |
| three.js | ^0.171.0 | 3D渲染 |
| react-leaflet | ^4.2.1 | 地图 |
| @hello-pangea/dnd | ^17.0.0 | 拖拽 |
| react-markdown | ^9.0.1 | Markdown渲染 |
| react-quill | ^2.0.0 | 富文本编辑 |
| canvas-confetti | ^1.9.4 | 庆祝特效 |
| jspdf | ^4.0.0 | PDF生成 |
| html2canvas | ^1.4.1 | 截图 |
| sonner | ^2.0.1 | Toast通知 |
| zod | ^3.24.2 | 数据验证 |
| input-otp | ^1.4.2 | OTP输入 |
| vaul | ^1.1.2 | Drawer组件 |
| embla-carousel-react | ^8.5.2 | 轮播 |
| react-resizable-panels | ^2.1.7 | 可调整面板 |

### 2.2 后端（Base44 BaaS）

- 实体存储（JSON Schema 定义，MongoDB 底层）
- 多方式认证（手机/邮箱/钱包，OAuth 2.0）
- 集成服务：InvokeLLM、UploadPrivateFile、UploadPublicFile、SendEmail、GenerateImage、GenerateSpeech、GenerateVideo、TranscribeAudio、ExtractDataFromUploadedFile、CreateFileSignedUrl
- 实时订阅（WebSocket 实体变更推送）
- OAuth 连接器（Google Calendar 等，需 Builder+）

### 2.3 关键约束

- **ESM only** — 禁止 `require()` / `module.exports`
- **cn 来自 `@/lib/utils`** — 不要自己实现
- **createPageUrl 来自 `@/utils`**
- **shadcn 组件各自独立导出** — 从各自文件导入
- **Tailwind 类名必须是字面量字符串** — 动态类名会被 purge
- **JSX 只在 .jsx/.tsx 文件中**
- **Hooks 只在组件顶层调用**

---

## 3. 公链四层架构

```
┌─────────────────────────────────────────────────────────────────┐
│ Layer 4: 应用层 (React SPA)                                      │
│  Home · PaymentCenter · Wallet · NFTMarket · DEXTrading         │
│  QuantDashboard · Monitor · Social · Discover · AIAssistant     │
│  DeFi · PredictionMarket · OTC · Profile · Documentation        │
├─────────────────────────────────────────────────────────────────┤
│ Layer 3: 服务层 (Base44 BaaS)                                    │
│  实体存储 · 多方式认证 · 集成(LLM/Upload/Email) · 实时订阅       │
├─────────────────────────────────────────────────────────────────┤
│ Layer 2: 协议层 (公链协议)                                        │
│  RWA确权 · NFT(1155/721) · CLOB订单簿 · AMM · AI风控熔断         │
│  DAO治理 · 跨链桥 · DID身份 · 量子签名 · 9×9×9释放               │
├─────────────────────────────────────────────────────────────────┤
│ Layer 1: 共识与网络层                                             │
│  PoS+AI验证 · 多签委员会 · Hyperswarm P2P · Kyber-768            │
│  Hyperliquid L2 · Lighter AMM · LayerZero                       │
└─────────────────────────────────────────────────────────────────┘
```

### 3.1 共识机制

- **PoS + AI 验证**：节点质押 NMS 参与出块，Minara-AI 实时评估节点行为，异常自动降权
- **多签委员会**：RWA 确权、大额跨链调度需 3/5 多签确认
- **0 Gas 机制**：交易 Gas 由平台补贴，用户零手续费

### 3.2 量子安全

- **Kyber-768**：抗量子 KEM，钱包公钥与交易签名
- **Dilithium**：抗量子数字签名算法
- 所有链上交易携带 `quantum_signature` 与 `signature_time_ms`

### 3.3 Minara-AI 框架

- 风控监控：实时扫描流动性、矿池风险、跨链桥状态
- 策略生成：量化策略自动生成、回测、进化优化
- 合规审核：RWA 上架前 AI 合规评分（0-100）
- 智能客服：AI 管家、AI 投顾、语音助手

---

## 4. 数据模型与实体定义

### 4.1 实体创建顺序

复现时按依赖顺序创建：
1. UserBalance → 2. WalletAccount → 3. MerchantStore → 4. PromotionLevel → 5. PaymentOrder → 6. NFTItem → 7. Transaction → 8. LiquidityPool → 9. RedPacket → 10. DataAsset → 11. DAORegion → 12. ChatMessage → 13. TradingStrategy

### 4.2 实体 Schema 定义

#### UserBalance
```json
{
  "name": "UserBalance",
  "type": "object",
  "properties": {
    "user_email": { "type": "string" },
    "available_nms": { "type": "number", "default": 0 },
    "pending_release_nms": { "type": "number", "default": 0 },
    "locked_nms": { "type": "number", "default": 0 },
    "acs_balance": { "type": "number", "default": 0 },
    "yse_balance": { "type": "number", "default": 0 },
    "gcp_balance": { "type": "number", "default": 0 },
    "total_consumption": { "type": "number", "default": 0 },
    "total_rewards": { "type": "number", "default": 0 },
    "consumption_level": { "type": "number", "default": 0 },
    "referral_level": { "type": "number", "default": 0 },
    "nft_synthesis_level": { "type": "number", "default": 0 },
    "major_level": { "type": "string", "enum": ["普通用户","M1","M2","M3","M4","M5","M6","M7","M8","M9"], "default": "普通用户" },
    "release_speed_factor": { "type": "number", "default": 1 },
    "release_days": { "type": "number", "default": 365 },
    "referrer_email": { "type": "string" },
    "referral_code": { "type": "string" },
    "team_size": { "type": "number", "default": 0 },
    "direct_referrals": { "type": "number", "default": 0 },
    "user_type": { "type": "string", "enum": ["普通用户","VIP用户","商家","节点服务商"], "default": "普通用户" },
    "sign_in_days": { "type": "number", "default": 0 },
    "last_sign_in": { "type": "string", "format": "date" },
    "nft_physical_count": { "type": "number", "default": 0 },
    "nft_store_count": { "type": "number", "default": 0 },
    "nft_node_count": { "type": "number", "default": 0 },
    "nft_dividends_total": { "type": "number", "default": 0 },
    "royalty_earnings_total": { "type": "number", "default": 0 }
  },
  "required": ["user_email"]
}
```

#### WalletAccount
```json
{
  "name": "WalletAccount",
  "type": "object",
  "properties": {
    "account_name": { "type": "string" },
    "account_type": { "type": "string", "enum": ["main","savings","trading","staking","spending"] },
    "address": { "type": "string" },
    "nms_balance": { "type": "number", "default": 0 },
    "acs_balance": { "type": "number", "default": 0 },
    "yse_balance": { "type": "number", "default": 0 },
    "gcp_balance": { "type": "number", "default": 0 },
    "is_nfc_enabled": { "type": "boolean", "default": false },
    "kyber_public_key": { "type": "string" }
  },
  "required": ["account_name", "account_type", "address"]
}
```

#### MerchantStore
```json
{
  "name": "MerchantStore",
  "type": "object",
  "properties": {
    "store_name": { "type": "string" },
    "owner_email": { "type": "string" },
    "category": { "type": "string", "enum": ["餐饮","零售","服务","娱乐","教育","医疗","其他"] },
    "tip_ratio": { "type": "number", "default": 10 },
    "tip_wallet_balance": { "type": "number", "default": 0 },
    "dividend_pool": { "type": "number", "default": 0 },
    "lucky_packet_pool": { "type": "number", "default": 0 },
    "physical_nft_pool": { "type": "number", "default": 0 },
    "store_nft_pool": { "type": "number", "default": 0 },
    "physical_nft_reserved": { "type": "number", "default": 0 },
    "store_nft_reserved": { "type": "number", "default": 0 },
    "address": { "type": "string" },
    "latitude": { "type": "number" },
    "longitude": { "type": "number" },
    "phone": { "type": "string" },
    "logo_url": { "type": "string" },
    "is_verified": { "type": "boolean", "default": false },
    "business_license": { "type": "string" },
    "operating_permit": { "type": "string" },
    "qr_code": { "type": "string" },
    "total_transactions": { "type": "number", "default": 0 },
    "total_sales": { "type": "number", "default": 0 },
    "total_tips_given": { "type": "number", "default": 0 },
    "total_tips_burned": { "type": "number", "default": 0 },
    "physical_nft_issued": { "type": "number", "default": 0 },
    "store_nft_issued": { "type": "number", "default": 0 },
    "store_nft_limit": { "type": "number", "default": 100 },
    "is_node_provider": { "type": "boolean", "default": false },
    "user_matrix_count": { "type": "number", "default": 0 },
    "merchant_matrix_count": { "type": "number", "default": 0 },
    "node_matrix_count": { "type": "number", "default": 0 }
  },
  "required": ["store_name", "owner_email", "category"]
}
```

#### PaymentOrder
```json
{
  "name": "PaymentOrder",
  "type": "object",
  "properties": {
    "order_no": { "type": "string" },
    "merchant_id": { "type": "string" },
    "merchant_email": { "type": "string" },
    "merchant_name": { "type": "string" },
    "user_email": { "type": "string" },
    "amount": { "type": "number" },
    "payment_method": { "type": "string", "enum": ["nms","wechat","alipay","mixed"], "default": "nms" },
    "tip_ratio": { "type": "number" },
    "merchant_consumed": { "type": "number" },
    "user_reward": { "type": "number" },
    "merchant_return": { "type": "number" },
    "vip_reward": { "type": "number" },
    "level_diff_reward": { "type": "number" },
    "contributor_reward": { "type": "number" },
    "physical_nft_pool_add": { "type": "number" },
    "nft_minted": { "type": "boolean", "default": false },
    "nft_id": { "type": "string" },
    "burned_amount": { "type": "number" },
    "status": { "type": "string", "enum": ["pending","completed","cancelled","refunded"], "default": "pending" },
    "quantum_signature": { "type": "string" }
  },
  "required": ["order_no", "merchant_email", "user_email", "amount"]
}
```

#### NFTItem
```json
{
  "name": "NFTItem",
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "description": { "type": "string" },
    "image_url": { "type": "string" },
    "nft_type": { "type": "string", "enum": ["physical","store","node","personal"] },
    "category": { "type": "string", "enum": ["餐饮","零售","服务","娱乐","教育","医疗","其他"] },
    "price": { "type": "number" },
    "original_value": { "type": "number" },
    "royalty_percent": { "type": "number", "default": 10 },
    "royalty_referrer": { "type": "number", "default": 2.5 },
    "royalty_merchant": { "type": "number", "default": 2.5 },
    "royalty_node": { "type": "number", "default": 2.5 },
    "royalty_platform": { "type": "number", "default": 2.5 },
    "owner_address": { "type": "string" },
    "owner_email": { "type": "string" },
    "creator_address": { "type": "string" },
    "creator_email": { "type": "string" },
    "merchant_id": { "type": "string" },
    "merchant_name": { "type": "string" },
    "token_id": { "type": "string" },
    "is_for_sale": { "type": "boolean", "default": false },
    "rarity": { "type": "string", "enum": ["common","rare","epic","legendary"], "default": "common" },
    "trade_count": { "type": "number", "default": 0 },
    "total_royalty_earned": { "type": "number", "default": 0 },
    "dividend_earned": { "type": "number", "default": 0 },
    "can_synthesize_with": { "type": "array", "items": { "type": "string" } },
    "synthesized_from": { "type": "array", "items": { "type": "string" } },
    "synthesis_level": { "type": "number", "default": 0 }
  },
  "required": ["name", "nft_type", "price"]
}
```

#### Transaction
```json
{
  "name": "Transaction",
  "type": "object",
  "properties": {
    "tx_hash": { "type": "string" },
    "block_number": { "type": "number" },
    "from_address": { "type": "string" },
    "to_address": { "type": "string" },
    "amount": { "type": "number" },
    "token_type": { "type": "string", "enum": ["NMS","ACS","YSE","GCP"], "default": "NMS" },
    "status": { "type": "string", "enum": ["pending","confirmed","failed"], "default": "confirmed" },
    "gas_fee": { "type": "number", "default": 0 },
    "quantum_signature": { "type": "string" },
    "signature_time_ms": { "type": "number" }
  },
  "required": ["tx_hash", "from_address", "to_address", "amount"]
}
```

#### TradingStrategy
```json
{
  "name": "TradingStrategy",
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "type": { "type": "string", "enum": ["arbitrage","yield_farming","market_making","trend_following","sentiment"] },
    "status": { "type": "string", "enum": ["active","paused","stopped"], "default": "paused" },
    "win_rate": { "type": "number" },
    "pnl": { "type": "number" },
    "pnl_percent": { "type": "number" },
    "allocated_capital": { "type": "number" },
    "risk_level": { "type": "string", "enum": ["low","medium","high"], "default": "medium" },
    "trades_count": { "type": "number", "default": 0 }
  },
  "required": ["name", "type"]
}
```

#### LiquidityPool
```json
{
  "name": "LiquidityPool",
  "type": "object",
  "properties": {
    "pool_name": { "type": "string" },
    "token_a": { "type": "string", "enum": ["NMS","ACS","YSE","GCP","USDT"] },
    "token_b": { "type": "string", "enum": ["NMS","ACS","YSE","GCP","USDT"] },
    "reserve_a": { "type": "number", "default": 0 },
    "reserve_b": { "type": "number", "default": 0 },
    "tvl": { "type": "number", "default": 0 },
    "apy": { "type": "number", "default": 0 },
    "volume_24h": { "type": "number", "default": 0 },
    "fee_percent": { "type": "number", "default": 0.3 }
  },
  "required": ["pool_name", "token_a", "token_b"]
}
```

#### RedPacket
```json
{
  "name": "RedPacket",
  "type": "object",
  "properties": {
    "sender_address": { "type": "string" },
    "total_amount": { "type": "number" },
    "remaining_amount": { "type": "number" },
    "packet_count": { "type": "number" },
    "claimed_count": { "type": "number", "default": 0 },
    "type": { "type": "string", "enum": ["lucky","average","merchant"], "default": "lucky" },
    "message": { "type": "string" },
    "expires_at": { "type": "string", "format": "date-time" },
    "status": { "type": "string", "enum": ["active","claimed","expired"], "default": "active" }
  },
  "required": ["sender_address", "total_amount", "packet_count"]
}
```

#### PromotionLevel
```json
{
  "name": "PromotionLevel",
  "type": "object",
  "properties": {
    "level_name": { "type": "string", "enum": ["普通用户","VIP1","VIP2","VIP3","M1","M2","M3","M4","M5","M6","M7","M8","M9","杰出贡献者"] },
    "level_order": { "type": "number" },
    "required_team_size": { "type": "number" },
    "required_consumption": { "type": "number" },
    "reward_ratio": { "type": "number" },
    "level_diff_ratio": { "type": "number" },
    "privileges": { "type": "string" },
    "icon": { "type": "string" },
    "color": { "type": "string" }
  },
  "required": ["level_name", "level_order"]
}
```

#### DataAsset
```json
{
  "name": "DataAsset",
  "type": "object",
  "properties": {
    "user_email": { "type": "string" },
    "asset_type": { "type": "string", "enum": ["consumption","health","social","location","behavior"] },
    "asset_name": { "type": "string" },
    "data_hash": { "type": "string" },
    "nft_token_id": { "type": "string" },
    "estimated_value": { "type": "number" },
    "is_listed": { "type": "boolean", "default": false },
    "list_price": { "type": "number" },
    "trade_count": { "type": "number", "default": 0 },
    "total_earnings": { "type": "number", "default": 0 },
    "data_size": { "type": "string" },
    "status": { "type": "string", "enum": ["pending","confirmed","trading"], "default": "pending" }
  },
  "required": ["user_email", "asset_type", "asset_name"]
}
```

#### DAORegion
```json
{
  "name": "DAORegion",
  "type": "object",
  "properties": {
    "region_code": { "type": "string" },
    "region_name": { "type": "string" },
    "parent_code": { "type": "string" },
    "level": { "type": "string", "enum": ["province","city","district","street"] },
    "member_count": { "type": "number", "default": 0 },
    "dao_fund": { "type": "number", "default": 0 },
    "is_active": { "type": "boolean", "default": true }
  },
  "required": ["region_code", "region_name", "level"]
}
```

#### ChatMessage
```json
{
  "name": "ChatMessage",
  "type": "object",
  "properties": {
    "region_code": { "type": "string" },
    "sender_email": { "type": "string" },
    "sender_name": { "type": "string" },
    "sender_avatar": { "type": "string" },
    "message_type": { "type": "string", "enum": ["text","image","red_packet","nft"], "default": "text" },
    "content": { "type": "string" },
    "red_packet_id": { "type": "string" },
    "is_pinned": { "type": "boolean", "default": false }
  },
  "required": ["region_code", "sender_email", "content"]
}
```

### 4.3 单一真相源 — `src/lib/promotionData.js`

**必须首先创建此文件**，所有模块引用它以杜绝数值漂移：

```javascript
const calcReleaseDays = (order) => Math.round(999 - (order / 13) * (999 - 31));

export const PROMOTION_TIERS = [
  { level: "普通用户", matchKey: "普通用户", order: 0, color: "#94a3b8", team: 0, consume: 0, reward: 0, diff: 0, priv: "基础消费返利", releaseDays: calcReleaseDays(0) },
  { level: "金卡", matchKey: "金卡", order: 1, color: "#f59e0b", team: 3, consume: 1000, reward: 10, diff: 10, priv: "直推10%级差奖励+释放加速", releaseDays: calcReleaseDays(1) },
  { level: "白金卡", matchKey: "白金卡", order: 2, color: "#cbd5e1", team: 10, consume: 5000, reward: 15, diff: 15, priv: "直推15%级差奖励+等级礼包", releaseDays: calcReleaseDays(2) },
  { level: "钻石卡", matchKey: "钻石卡", order: 3, color: "#06b6d4", team: 30, consume: 20000, reward: 20, diff: 20, priv: "直推20%级差奖励+专属客服", releaseDays: calcReleaseDays(3) },
  { level: "黑金卡M1", matchKey: "M1", order: 4, color: "#22c55e", team: 100, consume: 50000, reward: 15, diff: 8.1, priv: "级差8.1%+团队管理权", releaseDays: calcReleaseDays(4) },
  { level: "黑金卡M2", matchKey: "M2", order: 5, color: "#3b82f6", team: 300, consume: 150000, reward: 18, diff: 8.1, priv: "级差8.1%+区域代理权", releaseDays: calcReleaseDays(5) },
  { level: "黑金卡M3", matchKey: "M3", order: 6, color: "#06b6d4", team: 1000, consume: 500000, reward: 22, diff: 8.1, priv: "级差8.1%+城市合伙人", releaseDays: calcReleaseDays(6) },
  { level: "黑金卡M4", matchKey: "M4", order: 7, color: "#8b5cf6", team: 3000, consume: 1500000, reward: 26, diff: 8.1, priv: "级差8.1%+省级代理", releaseDays: calcReleaseDays(7) },
  { level: "黑金卡M5", matchKey: "M5", order: 8, color: "#ec4899", team: 10000, consume: 5000000, reward: 30, diff: 8.1, priv: "级差8.1%+全国代理", releaseDays: calcReleaseDays(8) },
  { level: "黑金卡M6", matchKey: "M6", order: 9, color: "#a855f7", team: 30000, consume: 15000000, reward: 35, diff: 8.1, priv: "级差8.1%+股东分红", releaseDays: calcReleaseDays(9) },
  { level: "黑金卡M7", matchKey: "M7", order: 10, color: "#14b8a6", team: 100000, consume: 50000000, reward: 40, diff: 8.1, priv: "级差8.1%+董事会席位", releaseDays: calcReleaseDays(10) },
  { level: "黑金卡M8", matchKey: "M8", order: 11, color: "#f43f5e", team: 300000, consume: 150000000, reward: 45, diff: 8.1, priv: "级差8.1%+联合创始人", releaseDays: calcReleaseDays(11) },
  { level: "黑金卡M9", matchKey: "M9", order: 12, color: "#fbbf24", team: 1000000, consume: 500000000, reward: 50, diff: 8.1, priv: "级差8.1%+终身合伙人", releaseDays: calcReleaseDays(12) },
  { level: "杰出贡献者", matchKey: "杰出贡献者", order: 13, color: "#fb7185", team: 0, consume: 0, reward: 7.1, diff: 7.1, priv: "特殊贡献7.1%奖励", releaseDays: calcReleaseDays(13) },
];

export const findTier = (levelName) =>
  PROMOTION_TIERS.find(c => c.level === levelName || c.matchKey === levelName) || PROMOTION_TIERS[0];

export const MATRIX_LAYERS = [
  { layer: 1, label: "直推", count: 8, pct: 20, color: "#22c55e" },
  { layer: 2, label: "2层", count: 32, pct: 10, color: "#06b6d4" },
  { layer: 3, label: "3层", count: 128, pct: 5, color: "#8b5cf6" },
  { layer: 4, label: "4层", count: 256, pct: 3, color: "#f59e0b" },
  { layer: 5, label: "5层", count: 512, pct: 2, color: "#ec4899" },
  { layer: 6, label: "6层", count: 1024, pct: 1, color: "#14b8a6" },
  { layer: 7, label: "7层", count: 2048, pct: 0.5, color: "#f43f5e" },
  { layer: 8, label: "8层", count: 4096, pct: 0.3, color: "#a855f7" },
  { layer: 9, label: "9层", count: 8192, pct: 0.2, color: "#fbbf24" },
];

export const MERCHANT_REPUTATION_GRADES = [
  { grade: "S", label: "S级商家", minDeposit: 100000, minTrades: 500, color: "#fbbf24", desc: "顶级信誉·优先展示" },
  { grade: "A", label: "A级商家", minDeposit: 50000, minTrades: 200, color: "#22c55e", desc: "优质信誉·推荐交易" },
  { grade: "B", label: "B级商家", minDeposit: 30000, minTrades: 100, color: "#06b6d4", desc: "标准信誉·正常交易" },
  { grade: "C", label: "C级商家", minDeposit: 10000, minTrades: 30, color: "#f59e0b", desc: "基础信誉·谨慎交易" },
  { grade: "D", label: "D级商家", minDeposit: 0, minTrades: 0, color: "#94a3b8", desc: "待评级·限制交易" },
];

export const USER_REPUTATION_GRADES = [
  { grade: "VIP3", label: "钻石用户", minConsume: 20000, color: "#06b6d4", desc: "高消费·高信誉" },
  { grade: "VIP2", label: "白金用户", minConsume: 5000, color: "#cbd5e1", desc: "中高消费·良好信誉" },
  { grade: "VIP1", label: "金卡用户", minConsume: 1000, color: "#f59e0b", desc: "基础消费·已认证" },
  { grade: "普通", label: "普通用户", minConsume: 0, color: "#94a3b8", desc: "未购礼包·待激活" },
];

export { calcReleaseDays };
```

### 4.4 统一推荐 Hook — `src/hooks/useReferral.js`

```javascript
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

export function useReferral() {
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
        if (u?.email) {
          const { items } = await base44.entities.UserBalance.filter(
            { user_email: u.email }, { limit: 1 }
          );
          if (items.length > 0) setBalance(items[0]);
        }
      } catch (e) { /* 未登录 */ }
    };
    load();
  }, []);

  const referralCode = user?.email
    ? "NMS" + user.email.split("@")[0].toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6)
    : "NMSDEMO01";
  const referralLink = `${window.location.origin}?ref=${referralCode}`;

  return { user, balance, referralCode, referralLink };
}
```

---

## 5. 设计系统与UI规范

### 5.1 暗色主题色彩系统

在 `src/index.css` 中定义 CSS 变量（`:root` 与 `.dark`）：

```css
:root {
  --background: 222 47% 11%;
  --foreground: 210 40% 98%;
  --card: 222 47% 13%;
  --card-foreground: 210 40% 98%;
  --primary: 199 89% 48%;
  --primary-foreground: 0 0% 100%;
  --secondary: 217 33% 17%;
  --secondary-foreground: 210 40% 98%;
  --muted: 217 33% 17%;
  --muted-foreground: 215 20% 65%;
  --accent: 217 33% 17%;
  --accent-foreground: 210 40% 98%;
  --destructive: 0 84% 60%;
  --destructive-foreground: 210 40% 98%;
  --border: 217 33% 20%;
  --input: 217 33% 20%;
  --ring: 199 89% 48%;
}
```

### 5.2 设计原则

- **暗色金融科技风**：深蓝/深灰背景 + 青色/绿色强调色
- **响应式**：移动端底部导航 + 桌面端头部导航
- **Framer Motion 动画**：页面切换、卡片悬停、弹窗进出
- **全中文界面**：所有 UI 文案使用中文
- **图标**：仅使用 `lucide-react` 中存在的图标

### 5.3 输入验证规范

所有金融数字输入框必须：
```jsx
<Input type="number" min="0" step="any"
  onChange={(e) => { const v = e.target.value; setX(parseFloat(v) < 0 ? "0" : v); }} />
```

---

## 6. 页面路由与布局系统

### 6.1 页面路由清单（26+页面）

| 路由 | 页面文件 | 核心功能 |
|------|----------|----------|
| / | Home.jsx | 首页：余额、商城入口、签到、附近商家、VIP礼包 |
| /Champions | Champions.jsx | 社区动态（首页默认指向） |
| /wallet | Wallet.jsx | 钱包：五子账户、NFT、账单、P2P、释放进度 |
| /payment | PaymentCenter.jsx | 支付中心：扫码付、收款、转账、分红结果 |
| /nft | NFTMarket.jsx | AI商城：商品、合成、二级市场、RWA交易 |
| /dex | DEXTrading.jsx | DEX交易所：订单簿、K线、一键兑换 |
| /quant | QuantDashboard.jsx | AI量化：策略、DeFi、跨链、风控 |
| /monitor | Monitor.jsx | 监控中心：资产监控、合约审计、AI熔断 |
| /social | Social.jsx | 元Social：P2P社交、隐私聊天、DAO社区 |
| /discover | Discover.jsx | 发现页：功能导航、RWA权证、DAO资产池 |
| /ai | AIAssistant.jsx | AI管家：32个功能Tab |
| /defi | DeFi.jsx | DeFi金融：流动性挖矿 |
| /prediction | PredictionMarket.jsx | 预测市场：下注、AI托管、持仓 |
| /OTC | OTC.jsx | C2C法币OTC交易 |
| /profile | Profile.jsx | 个人中心：等级、推荐、成就 |
| /docs | Documentation.jsx | 文档中心 |
| /admin | AdminPanel.jsx | 管理后台 |
| /explorer | Explorer.jsx | 区块浏览器 |
| /whitepaper | Whitepaper.jsx | 白皮书 |
| /metapay | MetaPay.jsx | 元Pay支付品牌 |
| /metalife | MetaLife.jsx | 元Life生态 |
| /landing | Landing.jsx | 落地页 |
| /cloudstorage | CloudStorage.jsx | 云存储 |
| /lifescience | LifeScience.jsx | 生命科学 |
| /shortvideo | ShortVideo.jsx | 短视频 |
| /nearby | NearbyMerchants.jsx | 附近商家 |
| /fixeddeposit | FixedDeposit.jsx | 定期存款 |
| /useractivity | UserActivity.jsx | 用户动态 |
| /onchainagent | OnChainAgent.jsx | 链上Agent |
| /digitalrights | DigitalRights.jsx | 数字版权 |
| /singularity | Singularity.jsx | 奇点 |

### 6.2 布局系统

**`src/Layout.jsx`** 提供响应式布局：
- **桌面端**：左侧/顶部导航栏（15个导航项）
- **移动端**：底部导航栏（7个移动页面：Home, Wallet, NearbyMerchants, QuantDashboard, Profile, PaymentCenter, NFTMarket）
- **落地页**：全屏无导航

**导航项**：
```javascript
const navItems = [
  { name: "首页", icon: Home, page: "Home" },
  { name: "AI量化", icon: BarChart3, page: "QuantDashboard" },
  { name: "浏览器", icon: Search, page: "Explorer" },
  { name: "钱包", icon: Wallet, page: "Wallet" },
  { name: "支付", icon: CreditCard, page: "PaymentCenter" },
  { name: "附近", icon: MapPin, page: "NearbyMerchants" },
  { name: "动态", icon: Users, page: "UserActivity" },
  { name: "NFT市场", icon: Image, page: "NFTMarket" },
  { name: "DeFi", icon: TrendingUp, page: "DeFi" },
  { name: "社交", icon: MessageCircle, page: "Social" },
  { name: "AI管家", icon: Bot, page: "AIAssistant" },
  { name: "元Life", icon: LayoutGrid, page: "MetaLife" },
  { name: "文档", icon: FileText, page: "Documentation" },
  { name: "管理", icon: Shield, page: "AdminPanel" },
  { name: "监控", icon: Atom, page: "Monitor" },
];
```

---

## 7. 核心业务逻辑与公式

### 7.1 消费分红模型（单笔 ¥100 消费）

```
消费者:    +100 NMS  (1:1 返利)
商家成本:   -10 NMS  (打赏比例 10%，可调 5-30%)
商家返还:   +20 NMS  (双倍返还)
VIP推荐人:  +20 NMS  (永久 20%)
极差奖励:   72.9%   (M1-M9 级差分配，每级 8.1%)
杰出贡献:    7.1%   (DAO 投票分配)
NFT分红池:  +10 NMS  (实物 NFT + 门店 NFT 各 50%)
```

### 7.2 9×9×9 释放机制

**基础公式**：
```
释放天数 = 999 - (等级序号 / 13) × (999 - 31)
       = 999 - (等级序号 / 13) × 968

加速倍数 = 999 / 释放天数

日释放量 = 待释放余额 / 释放天数
```

**三维度加速**：
```
总等级 = 消费维度(0-9) + 推荐维度(0-9) + NFT合成维度(0-9)  (最高27)
释放天数 = 999 - (总等级 / 27) × (999 - 31)
```

**各等级释放周期**：

| 等级 | 序号 | 释放天数 | 加速倍数 |
|------|------|----------|----------|
| 普通用户 | 0 | 999天 | 1.0x |
| 金卡 | 1 | 925天 | 1.08x |
| 白金卡 | 2 | 850天 | 1.18x |
| 钻石卡 | 3 | 776天 | 1.29x |
| 黑金卡M1 | 4 | 701天 | 1.43x |
| 黑金卡M2 | 5 | 627天 | 1.59x |
| 黑金卡M3 | 6 | 552天 | 1.81x |
| 黑金卡M4 | 7 | 478天 | 2.09x |
| 黑金卡M5 | 8 | 403天 | 2.48x |
| 黑金卡M6 | 9 | 329天 | 3.04x |
| 黑金卡M7 | 10 | 254天 | 3.93x |
| 黑金卡M8 | 11 | 180天 | 5.55x |
| 黑金卡M9 | 12 | 105天 | 9.51x |
| 杰出贡献者 | 13 | 31天 | 32.2x |

### 7.3 团队矩阵 9 层

| 层级 | 人数 | 奖励% |
|------|------|-------|
| 直推 | 8 | 20% |
| 2层 | 32 | 10% |
| 3层 | 128 | 5% |
| 4层 | 256 | 3% |
| 5层 | 512 | 2% |
| 6层 | 1024 | 1% |
| 7层 | 2048 | 0.5% |
| 8层 | 4096 | 0.3% |
| 9层 | 8192 | 0.2% |

### 7.4 NFT 版税四方分配

```
永久版税: 10% = 推荐人 2.5% + 商家 2.5% + 节点 2.5% + 平台 2.5%
```

### 7.5 VIP/商家大礼包定价

| 礼包 | 总价(¥) | 现金(75%) | NMS支付(25%) | 首购赠送NMS | 释放周期 |
|------|---------|-----------|-------------|------------|---------|
| 金卡 | 99 | 74 | 25 | 200 | 925天 |
| 白金卡 | 199 | 149 | 50 | 400 | 850天 |
| 钻石卡 | 499 | 374 | 125 | 1000 | 776天 |
| 商家 | 499 | 374 | 125 | 1000 | 701天 |

### 7.6 个人发布 NFT 锁定机制

```
NFT总价 = 单价 × 发行数量
锁定NMS = NFT总价 × 锁定比例(25-45%)
```

### 7.7 消费凭证上链（销毁返还）

```
消费总额 = AI识别(元)
销毁NMS = 消费总额 × 销毁比例(25-45%)
返还NMS = 消费总额 × 1.0  (1:1)
```

### 7.8 AI 熔断触发条件

| 触发条件 | 阈值 | 动作 |
|----------|------|------|
| 全网流动性异常波动 | 波动率 > 25% | 暂停所有跨链调度 |
| 单矿池资产风险加剧 | 风险评分 > 75 | 从高风险矿池撤回至安全池 |
| 智能合约异常 | 审计告警 | 冻结相关资产 |
| 跨链桥延迟 | 确认 > 30min | 暂停桥接通道 |

### 7.9 OTC 交易流程

```
选择商家广告 → 确认金额/支付方式 → 平台Escrow锁定代币
→ 买家线下付款(C2C聊天+倒计时) → 买家确认付款 → 卖家放行
→ 交易完成(量子签名存证) → 日历同步截止日期
```

### 7.10 RWA 5 步确权流程

```
Step1 基本信息 → Step2 图片上传 → Step3 RWA确权(法律公证+AI合规+DOI存证+多签)
→ Step4 版税设置(四方2.5%各) → Step5 确认上链(冻结保证金10%)
```

### 7.11 商家质押 5 步流程

```
提交申请 → KYC实名 → 质押保证金 → 审核确认 → 权限自动开通
```

商家信誉等级（按质押+交易量）：

| 等级 | 质押金额 | 最少交易数 |
|------|----------|-----------|
| S级 | ≥¥100,000 | ≥500 |
| A级 | ≥¥50,000 | ≥200 |
| B级 | ≥¥30,000 | ≥100 |
| C级 | ≥¥10,000 | ≥30 |
| D级 | 0 | 0 |

---

## 8. 功能模块详细规格

### 8.1 首页 (Home.jsx)

- 余额卡片（可用NMS、待释放、ACS/YSE/GCP）
- 签到打卡（连续签到奖励）
- 商城入口
- 链上资产仪表盘
- 附近商家（地图+列表）
- VIP/商家大礼包购买专区（推荐人代激活）
- NMS介绍卡片（9×9×9释放说明）
- 推荐系统（统一推荐码）
- AI智能搜索入口

### 8.2 钱包 (Wallet.jsx)

- 五子账户（主/储蓄/交易/质押/消费）
- NMS价格走势图（30天面积图+指导价+RMB估值）
- 释放进度可视化（9×9×9进度条+三维度加速）
- NFT资产列表
- 交易历史
- P2P钱包中心
- Agentic Wallet（Web4.0 AI+ZK钱包）
- 转账/收款弹窗
- 释放计划弹窗（7日前瞻）
- 收益明细弹窗

### 8.3 支付中心 (PaymentCenter.jsx)

- 用户端：扫码付（摄像头扫码）→ 识别商家 → 输入金额 → DID打赏 → 链上结算
- 商家端：RWA上架、二维码收款、商家仪表盘
- 支付结果弹窗（元Pay品牌）：余额更新+释放计划+分红明细+版税分配
- 所有金额输入 `min="0"` 防负数

### 8.4 DEX交易所 (DEXTrading.jsx)

- **订单簿模式**（Hyperliquid L2）：OrderBook + CandlestickChart + TradePanel + RecentTrades + AITradingAssistant
- **一键兑换**（SwapInterface）：5代币互兑、25/50/75/100%快捷比例、滑点设置、0Gas
- **多周期K线**：1m/5m/15m/1H/4H/1D/1W
- **杠杆交易**：1x-125x
- **永续合约**：0资金费率、AI风控自动止损

### 8.5 NFT市场 (NFTMarket.jsx)

- 四类NFT：实物/门店/节点/个人
- NFT合成系统（9×9×9矩阵）
- 二级市场（版税自动结算）
- RWA交易市场（融合）
- 5步RWA上架流程
- 个人NFT发布（NMS锁定25-45%）
- 消费凭证上链（销毁25-45% NMS → 1:1返还）
- 跨链NFT池
- 供应链溯源
- NFT仲裁
- NFT数字孪生

### 8.6 AI量化 (QuantDashboard.jsx)

- 策略工作室（套利/收益农场/做市/趋势/情绪）
- AI引擎（Minara-AI，InvokeLLM集成）
- Alpha系统（六因子模型：动量25%+均值回归20%+流动性15%+波动率15%+链上情绪15%+跨链价差10%）
- 风控熔断（AICircuitBreaker）
- 跨链调度（CrossChainRebalancer）
- 多智能体竞技场
- 进化优化
- 回测系统
- 永续合约交易
- 套利监控
- 策略可视化编辑器

### 8.7 监控中心 (Monitor.jsx)

- 资产监控中心（跨链桥+RWA+量子合约+AI风控+合约审计五位一体）
- AI熔断器
- 自动风险执行器
- 量子风险仪表盘
- 合约审计面板

### 8.8 社交 (Social.jsx) — P2P 聚焦

- P2P社交中心（加密聊天/DID身份/数字分身/AI助手/动态/信用/名片/红包/精英）
- 全国区划DAO聊天（省/市/区/街道）
- 隐私加密聊天（Kyber-768 E2E）
- 社区动态

### 8.9 发现页 (Discover.jsx)

- 功能导航
- RWA权证
- DAO资产池

### 8.10 AI管家 (AIAssistant.jsx) — 32个Tab

| 功能域 | 组件 |
|--------|------|
| 资产管理 | WealthDashboard, NFTPortfolio, AIAgentWallet, AssetInsurance |
| 交易策略 | StrategyRecommendation, StrategyBuilder, QuantBacktest |
| 跨链桥 | CrossChainBridge, LayerZeroBridge, QuantumBridge |
| 安全审计 | QuantumPrivacyAudit, QuantumPrivacyDashboard, QuantumContractManager, ZKAuditPanel |
| 治理 | GovernanceDashboard, EnhancedGovernance, DOAChainAssistant |
| RWA | RWATokenizationHub, NFTLending, NFTCrossChainSynth |
| 数据分析 | DataAnalyticsDashboard, MacroMonitor, PriceAlerts |
| AI核心 | EvolvingAICore, AILifeEvolution, AILifeMonitor, VoiceAIAgent, ReleaseStrategyAdvisor |
| 挖矿 | QuantumMiningPool, GlobalHashrateScheduler |
| 社交 | AgentSocialSquare, OpenClawTeam |
| 自治经济 | AutonomousEconomy, LaunchSuccess |

### 8.11 AI智能搜索 (AISmartSearch.jsx)

- 评分搜索（名称100分 > 关键词50分 > 包含20分）
- 语音输入（Web Speech API 中文识别）
- 任务执行（"打开C2C法币交易"自动导航）
- 客服问答（18条知识库 + LLM兜底）
- 四级响应：导航指令 → 模块搜索 → 知识库 → LLM

### 8.12 C2C法币OTC (OTC.jsx)

- 8种法币（CNY/USD/EUR/JPY/KRW/HKD/SGD/GBP）
- 4种支付方式（支付宝/微信/银行转账/现金存款）
- 商家广告列表（价格/限额/支付方式/双维度信誉）
- 担保Escrow交易流程
- C2C实时聊天+图片+15分钟倒计时
- 商家审核面板（质押可视化+KYC+执照）
- 商家质押5步流程
- DAO争议仲裁
- 日历同步（ICS下载）

### 8.13 Web4.0 Agentic钱包 (AgenticWallet.jsx)

- AI + ZK框架（Kyber-768 KEM 零知识证明）
- 自托管多链（NMS Chain / Ethereum / Polygon / BNB Chain）
- Agent一等公民（套利/风控/复投/跨链调度，无资产转移权）
- 私钥永不离开本地设备

### 8.14 9×9×9释放进度可视化 (WalletReleaseProgress.jsx)

- 主进度条：释放进度% + 剩余天数
- 加速进度条：加速因子 vs 最大32.2x
- 三维度等级展示
- 每日释放量计算

### 8.15 ZK智能审计 (ZKAuditPanel.jsx)

RWA资产多签审计5步：
1. 资产确权（RWA上链+所有权ZK证明）
2. AI合规评分（Minara-AI）
3. 多签公证（3/5委员会）
4. ZK证明生成（Kyber-768）
5. 链上存证（DOI+不可篡改记录）

### 8.16 AI释放策略顾问 (ReleaseStrategyAdvisor.jsx)

根据钱包余额+晋升等级建议最佳NMS释放策略：
- P1 晋升加速释放（提升等级缩短周期）
- P2 商城兑换消费（1:1返还+三维度提升）
- P3 NFT合成维度（提升NFT合成等级）
- P4 DeFi质押增值（年化12-25%+释放加速叠加）

### 8.17 日历同步 (CalendarSync.jsx)

- 同步OTC截止日期和股息支付日期
- 生成ICS日历文件下载
- 单事件/批量同步
- 紧急事件红色高亮
- 提醒开关

### 8.18 预测市场 (PredictionMarket.jsx)

- 投入→收益可视化
- YES/NO概率条 + AI置信度
- 快捷金额按钮（50/100/500/1000 NMS）
- AI托管一键开关（85%+止盈，30%-止损）
- 持仓P&L实时展示

### 8.19 多方式注册 (UserRegistration.jsx)

- 4步流程：选择身份 → 账户验证 → 支付 → 成功
- 3种验证：手机号（60s倒计时）/ 邮箱（60s倒计时）/ 钱包地址（MetaMask/WalletConnect）
- 支付混合：NMS 0-25%滑块 + ACS/现金补足
- 推荐码绑定

### 8.20 团队增长可视化 (TeamGrowthChart.jsx)

- recharts双线折线图（用户/商家团队月增长）
- 晋升进度条（当前→下一里程碑）

---

## 9. 组件清单与分类

### 9.1 组件目录结构

```
src/components/
├── ui/                 # shadcn/ui 基础组件（60+）
├── home/               # VIPGiftPackage, NMSIntro, MallEntrance, SignInCard, QuantumNetworkScreen
├── payment/            # PaymentResultModal, EnhancedScanPay, CameraScanPay, ScanPayModal, TransferWithScan, BalanceCard, ScanButton, MerchantQRCode, AggregateQRCode
├── wallet/             # NMSPriceChart, P2PWalletHub, EarningsDetailModal, ReleaseScheduleModal, ReceiveQRCode, WalletReleaseProgress, AgenticWallet
├── otc/               # OTCExchange, OTCAuditPanel, OTCChatDialog, MerchantStakingFlow
├── referral/          # ReferralSystem, ReferralQRCode, TeamGrowthChart
├── promotion/         # PromotionLevelCard
├── nft/               # NFTSynthesisSystem, NFTSecondaryMarket, NFTArbitration, SupplyChainTracker, CrossChainNFTPool, NFTForgeWorkshop, SynthesisMaterialsCard, NFTDetailDrawer, NFTDetailModal, NFTPurchaseModal, PersonalNFTPublish, NFTMintOnConsume, AssetDigitalTwin, NFTMarketEnhanced
├── merchant/          # MerchantDashboard, RWANFTListingModal, NFTMintConsole, MerchantPhotoPublish, MerchantDetail, NearbyMerchants, MerchantShareSystem
├── dex/               # CandlestickChart, OrderBook, TradePanel, RecentTrades, AITradingAssistant
├── quant/             # StrategyStudio, CrossChainRebalancer, MinaraAIEngine, MultiAgentArena, EvolutionArena, AlphaSystem, QuantumRiskAlert, AutoRiskExecutor, AICircuitBreaker, CrossChainDispatch, CrossChainYieldFarm, StrategyVisualEditor, StrategyLab, AgentWorkflow, PerpetualTrading, ArbitrageMonitor, DeepBacktestPanel
├── monitor/           # AICircuitBreaker, AutoRiskExecutor, QuantumRiskDashboard, AssetMonitorCenter, ContractAuditPanel
├── social/            # P2PSocialHub, P2PMessenger, DIDEncryptedChat, EnhancedFeed, DigitalAvatarChat, RedPacketRain, EliteClub, CommunityFeed, SocialGraphAnalysis, CrossChainReputation, MetaBusinessCard, ClawAISocial, SocialTrading, DAOAssetPool
├── dao/               # RWADashboard, RWASecondaryMarket, ChinaRegionChat, P2PDAOChat, RegionChat, DAOCommunityChat, MultiLangCollaborator, DAOBadgeSystem, DAOAssetPool
├── ai-assistant/      # AISmartSearch, WealthDashboard, NFTPortfolio, AIAgentWallet, AssetInsurance, StrategyRecommendation, StrategyBuilder, QuantBacktest, CrossChainBridge, LayerZeroBridge, QuantumBridge, QuantumPrivacyAudit, QuantumPrivacyDashboard, QuantumContractManager, GovernanceDashboard, EnhancedGovernance, DOAChainAssistant, RWATokenizationHub, NFTLending, NFTCrossChainSynth, DataAnalyticsDashboard, MacroMonitor, PriceAlerts, EvolvingAICore, AILifeEvolution, AILifeMonitor, VoiceAIAgent, QuantumMiningPool, GlobalHashrateScheduler, AgentSocialSquare, OpenClawTeam, AutonomousEconomy, LaunchSuccess, ReleaseStrategyAdvisor, ZKAuditPanel
├── bridge/            # QuantumBridge, LayerZeroBridge
├── calendar/          # CalendarSync
├── dashboard/         # OnChainAssetDashboard
├── defi/              # AddLiquidity, LiquidityManager
├── swap/              # SwapInterface
├── insurance/         # QuantumAssetInsurance
├── identity/          # DOAIdentityHub, ChainIdentityHub
├── blockchain/        # AssetProvenanceEngine
├── quantum/           # QuantumChatPanel
├── rwa/               # RWADigitalTwin
├── digital-rights/   # AssetProvenance
├── prediction/       # PredictionAIAssistant
├── admin/             # AssetManager, AdminAIAssistant
├── layout/            # BottomNav
├── gamification/      # AchievementsLeaderboard, XPNotification, DailyChallenges, StakingRewards
├── data/              # DataExchange
├── p2p/               # P2PMessenger
├── profile/           # ReferralTopCard, ShareCodeCard, ReferralStatsDetail, DisplaySettings, NotificationSettings, DataAssetDetail, NFTDetailList, ProfileHero, AchievementBadges, UserProfileEditor, ActivityFeed
├── user/              # UserRegistration, UserDashboard
└── monitor/           # ContractAuditPanel, AssetMonitorCenter, AutoRiskExecutor, QuantumRiskDashboard, AICircuitBreaker
```

### 9.2 组件设计原则

- 每个组件文件 ≤ 50 行（大型组件拆分为子组件）
- 每个新组件/页面获得自己的新文件
- 默认导出，名称与文件名相同
- 使用 `@/` 别名导入，不使用相对路径

---

## 10. 安全模型

| 维度 | 机制 |
|------|------|
| 账户安全 | Kyber-768 量子签名、DID 身份 |
| 交易安全 | 0 Gas + 量子签名、实时风控 |
| 资产安全 | AI 熔断、多签审核、保证金冻结 |
| 合约安全 | 量子合约审计、Rabby 式风险检测 |
| 隐私安全 | P2P 端对端加密、Hypercore 去中心化存储 |
| RWA 安全 | 法律公证 + AI 合规 + 多签 + DOI 存证 + VC 凭证 |
| 输入安全 | 所有金融输入 `min="0"` + onChange 负数检查 |
| Agent安全 | 私钥本地、ZK证明验证、无资产转移权 |

---

## 11. 复现步骤

### 步骤 1：初始化项目

在 Base44 平台创建 React + Vite + Tailwind CSS 应用。

### 步骤 2：安装依赖

确认 `package.json` 包含第 2.1 节列出的所有 npm 包。

### 步骤 3：创建单一真相源

创建 `src/lib/promotionData.js`（见第 4.3 节完整代码）。

### 步骤 4：创建统一推荐 Hook

创建 `src/hooks/useReferral.js`（见第 4.4 节完整代码）。

### 步骤 5：创建数据实体

按第 4.2 节顺序在 `base44/entities/` 创建 13 个 JSON Schema 实体。

### 步骤 6：配置设计系统

更新 `src/index.css`（暗色主题 CSS 变量）和 `tailwind.config.js`（色彩映射）。

### 步骤 7：创建布局系统

创建 `src/Layout.jsx`（响应式导航：桌面头部 + 移动底部栏）和 `src/components/layout/BottomNav.jsx`。

### 步骤 8：创建核心页面

按第 6.1 节路由清单创建 26+ 页面组件，每个页面导入对应组件模块。

### 步骤 9：创建功能组件

按第 9.1 节目录结构创建所有组件，每个组件 ≤ 50 行。

### 步骤 10：配置路由

在 `src/App.jsx` 注册所有页面路由，在 `src/pages.config.js` 配置页面映射。

### 步骤 11：创建文档

创建 `src/docs/WHITEPAPER.md` 和 `src/docs/TECHNICAL_ARCHITECTURE.md`。

### 步骤 12：验证

- 控制台零错误
- 所有金融输入 `min="0"`
- 9×9×9 释放周期全站一致（999→31天）
- 晋升等级引用单一真相源
- 移动端+桌面端响应式正常

---

## 12. 验收标准

| 检查项 | 标准 |
|--------|------|
| 页面数量 | ≥ 26 个可访问页面 |
| 实体数量 | 13 个 JSON Schema 实体 |
| 组件数量 | ≥ 150 个功能组件 |
| 控制台错误 | 0 |
| 9×9×9 一致性 | 全站引用 promotionData.js |
| 输入验证 | 所有金融输入 min="0" + 负数检查 |
| 响应式 | 移动端底部导航 + 桌面端头部导航 |
| 暗色主题 | 深蓝背景 + 青色强调 |
| 中文界面 | 所有 UI 文案中文 |
| ESM 规范 | 无 require()/module.exports |
| 路由 | App.jsx 注册所有路由 + PageNotFound |
| 单一真相源 | promotionData.js 被所有模块引用 |

---

## 附录：版本演进

| 版本 | 关键特性 |
|------|----------|
| V7.0 | AI 量化、NFT 合成、跨链 |
| V8.0 | RWA 5 步确权、AI 风控熔断、链上资产仪表盘、P2P 社交重构 |
| V8.1 | 个人发布NFT+NMS锁定、消费凭证销毁返还、推荐系统M1-M9、AI预测市场、AI Alpha量化 |
| V8.2 | DEX深化(Hyperliquid+Lighter)、多方式注册、公链架构深化 |
| V8.3 | 统一推荐系统(useReferral Hook) |
| V8.4 | C2C法币OTC、NMS走势图、AI智能搜索、支付后分红体系 |
| V8.5 | 9×9×9释放深化、C2C安全保障、AI搜索评分、元Pay品牌 |
| V8.6 | DEX一键兑换、VIP/商家大礼包、晋升系统每级释放天数 |
| V8.7 | 会员卡制、C2C聊天+倒计时、统一推荐码 |
| V8.8 | 大礼包精确定价、OTC商家审核、DID扫码打赏 |
| V8.9 | 大礼包深化、C2C体验、推荐统一、审计面板 |
| V9.0 | 社交P2P化、负数防护、团队增长可视化、日历同步、RWA融合 |
| V9.1 | 晋升单一真相源、双维度信誉等级、翻倍NMS自动释放 |
| V10.0 | 商家质押流程、技术架构白皮书、模块融合完善 |
| V11.0 | Web4.0 Agentic钱包、RWA融合至AI商城、9×9×9释放进度可视化 |
| V12.0 | 白皮书V12.0、全站逻辑一致性核验 |
| V13.0 | ZK智能审计面板、AI释放策略顾问、AIAssistant标签页合并优化(37→32) |

---

*NMS MetaLife — 消费即分红，共同富裕的 Web3 生态。*
*本文档为完整可复现的提示词工程文档，输入给 AI 开发助手即可从零重建整个系统。*