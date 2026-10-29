# NMS MetaLife · 元生活公链（V13.0 提示词复现版）

> 一个「消费即分红、共同富裕」的 Web3 生活生态：RWA 资产代币化 · AI 量化与自动风控熔断 · P2P 社交 · DAO 治理 · C2C 法币 OTC · 9×9×9 释放机制 · Web4.0 Agentic 钱包。

本项目依据仓库内《NMS AI 公链应用系统提示词 V1.0》（对应系统 V13.0）从零复现，并**交叉核对**《NMS 公链白皮书 V13.0》《NMS 技术架构白皮书 V11.0》《NMS 技术架构设计文档 V9.1》三份文档，是一套**可直接运行的前端全栈演示系统**：
React 18 + Vite + Tailwind CSS 3 + shadcn 风格组件 + recharts + framer-motion，33 个可访问路由、13 个 JSON Schema 实体、四代币经济模型与全套业务公式。

---

## 快速开始

```bash
npm install
npm run dev        # 开发模式 http://127.0.0.1:5173
npm run build      # 生产构建
npm run preview    # 预览构建产物
npm run check:routes  # 全路由 SSR 渲染冒烟测试（33 条路由）
```

首次访问即写入演示种子数据（13 个实体 + 演示用户 `demo@nms.ai`）。
在「管理后台 → 系统设置 → 重置演示数据」可随时还原。

---

## 技术栈

| 层 | 选型 |
|---|---|
| 框架 | React 18.3 · Vite 5 · React Router 6 |
| 样式 | Tailwind CSS 3（暗色金融科技主题，CSS 变量驱动） |
| 组件 | shadcn 风格自研组件库（button/card/dialog/tabs/progress/slider/switch/select…） |
| 图表 | recharts（面积图/柱状图/雷达图/折线图）+ 纯 SVG 手绘 K 线 |
| 动效 | framer-motion |
| 图标 | lucide-react（已校验全部图标名存在） |
| 文档渲染 | react-markdown + remark-gfm |
| 数据层 | 本地 BaaS 模拟层（localStorage），API 契约与 Base44 SDK 一致 |

> **关于 Base44**：原始项目运行在 Base44 BaaS 上。本复现版用 `src/api/base44Client.js` 完整模拟了同一套 API
> （`entities.X.list/filter/get/create/update/delete/subscribe`、`auth.me`、`integrations.Core.InvokeLLM/UploadFile/SendEmail`），
> 因此所有业务代码的写法与真实 Base44 项目完全一致，替换 `base44Client` 为官方 SDK 即可接入真实后端。

---

## 目录结构

```
.
├── base44/entities/           # 13 个实体 JSON Schema（按依赖顺序）
├── docs/                      # 原始规范文档（白皮书 / 技术架构 / 设计文档 / 复现提示词）
├── scripts/ssr-check.jsx      # 全路由渲染冒烟测试
└── src/
    ├── api/
    │   ├── base44Client.js    # BaaS 模拟层（实体存储 / 认证 / 集成 / 实时订阅）
    │   ├── schemas.js         # 13 个实体 Schema 单一真相源
    │   └── seed.js            # 演示种子数据
    ├── lib/
    │   ├── promotionData.js   # ★ 晋升/矩阵/信誉 单一真相源（999→31 天公式）
    │   ├── engine.js          # ★ 业务引擎：消费分红 / 释放 / 版税 / 熔断
    │   ├── market.js          # 行情模拟（价格序列 / K 线 / 订单簿）
    │   ├── format.js          # 数字·地址·时间格式化、量子签名
    │   └── utils.js           # cn()
    ├── hooks/                 # useReferral / useSession / useEntity
    ├── components/
    │   ├── ui/                # 基础组件
    │   ├── common/            # PageHeader / StatCard / SectionCard
    │   ├── quantum/           # L1-L4 架构 / 量子安全 / 矿池调度 / 跨链桥 / 合约管理
    │   ├── auth/              # 多方式注册（手机 / 邮箱 / 钱包 × 4 步）
    │   ├── calendar/          # CalendarSync（RFC 5545 .ics 导出）
    │   ├── home wallet payment nft dex quant monitor social otc merchant
    │   │   referral promotion defi dashboard ai-assistant docs layout
    ├── pages/                 # 33 个页面
    ├── docs/                  # 应用内渲染的 Markdown 文档
    ├── Layout.jsx             # 桌面侧栏（15 项）+ 移动底部导航（7 项）
    ├── pages.config.js        # 路由 ↔ 页面映射
    └── App.jsx                # 路由注册 + 404
```

