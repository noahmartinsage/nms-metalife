/**
 * 阿里云 KMS 接入初始化
 *
 * 用法：
 *   node scripts/kms-aliyun-setup.mjs --dry-run        只打印步骤，不调用云 API
 *   node scripts/kms-aliyun-setup.mjs --check          校验 AK / 密钥连通性
 *   node scripts/kms-aliyun-setup.mjs                  创建密钥 + 加密本地 KEK，输出环境变量
 *   node scripts/kms-aliyun-setup.mjs --sign-key       额外创建签名密钥（可选，SM2/ECDSA）
 *
 * 前置环境变量：
 *   ALIYUN_ACCESS_KEY_ID / ALIYUN_ACCESS_KEY_SECRET
 *   ALIYUN_KMS_REGION（默认 cn-hangzhou）
 */
import crypto from "node:crypto";
import aliyun from "../server/kms-aliyun.mjs";

const args = new Set(process.argv.slice(2));
const DRY = args.has("--dry-run");
const CHECK = args.has("--check");
const SIGN_KEY = args.has("--sign-key");

const line = (s = "") => console.log(s);
const head = (s) => line(`\n${"=".repeat(60)}\n${s}\n${"=".repeat(60)}`);

async function dryRun() {
  head("阿里云 KMS 接入步骤（dry-run，不调用云 API）");
  line(`
1) 创建 RAM 子账号并只授予 KMS 权限
   - 控制台 → 访问控制 RAM → 用户 → 创建用户（仅勾选「OpenAPI 调用访问」）
   - 记录 AccessKey ID / Secret（Secret 只显示一次）
   - 授权策略（最小权限）：
       AliyunKMSFullAccess  ← 仅开发期使用
       生产建议自定义策略，只允许指定 KeyId 的 Encrypt/Decrypt/Sign/Verify：
       {
         "Version": "1",
         "Statement": [{
           "Effect": "Allow",
           "Action": ["kms:Encrypt","kms:Decrypt","kms:DescribeKey"],
           "Resource": ["acs:kms:cn-hangzhou:*:key/<你的KeyId>"]
         }]
       }

2) 创建 KMS 密钥
   - 密钥管理服务 KMS → 密钥管理 → 创建密钥
   - 密钥类型：对称密钥（AES-256），用途：ENCRYPT_DECRYPT
   - 记录 KeyId（形如 key-xxxxxxxxxxxx）

3) 生成并加密本地 KEK
   - 本脚本生成 48 字节随机数 → 调用 KMS Encrypt → 只保存 CiphertextBlob
   - 明文 KEK 不落盘、不进日志

4) 配置环境变量（写入 .env，勿提交仓库）
   NMS_KMS_KEK_PROVIDER=aliyun
   ALIYUN_ACCESS_KEY_ID=...
   ALIYUN_ACCESS_KEY_SECRET=...
   ALIYUN_KMS_REGION=cn-hangzhou
   NMS_KMS_ALIYUN_KEY_ID=key-xxxxxxxxxxxx
   NMS_KMS_ALIYUN_SEALED_KEK=<脚本输出>

5) 重启服务并验证
   npm run server
   curl http://127.0.0.1:8787/api/kms/health | jq .aliyun
   → 期望 "cloudKek": true，"keystore": "aliyun-kms"

6) 轮换与审计
   - 根密钥轮换：在控制台「轮换」或创建新 KeyId，用本脚本重新加密 KEK 后替换环境变量
   - 所有 Encrypt/Decrypt 调用都会出现在「操作审计」中
`);
}

async function check() {
  head("连通性检查");
  const c = aliyun.config();
  line(`Region      : ${c.region}`);
  line(`Endpoint    : ${c.endpoint}`);
  line(`AK 已配置   : ${c.ak ? "是（" + c.ak.slice(0, 6) + "***" + c.ak.slice(-4) + "）" : "否"}`);
  if (!aliyun.isConfigured()) {
    line("\n❌ 缺少 ALIYUN_ACCESS_KEY_ID / ALIYUN_ACCESS_KEY_SECRET");
    process.exit(1);
  }
  if (!c.keyId) {
    line("\n⚠️  未配置 NMS_KMS_ALIYUN_KEY_ID，跳过 DescribeKey");
    return;
  }
  try {
    const meta = await aliyun.describeKey(c.keyId);
    line(`\n✅ DescribeKey 成功`);
    line(`KeyId       : ${meta.KeyId || c.keyId}`);
    line(`KeySpec     : ${meta.KeySpec || "—"}`);
    line(`KeyUsage    : ${meta.KeyUsage || "—"}`);
    line(`状态        : ${meta.KeyState || "—"}`);
  } catch (e) {
    line(`\n❌ DescribeKey 失败：${e.message}`);
    if (e.detail) line(`   ${JSON.stringify(e.detail)}`);
    process.exit(1);
  }
}

async function setup() {
  head("创建密钥并加密 KEK");
  if (!aliyun.isConfigured()) {
    line("❌ 缺少 ALIYUN_ACCESS_KEY_ID / ALIYUN_ACCESS_KEY_SECRET");
    line("   先设置环境变量，或用 --dry-run 查看完整步骤");
    process.exit(1);
  }

  const c = aliyun.config();
  let keyId = c.keyId;

  if (!keyId) {
    line("→ 创建对称密钥（AES_256 / ENCRYPT_DECRYPT）…");
    const created = await aliyun.createKey({
      keySpec: "AES_256",
      keyUsage: "ENCRYPT_DECRYPT",
      description: "NMS MetaLife KEK",
    });
    keyId = created.keyId;
    line(`✅ KeyId = ${keyId}`);
  } else {
    line(`→ 复用已有 KeyId = ${keyId}`);
  }

  line("→ 生成 48 字节随机 KEK 并调用 KMS 加密 …");
  const kek = crypto.randomBytes(48);
  let sealed;
  try {
    sealed = await aliyun.encrypt(kek);
  } finally {
    kek.fill(0);
  }
  line("✅ KEK 已加密，明文已清零");

  let signKeyId = "";
  if (SIGN_KEY) {
    line("→ 创建签名密钥（EC_P256 / SIGN_VERIFY）…");
    const sk = await aliyun.createKey({
      keySpec: "EC_P256",
      keyUsage: "SIGN_VERIFY",
      description: "NMS MetaLife 链上签名（云端）",
    });
    signKeyId = sk.keyId;
    line(`✅ 签名 KeyId = ${signKeyId}`);
  }

  head("请将以下内容写入 .env（切勿提交仓库）");
  line(`NMS_KMS_KEK_PROVIDER=aliyun`);
  line(`ALIYUN_ACCESS_KEY_ID=${c.ak}`);
  line(`ALIYUN_ACCESS_KEY_SECRET=<你的 Secret，此处不打印>`);
  line(`ALIYUN_KMS_REGION=${c.region}`);
  line(`NMS_KMS_ALIYUN_KEY_ID=${keyId}`);
  line(`NMS_KMS_ALIYUN_SEALED_KEK=${sealed}`);
  if (signKeyId) {
    line(`NMS_KMS_SIGNER=aliyun`);
    line(`NMS_KMS_ALIYUN_SIGN_KEY_ID=${signKeyId}`);
    line(`NMS_KMS_ALIYUN_SIGN_ALGORITHM=ECDSA_SHA_256`);
  }
  line("\n提示：SEALED_KEK 只能配合同一 KeyId 解密，换 KeyId 需重新执行本脚本。");
}

if (DRY) {
  await dryRun();
} else if (CHECK) {
  await check();
} else {
  await setup();
}
