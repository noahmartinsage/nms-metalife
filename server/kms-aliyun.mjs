/**
 * 阿里云 KMS 适配器（KMS OpenAPI · RPC 风格 · SignatureVersion 1.0）
 *
 * 定位：把「根密钥」托管到云 KMS，本地只保留密文。
 *   - 信封加密：本地生成 48 字节 KEK 明文 → 阿里云 KMS Encrypt → 只存 CiphertextBlob
 *   - 启动时：Decrypt(CiphertextBlob) → HKDF → 32 字节 AES-256 KEK（用于封装私钥）
 *   - 可选：NMS_KMS_SIGNER=aliyun 时，改用 KMS 的非对称密钥签名（ECDSA/RSA/SM2）
 *
 * 为什么默认不用阿里云 KMS 做「后量子签名」：
 *   阿里云 KMS 目前提供 RSA / EC / SM2 签名，未提供 ML-DSA（FIPS 204）。
 *   因此默认仍是「阿里云 KMS 托管根密钥 + 本地 ML-DSA-65 签名」的混合方案：
 *   前者解决密钥托管与合规审计，后者解决抗量子。若合规要求国密，可切 SM2。
 *
 * 环境变量：
 *   ALIYUN_ACCESS_KEY_ID / ALIYUN_ACCESS_KEY_SECRET    RAM 用户密钥（最小权限）
 *   ALIYUN_KMS_REGION                                  默认 cn-hangzhou
 *   ALIYUN_KMS_ENDPOINT                                可选，默认 https://kms.<region>.aliyuncs.com
 *   NMS_KMS_KEK_PROVIDER=aliyun                        启用云托管根密钥
 *   NMS_KMS_ALIYUN_KEY_ID                              KMS 密钥 ID（Encrypt/Decrypt）
 *   NMS_KMS_ALIYUN_SEALED_KEK                          被 KMS 加密后的 KEK（base64 CiphertextBlob）
 *   NMS_KMS_SIGNER=aliyun                              可选：改用 KMS 非对称密钥签名
 *   NMS_KMS_ALIYUN_SIGN_KEY_ID                         签名密钥 ID（SIGN_VERIFY 用途）
 *   NMS_KMS_ALIYUN_SIGN_ALGORITHM                      默认 ECDSA_SHA_256
 */
import crypto from "node:crypto";

const API_VERSION = "2016-01-20";

/* ------------------------------ 配置 ------------------------------ */

export function config() {
  const ak = process.env.ALIYUN_ACCESS_KEY_ID || "";
  const sk = process.env.ALIYUN_ACCESS_KEY_SECRET || "";
  const region = process.env.ALIYUN_KMS_REGION || "cn-hangzhou";
  const endpoint = (process.env.ALIYUN_KMS_ENDPOINT || `https://kms.${region}.aliyuncs.com`).replace(/\/$/, "");
  return {
    ak,
    sk,
    region,
    endpoint,
    keyId: process.env.NMS_KMS_ALIYUN_KEY_ID || "",
    sealedKek: process.env.NMS_KMS_ALIYUN_SEALED_KEK || "",
    signKeyId: process.env.NMS_KMS_ALIYUN_SIGN_KEY_ID || "",
    signAlgorithm: process.env.NMS_KMS_ALIYUN_SIGN_ALGORITHM || "ECDSA_SHA_256",
    kekProvider: (process.env.NMS_KMS_KEK_PROVIDER || "").toLowerCase(),
    signer: (process.env.NMS_KMS_SIGNER || "").toLowerCase(),
    /* 超时与重试：云 API 抖动时不要让启动卡死 */
    timeoutMs: Number(process.env.ALIYUN_KMS_TIMEOUT_MS || 8000),
    retries: Number(process.env.ALIYUN_KMS_RETRIES || 2),
  };
}

/** 是否具备调用云 KMS 的最小条件 */
export function isConfigured() {
  const c = config();
  return Boolean(c.ak && c.sk);
}

/** 是否启用云托管根密钥 */
export function useCloudKek() {
  const c = config();
  return c.kekProvider === "aliyun" && Boolean(c.keyId && c.sealedKek);
}

