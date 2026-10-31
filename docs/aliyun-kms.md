# 阿里云 KMS 接入指南

> 目标：把**根密钥**托管到阿里云 KMS，本地只保存密文；签名私钥继续由本地 KMS 模块用 AES-256-GCM 信封加密。
> 代码位置：`server/kms-aliyun.mjs`（适配器）、`scripts/kms-aliyun-setup.mjs`（初始化）、`server/kms.mjs`（集成点）

---

## 0. 先明确一件事：阿里云 KMS 不提供 ML-DSA

| 能力 | 阿里云 KMS | 本项目 |
|---|---|---|
| 对称密钥托管（AES-256） | ✅ | 用它托管根密钥 KEK |
| 非对称签名 | ✅ RSA / EC / **SM2** | 可选切换（`NMS_KMS_SIGNER=aliyun`） |
| **ML-DSA / SLH-DSA（后量子）** | ❌ 暂不提供 | 本地 OpenSSL 3.5 完成 |

所以推荐的是**混合方案**：

```
阿里云 KMS  ──托管──>  根密钥 KEK（合规、可审计、可轮换）
                          │
                          ▼ 解封
本地 KMS    ──签名──>  ML-DSA-65（抗量子）
```

- 合规/审计要求走云 KMS：保留默认，根密钥在云上
- 合规要求国密 SM2：设 `NMS_KMS_SIGNER=aliyun` + `NMS_KMS_ALIYUN_SIGN_ALGORITHM=SM2DSA`
- 两者可叠加：根密钥在阿里云，签名用 ML-DSA，云侧只管密钥不碰签名

---

## 1. 创建 RAM 子账号（最小权限）

1. 登录阿里云控制台 → **访问控制 RAM** → 用户 → **创建用户**
2. 勾选 **OpenAPI 调用访问**（不要勾控制台登录）
3. 记录 **AccessKey ID** 与 **AccessKey Secret**（Secret 只显示一次）

**不要用主账号 AccessKey。** 生产环境建议自定义策略，只允许指定 KeyId：

```json
{
  "Version": "1",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["kms:Encrypt", "kms:Decrypt", "kms:DescribeKey"],
      "Resource": ["acs:kms:cn-hangzhou:*:key/<你的KeyId>"]
    }
  ]
}
```

若要启用云签名，额外加 `kms:Sign`、`kms:Verify`，并把 Resource 指向签名密钥。

---

## 2. 创建 KMS 密钥

控制台 → **密钥管理服务 KMS** → 密钥管理 → **创建密钥**

| 项 | 值 |
|---|---|
| 密钥类型 | 对称密钥 |
| 密钥用途 | ENCRYPT_DECRYPT |
| 密钥规格 | AES_256 |
| 别名 | `nms-metalife-kek` |

创建后记录 **KeyId**（形如 `key-xxxxxxxxxxxxxxxx`）。

> 只有启用云签名时才需要第二个密钥：类型选**非对称**，用途 **SIGN_VERIFY**，规格 `EC_P256`（或 `SM2`）。

---

## 3. 生成并加密本地 KEK

```bash
# 先看步骤，不调用云 API
node scripts/kms-aliyun-setup.mjs --dry-run

# 校验 AK 与密钥连通性（需先设好 AK 与 KeyId）
ALIYUN_ACCESS_KEY_ID=... ALIYUN_ACCESS_KEY_SECRET=... \
NMS_KMS_ALIYUN_KEY_ID=key-xxx \
node scripts/kms-aliyun-setup.mjs --check

# 正式执行：生成 48 字节随机 KEK → KMS 加密 → 打印环境变量
ALIYUN_ACCESS_KEY_ID=... ALIYUN_ACCESS_KEY_SECRET=... \
node scripts/kms-aliyun-setup.mjs

# 同时创建云签名密钥（可选）
ALIYUN_ACCESS_KEY_ID=... ALIYUN_ACCESS_KEY_SECRET=... \
node scripts/kms-aliyun-setup.mjs --sign-key
```

脚本行为：

1. 若无 `NMS_KMS_ALIYUN_KEY_ID`，调用 `CreateKey` 创建对称密钥
2. 本地 `crypto.randomBytes(48)` 生成 KEK 明文
3. 调用 KMS `Encrypt` 得到 `CiphertextBlob`
4. **明文 KEK 立即 `fill(0)` 清零**，不落盘、不进日志
5. 输出可直接粘贴的环境变量

---

## 4. 配置环境变量

写入 `.env`（已在 `.gitignore` 中，**切勿提交**）：