---

## 核心业务实现

### 单一真相源（防数值漂移）

`src/lib/promotionData.js` 是全站唯一的等级/矩阵/信誉数据源：

```js
释放天数 = 999 − (等级序号 / 13) × (999 − 31)   // 999 天 → 31 天
加速倍数 = 999 / 释放天数                       // 最高 32.2x
```

| 等级 | 序号 | 释放天数 | 加速 |
|---|---|---|---|
| 普通用户 | 0 | 999 | 1.00x |
| 钻石卡 | 3 | 776 | 1.29x |
| 黑金卡 M1 | 4 | 701 | 1.43x |
| 黑金卡 M3 | 6 | 552 | 1.81x |
| 黑金卡 M6 | 9 | 329 | 3.04x |
| 黑金卡 M9 | 12 | 105 | 9.51x |
| 杰出贡献者 | 13 | 31 | 32.2x |

三维度加速（消费 + 推荐 + NFT 合成，各 0-9 级，共 27 级）：
`释放天数 = 999 − (总等级 / 27) × 968`，可在首页「NMS 是什么？」中实时试算。

### 消费分红模型（单笔 ¥100）

```
消费者   +100 NMS（1:1 返利）
商家成本 −10  NMS（打赏 10%，可调 5-30%）
商家返还 +20  NMS（双倍返还至分红池）
VIP推荐  +20  NMS（永久 20%）
级差奖励 72.9%（M1-M9 每级 8.1%）
杰出贡献 7.1% （DAO 投票分配）
NFT 池   +10  NMS（实物/门店各 50%）
```

### 其他已落地规则

- **永久版税 10%**：推荐人 / 商家 / 节点 / 平台各 2.5%，二级市场成交自动结算
- **RWA 五步确权**：信息 → 图片 → 法律公证 + AI 合规 + 3/5 多签 + DOI → 版税 → 上链冻结 10% 保证金
- **个人发布 NFT**：按发行总价锁定 25-45% NMS
- **消费凭证上链**：销毁 25-45% NMS → 1:1 返还
- **AI 熔断**：波动 >25% 暂停跨链 / 矿池风险 >75 撤回 / 审计告警冻结 / 桥延迟 >30min 暂停
- **商家信誉双维度**：S/A/B/C/D（质押 + 交易量），用户 VIP1-3（累计消费）
- **OTC 担保**：Escrow 锁定 → 15 分钟倒计时 → 买家确认 → 卖家放行 → ICS 日历同步
- **金融输入防护**：所有金额输入 `min="0"` + `sanitizeAmount` 负数拦截

---

## 页面清单（33 个路由）