/** 是否启用云签名 */
export function useCloudSigner() {
  const c = config();
  return c.signer === "aliyun" && Boolean(c.signKeyId);
}

/* ------------------------------ 签名算法 ------------------------------ */

/** 阿里云要求的 percentEncode：空格→%20、*→%2A、~ 保持原样 */
export function percentEncode(str) {
  return encodeURIComponent(String(str))
    .replace(/\+/g, "%20")
    .replace(/\*/g, "%2A")
    .replace(/%7E/g, "~");
}

/** 参数按 key 字典序拼成 canonicalizedQueryString */
export function canonicalQuery(params) {
  return Object.keys(params)
    .filter((k) => params[k] !== undefined && params[k] !== null && params[k] !== "")
    .sort()
    .map((k) => `${percentEncode(k)}=${percentEncode(params[k])}`)
    .join("&");
}

/** 计算 Signature（HMAC-SHA1，key = AccessKeySecret + "&"） */
export function sign(params, secret, method = "GET") {
  const stringToSign = `${method}&${percentEncode("/")}&${percentEncode(canonicalQuery(params))}`;
  return crypto.createHmac("sha1", `${secret}&`).update(stringToSign, "utf8").digest("base64");
}

const nonce = () => crypto.randomBytes(16).toString("hex");
const timestamp = () => new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

/* ------------------------------ 传输层 ------------------------------ */

let transport = null;

/** 测试用：注入自定义 fetch（签名与解析逻辑不变） */
export function __setTransport(fn) {
  transport = fn;
}

async function callApi(action, params = {}, { method = "GET" } = {}) {
  const c = config();
  if (!isConfigured()) {
    const err = new Error("aliyun_kms_not_configured");
    err.status = 503;
    err.detail = "缺少 ALIYUN_ACCESS_KEY_ID / ALIYUN_ACCESS_KEY_SECRET";
    throw err;
  }

  const full = {
    Action: action,
    Version: API_VERSION,
    Format: "JSON",
    RegionId: c.region,
    AccessKeyId: c.ak,
    SignatureMethod: "HMAC-SHA1",
    SignatureVersion: "1.0",
    SignatureNonce: nonce(),
    Timestamp: timestamp(),
    ...params,
  };
  full.Signature = sign(full, c.sk, method);

  const qs = canonicalQuery(full);
  const url = `${c.endpoint}/?${qs}`;
  const doFetch = transport || globalThis.fetch;

  let lastErr = null;
  for (let attempt = 0; attempt <= c.retries; attempt += 1) {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), c.timeoutMs);
    try {
      const res = await doFetch(url, { method: "GET", signal: ac.signal });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }
      if (!res.ok) {
        const err = new Error(data.Code || data.Message || `aliyun_kms_http_${res.status}`);
        err.status = 502;
        err.detail = { code: data.Code, message: data.Message, requestId: data.RequestId, httpStatus: res.status };
        /* 鉴权类错误不重试 */
        if (res.status === 401 || res.status === 403) throw err;
        lastErr = err;
        continue;
      }
      return data;
    } catch (e) {
      if (e.status === 502 && e.detail?.code && /Forbidden|Unauthorized|Signature/i.test(e.detail.code)) throw e;
      lastErr = e;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr || new Error("aliyun_kms_request_failed");
}

/* ------------------------------ 业务接口 ------------------------------ */

/** 凭据校验：缺失时给出明确可操作的错误（而不是 500） */
function ensureConfigured() {
  const c = config();
  if (!c.ak || !c.sk) {
    const err = new Error("aliyun_kms_not_configured");
    err.status = 503;
    err.detail = "缺少 ALIYUN_ACCESS_KEY_ID / ALIYUN_ACCESS_KEY_SECRET";
    throw err;
  }
  return c;
}

