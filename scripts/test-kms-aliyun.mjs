/**
 * 阿里云 KMS 适配器验证（无需真实凭据）
 *
 * 覆盖：
 *   - 签名算法与阿里云官方样例逐字节一致（黄金向量）
 *   - percentEncode / canonicalQuery 边界
 *   - 配置探测与降级
 *   - 通过注入 mock transport 验证请求构造、响应解析、错误映射
 *   - health 不泄露 Secret
 */
import crypto from "node:crypto";
import aliyun from "../server/kms-aliyun.mjs";

let pass = 0;
let fail = 0;
const ok = (n, c, d = "") => {
  c ? (pass++, console.log(`  ✅ ${n}${d ? " — " + d : ""}`)) : (fail++, console.log(`  ❌ ${n}${d ? " — " + d : ""}`));
};

/* 环境隔离：先清空，再按用例设置 */
const KEYS = [
  "ALIYUN_ACCESS_KEY_ID",
  "ALIYUN_ACCESS_KEY_SECRET",
  "ALIYUN_KMS_REGION",
  "ALIYUN_KMS_ENDPOINT",
  "NMS_KMS_KEK_PROVIDER",
  "NMS_KMS_ALIYUN_KEY_ID",
  "NMS_KMS_ALIYUN_SEALED_KEK",
  "NMS_KMS_SIGNER",
  "NMS_KMS_ALIYUN_SIGN_KEY_ID",
  "NMS_KMS_ALIYUN_SIGN_ALGORITHM",
];
const clearEnv = () => KEYS.forEach((k) => delete process.env[k]);

console.log("\n=== 阿里云 KMS 适配器验证 ===\n");

/* ---------------- 1. 签名算法黄金向量 ---------------- */
console.log("1) 签名算法（阿里云官方样例）");
const goldenParams = {
  AccessKeyId: "testid",
  Action: "DescribeRegions",
  Format: "XML",
  SignatureMethod: "HMAC-SHA1",
  SignatureNonce: "3ee8c1b8-83d3-44af-a94f-4e0ad82fd6cf",
  SignatureVersion: "1.0",
  Timestamp: "2016-02-23T12:46:24Z",
  Version: "2014-05-26",
};
const goldenSig = aliyun.sign(goldenParams, "testsecret", "GET");
ok("签名与官方样例一致", goldenSig === "OLeaidS1JvxuMvnyHOwuJ+uX5qY=", goldenSig);
ok(
  "canonicalQuery 按 key 字典序",
  aliyun.canonicalQuery({ b: "2", a: "1", c: "3" }) === "a=1&b=2&c=3"
);
ok(
  "canonicalQuery 跳过空值",
  aliyun.canonicalQuery({ a: "1", b: "", c: null, d: undefined }) === "a=1"
);
ok("空格编码为 %20", aliyun.percentEncode("a b") === "a%20b");
ok("星号编码为 %2A", aliyun.percentEncode("a*b") === "a%2Ab");
ok("波浪号保持原样", aliyun.percentEncode("a~b") === "a~b");
ok("斜杠编码为 %2F", aliyun.percentEncode("/") === "%2F");
ok("时间戳冒号编码为 %3A", aliyun.percentEncode("12:00") === "12%3A00");
ok("中文按 UTF-8 编码", aliyun.percentEncode("中") === "%E4%B8%AD");
ok("空串不报错", aliyun.percentEncode("") === "");

/* ---------------- 2. 配置探测 ---------------- */
console.log("\n2) 配置探测与降级");
clearEnv();
ok("无凭据 → isConfigured=false", aliyun.isConfigured() === false);
ok("无凭据 → 不启用云根密钥", aliyun.useCloudKek() === false);
ok("无凭据 → 不启用云签名", aliyun.useCloudSigner() === false);

process.env.ALIYUN_ACCESS_KEY_ID = "test-ak";
process.env.ALIYUN_ACCESS_KEY_SECRET = "test-sk";
ok("有凭据 → isConfigured=true", aliyun.isConfigured() === true);
ok("默认区域 cn-hangzhou", aliyun.config().region === "cn-hangzhou");
ok(
  "默认 endpoint 按区域拼装",
  aliyun.config().endpoint === "https://kms.cn-hangzhou.aliyuncs.com",
  aliyun.config().endpoint
);

process.env.NMS_KMS_KEK_PROVIDER = "aliyun";
ok("仅 provider 无 keyId → 不启用云根密钥", aliyun.useCloudKek() === false);
process.env.NMS_KMS_ALIYUN_KEY_ID = "key-12345678";
ok("有 keyId 无 sealed → 不启用云根密钥", aliyun.useCloudKek() === false);
process.env.NMS_KMS_ALIYUN_SEALED_KEK = "c2VhbGVk";
ok("三者齐全 → 启用云根密钥", aliyun.useCloudKek() === true);

process.env.NMS_KMS_SIGNER = "aliyun";
ok("无签名 keyId → 不启用云签名", aliyun.useCloudSigner() === false);
process.env.NMS_KMS_ALIYUN_SIGN_KEY_ID = "key-sign123456";
ok("有签名 keyId → 启用云签名", aliyun.useCloudSigner() === true);