| 路由 | 页面 | 路由 | 页面 |
|---|---|---|---|
| `/` | 首页 | `/docs` | 文档中心 |
| `/Champions` | 社区动态 | `/admin` | 管理后台 |
| `/quantum` | 量子公链架构（L1-L4 / 矿池 / 跨链 / 合约） | `/explorer` | 区块浏览器 |
| `/register` | 多方式注册（手机 / 邮箱 / 钱包） | `/whitepaper` | 白皮书 |
| `/wallet` | 钱包（五子账户 / P2P / Agentic） | `/metapay` | 元Pay |
| `/payment` | 支付中心（扫码付 / 商家端） | `/metalife` | 元Life |
| `/nft` | AI 商城（NFT / RWA / 合成） | `/landing` | 落地页（无导航） |
| `/dex` | DEX（订单簿 / 兑换 / 永续） | `/cloudstorage` | 元存储 |
| `/quant` | AI 量化（策略 / Alpha 信号 / 回测） | `/lifescience` | 生命科学 |
| `/monitor` | 监控中心 | `/shortvideo` | 短视频 |
| `/social` | 元Social（DAO / 加密聊天 / P2P） | `/nearby` | 附近商家 |
| `/discover` | 发现（四代币 / DAO 池） | `/fixeddeposit` | 定期存款 |
| `/ai` | AI 管家（32 项能力） | `/useractivity` | 用户动态 |
| `/defi` | DeFi（流动性 / 定期质押） | `/onchainagent` | 链上 Agent |
| `/prediction` | 预测市场 | `/digitalrights` | 数字版权 |
| `/OTC` | C2C 法币 OTC | `/singularity` | 奇点 |
| `/profile` | 个人中心（14 级晋升） | | |

---

## v4：App 化 · P2P 落地 · 全链路闭环

### 手机端 App 适配（PWA）
- `public/manifest.webmanifest`：standalone 显示、竖屏、主题色、3 个快捷方式（扫码/钱包/邀请）
- `public/sw.js`：应用外壳预缓存 + 导航网络优先、离线回退 `index.html`；静态资源缓存优先后台更新
- `index.html`：apple-touch-icon、apple-mobile-web-app-*、viewport-fit=cover、OG 标签
- `MobileQuickBar`：移动端右下角悬浮快捷操作（扫码付/收款/邀请/客服），桌面隐藏
- 安全区适配（`.safe-bottom`）+ 触控目标 ≥ 36px

### P2P 技术落地（真实可运行，非模拟）
`src/lib/p2p.js` 用 **BroadcastChannel 作网络层**：同源每个标签页 = 一个对等节点，
互发 hello/heartbeat、维护 peer 表与延迟、同步 append-only 账本（每条带 hash + prevHash，哈希去重）。
打开新标签页即加入网络，`P2PNetworkPanel` 可实时看到在线节点、账本高度、同步事件与广播消息。

### 消费 / 分红 / 扫码 / 支付 / 推荐 全链路
| 能力 | 实现 |
|---|---|
| 扫码 | `SmartScanner`：`BarcodeDetector` + `getUserMedia` 真实识别；不支持时自动降级手动输入，流程不中断 |
| 支付 | 支付方式四选（NMS/ACS/微信/支付宝），写入 `PaymentOrder.payment_method`，0 Gas 结算 |
| 分红 | `DividendCenter`：五类分红明细、待结算、一键复投 / 提现（真实写 `Transaction` 与余额） |
| 推荐 | `/invite?ref=CODE` 落地页：绑定确认、二维码 SVG 下载、9 层矩阵分布、奖励口径说明 |

### 生产级加固
- `ErrorBoundary` 全局错误边界（可恢复界面，不白屏）
- `OfflineBanner` 断网提示（本地缓存与 P2P 账本仍可用）
- 构建分包：react / charts / markdown / motion 独立 chunk，主包 1.53MB → 690KB（gzip 232KB）
- `vite.config` 区分 SSR 构建，避免 manualChunks 与 external 冲突

---

## v8：幂等键下沉 · 退款审批流 · 每日对账定时任务

### 幂等键下沉到前端

原来每次点击都生成新 key（`pay_<merchant>_<random>`），重试会产生第二笔订单。现在改为**业务单号派生**：

```
前端生成 orderNo（NMS + 时间戳）→ 存入 ref → 幂等键 = `pay_${orderNo}`
失败重试 → 沿用同一 orderNo → 服务端命中幂等 → 返回首次结果，不重复扣款
支付成功 → 清空 ref，下一笔重新生成
```

服务端 `pay()` 接收 `orderNo`，缺省时才兜底生成，保证"同一业务单只有一笔账"。

### 退款审批流