/** 用 KMS 加密（返回 base64 CiphertextBlob） */
export async function encrypt(plaintext) {
  const c = ensureConfigured();
  if (!c.keyId) {
    const err = new Error("aliyun_kms_key_id_missing");
    err.status = 503;
    err.detail = "缺少 NMS_KMS_ALIYUN_KEY_ID";
    throw err;
  }
  const data = await callApi("Encrypt", {
    KeyId: c.keyId,
    Plaintext: Buffer.from(plaintext).toString("base64"),
  });
  if (!data.CiphertextBlob) {
    const err = new Error("aliyun_kms_encrypt_failed");
    err.status = 502;
    err.detail = data;
    throw err;
  }
  return data.CiphertextBlob;
}

/** 用 KMS 解密（入参为 base64 CiphertextBlob） */
export async function decrypt(ciphertextBlob) {
  const data = await callApi("Decrypt", { CiphertextBlob: ciphertextBlob });
  if (!data.Plaintext) {
    const err = new Error("aliyun_kms_decrypt_failed");
    err.status = 502;
    err.detail = data;
    throw err;
  }
  return Buffer.from(data.Plaintext, "base64");
}

/** 创建密钥（KeyUsage: ENCRYPT_DECRYPT | SIGN_VERIFY） */
export async function createKey({ keySpec = "AES_256", keyUsage = "ENCRYPT_DECRYPT", description = "" } = {}) {
  const data = await callApi("CreateKey", {
    KeySpec: keySpec,
    KeyUsage: keyUsage,
    Description: description || `NMS MetaLife ${keyUsage}`,
  });
  return { keyId: data.KeyId, keyMetadata: data.KeyMetadata };
}

export async function describeKey(keyId) {
  const data = await callApi("DescribeKey", { KeyId: keyId });
  return data.KeyMetadata || data;
}

/** 生成数据密钥（返回明文与密文，明文用完立即清零） */
export async function generateDataKey({ keyId, keySpec = "AES_256", numberOfBytes } = {}) {
  const c = config();
  const params = { KeyId: keyId || c.keyId, KeySpec: keySpec };
  if (numberOfBytes) {
    delete params.KeySpec;
    params.NumberOfBytes = String(numberOfBytes);
  }
  const data = await callApi("GenerateDataKey", params);
  return {
    plaintext: Buffer.from(data.Plaintext, "base64"),
    ciphertextBlob: data.CiphertextBlob,
    keyId: data.KeyId,
  };
}

/** 非对称签名（KMS 侧执行，私钥不出云） */
export async function signWithKms({ message, keyId, algorithm } = {}) {
  const c = config();
  const data = await callApi("Sign", {
    KeyId: keyId || c.signKeyId,
    Message: Buffer.from(message).toString("base64"),
    MessageType: "RAW",
    Algorithm: algorithm || c.signAlgorithm,
  });
  return { signature: data.Signature, keyId: data.KeyId, algorithm: algorithm || c.signAlgorithm };
}

/** 非对称验签 */
export async function verifyWithKms({ message, signature, keyId, algorithm } = {}) {
  const c = config();
  const data = await callApi("Verify", {
    KeyId: keyId || c.signKeyId,
    Message: Buffer.from(message).toString("base64"),
    MessageType: "RAW",
    Signature: signature,
    Algorithm: algorithm || c.signAlgorithm,
  });
  return { valid: data.Value === true || data.Value === "true" };
}

/** 健康与配置自检（不泄露密钥） */
export function health() {
  const c = config();
  return {
    configured: isConfigured(),
    region: c.region,
    endpoint: c.endpoint,
    cloudKek: useCloudKek(),
    cloudSigner: useCloudSigner(),
    keyIdSuffix: c.keyId ? c.keyId.slice(-8) : null,
    signAlgorithm: c.signAlgorithm,
    signatureMethod: "HMAC-SHA1 / SignatureVersion 1.0",
    timeoutMs: c.timeoutMs,
    retries: c.retries,
  };
}

export default {
  config,
  isConfigured,
  useCloudKek,
  useCloudSigner,
  percentEncode,
  canonicalQuery,
  sign,
  encrypt,
  decrypt,
  createKey,
  describeKey,
  generateDataKey,
  signWithKms,
  verifyWithKms,
  health,
  __setTransport,
};