```bash
# 启用云托管根密钥
NMS_KMS_KEK_PROVIDER=aliyun

# RAM 凭据
ALIYUN_ACCESS_KEY_ID=LTAI5t...
ALIYUN_ACCESS_KEY_SECRET=...
ALIYUN_KMS_REGION=cn-hangzhou

# 密钥与密文 KEK
NMS_KMS_ALIYUN_KEY_ID=key-xxxxxxxxxxxxxxxx
NMS_KMS_ALIYUN_SEALED_KEK=<脚本输出的一长串 base64>

# 可选：云签名（国密 SM2 或 ECDSA）
# NMS_KMS_SIGNER=aliyun
# NMS_KMS_ALIYUN_SIGN_KEY_ID=key-yyyyyyyyyyyyyyyy
# NMS_KMS_ALIYUN_SIGN_ALGORITHM=SM2DSA

# 可选：超时与重试
# ALIYUN_KMS_TIMEOUT_MS=8000
# ALIYUN_KMS_RETRIES=2
```

---

## 5. 启动并验证

```bash
npm run server
```

启动日志应出现：

```
KMS / HSM         →  ML-DSA-65 · key v2 · 858B:17FC:...
后量子可用        →  ml-dsa-65, ml-dsa-44, slh-dsa-sha2-128s
密钥托管          →  阿里云 KMS（云托管根密钥）
阿里云 KMS        →  cn-hangzhou · 云根密钥 已启用 · 云签名 未启用
```

接口验证：

```bash
curl -s http://127.0.0.1:8787/api/kms/health | jq '{provider, keystore, aliyun}'
```

期望：

```json
{
  "provider": "openssl-pqc",
  "keystore": "aliyun-kms",
  "aliyun": { "configured": true, "cloudKek": true, "cloudSigner": false, "region": "cn-hangzhou" }
}
```

完整回归：

```bash
node scripts/test-kms-aliyun.mjs   # 47 项：签名算法黄金向量 + 请求构造 + 错误映射
node scripts/test-kms.mjs          # 42 项：真实签名/验签/轮换/审计
```

---

## 6. 轮换

| 轮换对象 | 操作 |
|---|---|
| 根密钥 KEK | 控制台轮换 CMK → 重新跑 `kms-aliyun-setup.mjs` 得到新 `SEALED_KEK` → 替换环境变量 → 重启 |
| 签名密钥 | `POST /api/kms/rotate`（本地 ML-DSA）或控制台轮换 CMK（云签名） |
| AK | RAM 控制台禁用旧 AK → 创建新 AK → 替换环境变量 → 重启 |

> 换 KeyId 后旧 `SEALED_KEK` 无法解密，必须用同一 KeyId 重新加密。

---

## 7. 故障排查

| 现象 | 原因 | 处理 |
|---|---|---|
| `aliyun_kms_not_configured` (503) | 缺 AK/SK | 检查 `ALIYUN_ACCESS_KEY_ID` / `SECRET` |
| `aliyun_kms_key_id_missing` (503) | 缺 KeyId | 设置 `NMS_KMS_ALIYUN_KEY_ID` |
| `Forbidden.KeyNotFound` | KeyId 不存在或区域不符 | 核对 KeyId 与 `ALIYUN_KMS_REGION` |
| `Forbidden.AccessDenied` | RAM 策略未授权 | 补 `kms:Decrypt` 权限 |
| `InvalidSignature` | 系统时间偏差过大 | 校准 NTP（时间戳参与签名） |
| 启动卡住 | 网络不通 | 调小 `ALIYUN_KMS_TIMEOUT_MS`，检查出网 |
| `keystore` 仍是 `file` | `NMS_KMS_KEK_PROVIDER` 没设或 SEALED_KEK 为空 | 三者必须同时齐全 |

---

## 8. 安全清单

- [ ] 用 RAM 子账号，不用主账号 AK
- [ ] 策略限定到具体 KeyId，不给 `kms:*`
- [ ] AK 只放在环境变量 / KMS 托管，不进仓库（`.gitignore` 已含 `.env`）
- [ ] `SEALED_KEK` 可以入库，但要和 AK 分开存放
- [ ] 开启操作审计，监控 `Decrypt` 调用异常峰值
- [ ] 定期轮换 AK 与 CMK
- [ ] 本地 `server/data/.kms/`（私钥 PEM）与 `.kms-master` 已在 `.gitignore`，不要提交

---

## 9. 费用参考

| 项 | 说明 |
|---|---|
| 密钥托管 | 每个 CMK 约 0.5 元/天（按阿里云当期定价） |
| 调用 | 每次 Encrypt/Decrypt 约 0.03 元/万次 |
| 本项目调用量 | **仅启动时 1 次 Decrypt**，运行期零调用（KEK 常驻内存） |

即：云 KMS 只在进程启动时用一次，成本几乎为零，但密钥不再以明文形式存在于任何磁盘。