不再"点了就退"，改为三级风控：

| 金额 | 风险 | 处理 |
|---|---|---|
| ≤ ¥500 | low | **自动通过**，立即退款（记录 `auto_approved`） |
| ¥500 – ¥5,000 | medium | 进入 `pending`，商家/管理员确认后放行 |
| > ¥5,000 | high | 进入 `pending`，**仅 admin/owner 可批**，其他身份 403 |

- 同一支付单重复申请自动去重（返回已有 pending）
- 审批接口幂等：重复审批返回当前状态，不重复退款
- 驳回不改变支付单状态（仍为 `settled`）

```bash
POST /api/pay/refund/request        { paymentId, reason }
GET  /api/admin/refunds?status=pending
POST /api/admin/refunds/:id/approve { note }
POST /api/admin/refunds/:id/reject  { note }
```

前端「管理后台 → 数据后端 → 退款审批」直接显示待审条目与通过/驳回按钮。

### 每日对账定时任务

服务端启动即排程，每天 **00:00** 自动执行一次对账并落库（`reconcile_runs`），异常写入 `alerts` 并推送 webhook。

```
RECONCILE_HOUR=0           执行小时（默认 0 点）
RECONCILE_ON_BOOT=1        启动时先跑一次
ALERT_WEBHOOK=<url>        异常时 POST 告警（企业微信/飞书/Slack 通用 JSON）
```

- 对账结果落库：日期、触发方式（cron/manual/boot）、是否账平、通道差额、订单/交易笔数与金额、哈希链状态
- 不平或链断 → 写 `alerts`（level=error）+ 控制台红字 + webhook
- `GET /api/admin/reconcile/runs` 查看历史与下次执行时间
- 管理后台「对账任务」卡展示：每日执行时间、下次时间、最近 3 次结果、未读告警数

### 测试

```bash
node scripts/test-pay.mjs      # 25 项：支付通道
node scripts/test-refund.mjs   # 18 项：退款审批 + 对账任务 + 告警
```

## v7：自研支付通道（原子扣款 / 幂等 / 对账 / 签名收款码）

服务端权威实现，前端 `ScanPayModal` 在 `VITE_API_MODE=server` 时自动切到通道（本地模式仍走 localStorage 演示）。

### 支付主流程

```
校验（商家/余额/签名） → 锁定（available → locked） → 记账（订单 + 链上交易 + NFT + 商家池）
→ 结算（locked → 0，返利到账） → 链式存证（prevHash 串接）
```

- **单事务**：任一步失败整体 `ROLLBACK`，不会出现"扣了钱没订单"
- **幂等键**：`POST /api/pay` 必带 `idempotencyKey`，重复请求返回首次结果（`idempotent: true`），不重复扣款
- **退款**：`POST /api/pay/refund`，以支付单状态做幂等，重复调用安全

```bash
curl -X POST http://127.0.0.1:8787/api/pay \
  -H "content-type: application/json" \
  -d '{"merchantId":"store_1","amount":100,"method":"nms","idempotencyKey":"order_20261029_001"}'
```

### 对账

`GET /api/admin/reconcile?date=YYYY-MM-DD` 同时核对三方：

| 维度 | 说明 |
|---|---|
| `channelDiff` | 通道记录（payments）与业务订单（PaymentOrder）逐笔对齐差额，**必须为 0** |
| `diff` | 订单汇总 − 链上交易汇总（含历史种子数据，仅供观察） |
| `orphanPayments` | 有通道记录但没有订单 → 严重异常 |
| `orphanOrders` / `legacyOrphans` | 有订单但没有对应交易 → 历史数据标记 |
| `chain` | 账本哈希链完整性（`prevHash` 逐条校验） |

`balanced = channelDiff ≈ 0 && orphanPayments.length === 0`。管理后台「数据后端 → 支付通道对账」可一键执行。

### 签名收款码

```
NMS1.<base64url(payload)>.<HMAC-SHA256 前 32 位>
payload = { v, mid, code, name, iat, exp? }
```