/* ---------------- 3. health 不泄露 ---------------- */
console.log("\n3) 健康信息脱敏");
const h = aliyun.health();
ok("health 不含 Secret", !JSON.stringify(h).includes("test-sk"));
ok("health 不含完整 AK", !JSON.stringify(h).includes("test-ak"));
ok("health 显示配置状态", h.configured === true);
ok("health 显示云根密钥已启用", h.cloudKek === true);
ok("health 上报签名算法", h.signatureMethod.includes("HMAC-SHA1"), h.signatureMethod);
ok("keyId 只暴露后 8 位", h.keyIdSuffix === "12345678", h.keyIdSuffix);

/* ---------------- 4. 请求构造（mock transport） ---------------- */
console.log("\n4) 请求构造与响应解析（mock）");
const captured = [];
aliyun.__setTransport(async (url) => {
  captured.push(url);
  const u = new URL(url);
  const action = u.searchParams.get("Action");
  const bodies = {
    Encrypt: { CiphertextBlob: Buffer.from("sealed-kek-bytes").toString("base64"), KeyId: "key-12345678" },
    Decrypt: { Plaintext: Buffer.from("plain-kek-bytes").toString("base64"), KeyId: "key-12345678" },
    DescribeKey: { KeyMetadata: { KeyId: "key-12345678", KeySpec: "AES_256", KeyUsage: "ENCRYPT_DECRYPT", KeyState: "Enabled" } },
    CreateKey: { KeyId: "key-new987654", KeyMetadata: { KeyId: "key-new987654" } },
    Sign: { Signature: "bW9jay1zaWc=", KeyId: "key-sign123456" },
    Verify: { Value: true, KeyId: "key-sign123456" },
  };
  return {
    ok: true,
    status: 200,
    text: async () => JSON.stringify(bodies[action] || {}),
  };
});

const enc = await aliyun.encrypt(Buffer.from("plain-kek-bytes"));
ok("Encrypt 返回 CiphertextBlob", !!enc, `${enc.length} 字符`);

const encUrl = new URL(captured[captured.length - 1]);
ok("请求带 Action=Encrypt", encUrl.searchParams.get("Action") === "Encrypt");
ok("请求带 Version", encUrl.searchParams.get("Version") === "2016-01-20");
ok("请求带 Signature", (encUrl.searchParams.get("Signature") || "").length > 10);
ok("请求带 SignatureMethod=HMAC-SHA1", encUrl.searchParams.get("SignatureMethod") === "HMAC-SHA1");
ok("请求带 Timestamp", /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(encUrl.searchParams.get("Timestamp") || ""));
ok("请求带 SignatureNonce", (encUrl.searchParams.get("SignatureNonce") || "").length === 32);
ok("明文以 base64 传输", encUrl.searchParams.get("Plaintext") === Buffer.from("plain-kek-bytes").toString("base64"));

const dec = await aliyun.decrypt(enc);
ok("Decrypt 还原明文", dec.toString("utf8") === "plain-kek-bytes");

const meta = await aliyun.describeKey("key-12345678");
ok("DescribeKey 解析 KeySpec", meta.KeySpec === "AES_256", meta.KeySpec);
ok("DescribeKey 解析 KeyUsage", meta.KeyUsage === "ENCRYPT_DECRYPT");

const created = await aliyun.createKey({ keySpec: "AES_256", keyUsage: "ENCRYPT_DECRYPT" });
ok("CreateKey 返回 KeyId", created.keyId === "key-new987654", created.keyId);

const signed = await aliyun.signWithKms({ message: Buffer.from("tx-payload") });
ok("Sign 返回签名", signed.signature === "bW9jay1zaWc=", signed.algorithm);

const verified = await aliyun.verifyWithKms({ message: Buffer.from("tx-payload"), signature: signed.signature });
ok("Verify 返回 valid", verified.valid === true);

/* ---------------- 5. 错误映射 ---------------- */
console.log("\n5) 错误映射");
aliyun.__setTransport(async () => ({
  ok: false,
  status: 403,
  text: async () => JSON.stringify({ Code: "Forbidden.KeyNotFound", Message: "key not found", RequestId: "req-1" }),
}));
let err = null;
try {
  await aliyun.describeKey("key-missing");
} catch (e) {
  err = e;
}
ok("403 抛出可读错误", !!err && err.status === 502, err?.message);
ok("错误保留 Code", err?.detail?.code === "Forbidden.KeyNotFound");
ok("错误保留 RequestId", err?.detail?.requestId === "req-1");

aliyun.__setTransport(async () => ({
  ok: false,
  status: 500,
  text: async () => JSON.stringify({ Code: "InternalError", Message: "boom" }),
}));
let retried = 0;
aliyun.__setTransport(async () => {
  retried += 1;
  return { ok: false, status: 500, text: async () => JSON.stringify({ Code: "InternalError" }) };
});
err = null;
try {
  await aliyun.encrypt("x");
} catch (e) {
  err = e;
}
ok("5xx 会重试后失败", retried === aliyun.config().retries + 1, `${retried} 次请求`);

/* ---------------- 6. 未配置时快速失败 ---------------- */
console.log("\n6) 未配置时快速失败");
clearEnv();
err = null;
try {
  await aliyun.encrypt("x");
} catch (e) {
  err = e;
}
ok("无凭据调用返回 503", err?.status === 503, err?.message);
ok("错误信息指明缺失项", (err?.detail || "").includes("ALIYUN_ACCESS_KEY_ID"));

aliyun.__setTransport(null);
console.log(`\n=== 结果：${pass} 通过 / ${fail} 失败 ===\n`);
process.exit(fail === 0 ? 0 : 1);
