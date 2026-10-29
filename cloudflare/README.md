# Cloudflare 部署指南（Workers + D1）

本目录是 NMS MetaLife 的**边缘部署形态**：与本地 `server/` 同一套路由与数据结构，
前端只需把 API 地址指向 Worker 域名即可，无需改业务代码。

## 结构

```
cloudflare/
├── wrangler.toml            # Worker 配置（D1 绑定、兼容日期）
├── migrations/
│   ├── 0001_schema.sql      # 13 张表 DDL（由 scripts/gen-cloudflare.mjs 生成）
│   └── 0002_seed.sql        # 演示数据 INSERT（同上）
└── src/
    ├── index.js             # Worker 路由（D1 异步 API）
    └── entities.js          # 实体元数据（自动生成）
```

## 部署步骤

```bash
# 0. 安装 wrangler（只需一次）
npm i -D wrangler

# 1. 创建 D1 数据库，记下返回的 database_id
npx wrangler d1 create nms-metalife

# 2. 把 database_id 填进 cloudflare/wrangler.toml

# 3. 建表 + 灌入演示数据（--remote 表示线上库；去掉则写本地 .wrangler）
npx wrangler d1 execute nms-metalife --file=./cloudflare/migrations/0001_schema.sql --remote
npx wrangler d1 execute nms-metalife --file=./cloudflare/migrations/0002_seed.sql   --remote

# 4. 发布 Worker
npx wrangler deploy --config cloudflare/wrangler.toml
# → https://nms-metalife-api.<your-subdomain>.workers.dev

# 5. 本地联调（可选）
npx wrangler dev --config cloudflare/wrangler.toml
```

## 前端接入

```bash
# 指向 Worker（跨域已由 Worker 的 CORS 头放行）
VITE_API_MODE=server VITE_API_BASE=https://nms-metalife-api.xxx.workers.dev/api npm run build
```

同时把前端静态资源也放到 Cloudflare（二选一）：

- **Pages**：`npm run build` 后把 `dist/` 上传到 Cloudflare Pages
- **Workers Assets**：在 `wrangler.toml` 里打开 `[assets]`，`directory = "../dist"`，
  同一域名下 `/api/*` 走 Worker、其余走静态资源（推荐，省一次跨域）

## 数据迁移

`0002_seed.sql` 只是演示数据。生产迁移用接口：

```bash
curl -X POST https://<worker>/api/admin/seed \
  -H "content-type: application/json" \
  -d @server/seed.json
```

或在前端「管理后台 → 系统设置 → 数据后端 → 迁移本地数据」一键推送。

## 与本地服务端的差异

| 项 | 本地 server/ | Cloudflare Worker |
|---|---|---|
| 驱动 | `node:sqlite`（同步） | D1（异步 `prepare/bind/all`） |
| 存储 | `server/data/nms.db` | D1 托管 SQLite |
| 鉴权 | Bearer token / x-user-email | 同（生产建议接 Access 或 JWT） |
| 限流 | 内存计数 | 建议接 Cloudflare Rate Limiting |
| AI | 可转发任意 LLM | 同（用 env.LLM_API_KEY） |

SQL 方言一致，迁移脚本可直接复用；复杂查询建议在 D1 侧加索引（`0001_schema.sql` 已建 `created_date` 索引）。