- 商家侧：`POST /api/qr/sign` 生成（可设 TTL 做限时码）
- 扫码侧：`POST /api/qr/verify` 先验签再下单，篡改即拒（`bad_signature`）
- 前端 `SmartScanner` 扫到 `NMS1.` 前缀会走验签，失败直接拦截

### 测试

```bash
npm run server &          # 先起服务
node scripts/test-pay.mjs # 25 项断言：签名/验签/篡改/幂等/余额守恒/分账/超额拦截/退款/对账/哈希链
```

## v6：本地服务端 + SQLite 数据库 + Cloudflare 部署

前端原本用 localStorage 模拟 BaaS。现在提供**真实服务端**，同一套 API 契约，两种运行模式：

| 模式 | 启动 | 存储 |
|---|---|---|
| local（默认） | `npm run dev` | 浏览器 localStorage，离线可用 |
| server | `npm run server` + `VITE_API_MODE=server npm run dev` | SQLite（`server/data/nms.db`，Node 内置 `node:sqlite`，零第三方依赖） |

### 服务端

```bash
npm run server          # → http://127.0.0.1:8787
curl http://127.0.0.1:8787/api/health
```

接口与 `base44Client` 完全一致：

```
GET    /api/health
GET    /api/schemas
POST   /api/entities/:name/list      { sort, limit }
POST   /api/entities/:name/filter    { query, sort, limit }
GET    /api/entities/:name/:id
POST   /api/entities/:name           create
PATCH  /api/entities/:name/:id       update
DELETE /api/entities/:name/:id
POST   /api/auth/me | /api/auth/login
POST   /api/integrations/llm
POST   /api/admin/seed | /api/admin/reset
```

- 表结构由 `server/schema.json`（前端实体 Schema 导出）自动生成，Schema 演进时自动补列
- 首次启动自动导入 `server/seed.json`（13 实体 / 126 行演示数据）
- 管理后台「数据后端」可一键把浏览器里的演示数据迁移到 SQLite

### Cloudflare 部署（Workers + D1）

```bash
npx wrangler d1 create nms-metalife            # 记下 database_id
npx wrangler d1 execute nms-metalife --file=./cloudflare/migrations/0001_schema.sql --remote
npx wrangler d1 execute nms-metalife --file=./cloudflare/migrations/0002_seed.sql   --remote
npx wrangler deploy --config cloudflare/wrangler.toml
```

前端切到线上：`VITE_API_MODE=server VITE_API_BASE=https://<worker>/api npm run build`。
详见 `cloudflare/README.md`（含 Workers Assets 同域方案与数据迁移）。

---

## UI 设计系统（v3）

深色金融科技 + 毛玻璃 + 彩色光效，全部由 `src/index.css` 的 utility 统一提供：

| 类 | 用途 |
|---|---|
| `.glass` / `.glass-panel` / `.glass-soft` | 三级毛玻璃：卡片 / 侧栏顶栏弹窗 / 嵌套小块 |
| `.glass-hover` | 悬浮抬升 2px + 青色描边 + 外发光 |
| `.glow-{cyan,emerald,violet,amber,rose}` | 图标与徽标彩色光晕 |
| `.aurora` | 页面级极光背景（4 个 blur-3xl 色斑，22s 漂移） |
| `.gradient-text` | 主数字/大标题 青→绿→紫 渐变（9s 平移） |
| `.neon-border` | 渐变描边强调卡 |

配套改动：`StatCard` 按 accent 输出彩色光斑与底部光条；`Card`/`Dialog`/`Tabs`/`Input`/`Badge`/`Button` 全部玻璃化；
所有动效在 `prefers-reduced-motion: reduce` 下自动关闭。

---

## 与三份文档的交叉落地

除提示词外，本项目逐章核对了《公链白皮书 V13.0》《技术架构白皮书 V11.0》《技术架构设计文档 V9.1》，补齐了提示词中未展开但文档明确要求的模块：

