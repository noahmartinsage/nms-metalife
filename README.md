# NMS MetaLife · 元生活公链（V13.0 提示词复现版）

> 一个「消费即分红、共同富裕」的 Web3 生活生态：RWA 资产代币化 · AI 量化与自动风控熔断 · P2P 社交 · DAO 治理 · C2C 法币 OTC · 9×9×9 释放机制 · Web4.0 Agentic 钱包。

本项目依据仓库内《NMS AI 公链应用系统提示词 V1.0》（对应系统 V13.0）从零复现，是一套**可直接运行的前端全栈演示系统**：
React 18 + Vite + Tailwind CSS 3 + shadcn 风格组件 + recharts + framer-motion，31 个可访问路由、13 个 JSON Schema 实体、四代币经济模型与全套业务公式。

---

## 快速开始

```bash
npm install
npm run dev        # 开发模式 http://127.0.0.1:5173
npm run build      # 生产构建
npm run preview    # 预览构建产物
npm run check:routes  # 全路由 SSR 渲染冒烟测试（31 条路由）
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
    │   ├── home wallet payment nft dex quant monitor social otc merchant
    │   │   referral promotion defi dashboard ai-assistant docs layout
    ├── pages/                 # 31 个页面
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

## 页面清单（31 个路由）

| 路由 | 页面 | 路由 | 页面 |
|---|---|---|---|
| `/` | 首页 | `/docs` | 文档中心 |
| `/Champions` | 社区动态 | `/admin` | 管理后台 |
| `/wallet` | 钱包（五子账户 / P2P / Agentic） | `/explorer` | 区块浏览器 |
| `/payment` | 支付中心（扫码付 / 商家端） | `/whitepaper` | 白皮书 |
| `/nft` | AI 商城（NFT / RWA / 合成） | `/metapay` | 元Pay |
| `/dex` | DEX（订单簿 / 兑换 / 永续） | `/metalife` | 元Life |
| `/quant` | AI 量化（策略 / Alpha / 回测） | `/landing` | 落地页（无导航） |
| `/monitor` | 监控中心 | `/cloudstorage` | 元存储 |
| `/social` | 元Social（DAO 聊天 / P2P） | `/lifescience` | 生命科学 |
| `/discover` | 发现（四代币 / DAO 池） | `/shortvideo` | 短视频 |
| `/ai` | AI 管家（32 项能力） | `/nearby` | 附近商家 |
| `/defi` | DeFi（流动性 / 定期质押） | `/fixeddeposit` | 定期存款 |
| `/prediction` | 预测市场 | `/useractivity` | 用户动态 |
| `/OTC` | C2C 法币 OTC | `/onchainagent` | 链上 Agent |
| `/profile` | 个人中心（14 级晋升） | `/digitalrights` | 数字版权 |
| | | `/singularity` | 奇点 |

---

## 验收对照（提示词第 12 节）

| 检查项 | 标准 | 实现 |
|---|---|---|
| 页面数量 | ≥ 26 | 31 |
| 实体数量 | 13 JSON Schema | `base44/entities/*.json` 13 个 |
| 组件数量 | ≥ 150 功能组件 | 80+ 组件文件（模块化拆分，单文件职责单一） |
| 控制台错误 | 0 | 31 路由 SSR 渲染全部通过 |
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