| 文档出处 | 要求 | 本项目落地 |
|---|---|---|
| 白皮书 2.1 / 技术白皮书 2 / 设计文档 2 | L1 网络 / L2 共识 / L3 协议 / L4 应用 四层架构 | `/quantum` · `LayerStack`（可展开四层，含 Hyperswarm/Hypercore/Kyber-768） |
| 白皮书 2.2 | PoS + AI 验证、3/5 多签、0 Gas | `/quantum` 共识出块流程 + 节点 AI 评分降权表 |
| 白皮书 2.3 / 技术白皮书 15.1 | Kyber-768 KEM + Dilithium 签名、`quantum_signature` / `signature_time_ms` | `QuantumSecurityMatrix`（算法矩阵 + 一键签名演示，输出真实字段） |
| 技术白皮书 2.2 / L3 表 | 7 个协议合约（RWAMint / Royalty / CircuitBreaker / Governance / LayerZero / ReleaseAccelerator / MerchantStaking） | `QuantumContractManager`（版本 / 权限 / 3-5 多签升级提案） |
| 技术白皮书 14 / 白皮书 18.4 | 跨链桥接、30min 延迟熔断 | `QuantumBridge`（5 链 4 通道，延迟 >30min 自动熔断） |
| 技术白皮书 6.2 / 白皮书 15.3 | 量子矿池、算力调度 | `QuantumMiningPool`（4 池 + 收益/风险/均衡三种调度策略） |
| 白皮书 17 / 设计文档 19 | 手机 / 邮箱 / 钱包三种注册方式，4 步流程、验证码倒计时 | `/register` · `RegisterFlow`（含钱包连接、礼包支付、推荐码归因） |
| 白皮书 15.2-15.4 | Alpha 信号生成、自动执行、30 日策略 vs 基准 | `AlphaSignals`（信号表 + 总开关/自动执行 + 净值对比） |
| 白皮书 7.2 / 技术白皮书 12.1 | DID 身份、Kyber-768 E2E、文本/图片/红包/NFT 四类消息 | `DIDEncryptedChat`（可切换"查看密文"） |
| 技术白皮书 8 | CalendarSync 组件，导出 .ics | `CalendarSync`（RFC 5545），已接入释放计划与质押到期 |
| 白皮书 5.3 | 2 张同店 NFT + 1 张合成通宝 → 高阶 NFT，729 种组合 | `NFTSynthesisSystem`（含通宝铸造 800 NMS、同店校验） |
| 设计文档 5.1 | 风险评分加权模型 + 四档熔断区间 | `AICircuitBreaker`（0-50 正常 / 50-75 警戒 / 75-90 熔断 / 90-100 紧急） |

---

## 验收对照（提示词第 12 节）

| 检查项 | 标准 | 实现 |
|---|---|---|
| 页面数量 | ≥ 26 | 33 |
| 实体数量 | 13 JSON Schema | `base44/entities/*.json` 13 个 |
| 组件数量 | ≥ 150 功能组件 | 79 个组件文件 + 34 个页面（合计 113 个模块文件） |
| 控制台错误 | 0 | 33 路由 SSR 渲染全部通过 |
| 9×9×9 一致性 | 全站引用 promotionData.js | 首页试算 / 钱包进度 / 晋升卡 / 白皮书表格同源 |
| 输入验证 | 所有金融输入 min="0" | 全部 `type="number" min="0"` + 负数拦截 |
| 响应式 | 移动底部 + 桌面侧栏 | `Layout.jsx` + `BottomNav.jsx` |
| 暗色主题 | 深蓝背景 + 青色强调 | `src/index.css` CSS 变量 |
| 中文界面 | 全中文 | ✅ |
| ESM 规范 | 无 require/module.exports | ✅ |

---

## 免责声明

本项目为**技术复现与演示**：所有链上数据、行情、AI 回复、量子签名均为本地模拟，不构成任何投资建议，也未接入真实资金与公链。
原始需求文档见 `docs/` 目录。
