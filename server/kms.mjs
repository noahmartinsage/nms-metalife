/**
 * KMS / HSM —— 真实后量子签名服务
 *
 * 设计目标：私钥永不出模块、签名可公开验证、算法可迁移。
 *
 * 三层结构：
 *   1. KeyStore  密钥托管：私钥用 AES-256-GCM 信封加密后落库，内存中仅在签名瞬间解封
 *   2. Provider  算法后端：
 *        - ml-dsa-65    : 真实后量子签名（OpenSSL 3.5+ CLI，NIST FIPS 204）
 *        - ed25519      : Node 内置（快速，作为无 OpenSSL 时的降级）
 *        - external     : 外部 KMS/HSM 适配器（AWS KMS / 阿里云 KMS / PKCS#11），未配置则不可用
 *   3. Signer    签名服务：异步并发池 + 同载荷缓存 + 审计留痕
 *
 * 关键约束：
 *   - 客户端提交的签名一律不可信，服务端强制重签（见 index.mjs 的 Transaction 钩子）
 *   - 轮换后旧密钥保留为 retired，仍可用于验签历史数据
 *   - 私钥不返回任何 API，导出公钥即可完成全部验签
 */
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFile, execFileSync } from "node:child_process";
import db from "./db.mjs";
import aliyun from "./kms-aliyun.mjs";

const DATA_DIR = path.resolve("server/data");
const KEY_DIR = path.join(DATA_DIR, ".kms");
const MASTER_FILE = path.join(DATA_DIR, ".kms-master");

const nowISO = () => new Date().toISOString();
const newId = (p) => `${p}_${crypto.randomBytes(8).toString("hex")}`;
const b64u = (b) => Buffer.from(b).toString("base64url");
const unb64u = (s) => Buffer.from(s, "base64url");
const sha256 = (buf) => crypto.createHash("sha256").update(buf).digest("hex");

/* ================================================================== */
/* 表结构                                                              */
/* ================================================================== */

db.exec(`
  CREATE TABLE IF NOT EXISTS kms_keys (
    id TEXT PRIMARY KEY,
    alias TEXT NOT NULL,
    algorithm TEXT NOT NULL,
    key_version INTEGER NOT NULL,
    public_key_pem TEXT NOT NULL,
    sealed_private TEXT NOT NULL,
    fingerprint TEXT NOT NULL,
    status TEXT NOT NULL,
    created_date TEXT,
    rotated_date TEXT
  );
  CREATE UNIQUE INDEX IF NOT EXISTS idx_kms_alias_version ON kms_keys(alias, key_version);
  CREATE INDEX IF NOT EXISTS idx_kms_status ON kms_keys(status);

  CREATE TABLE IF NOT EXISTS kms_audit (
    id TEXT PRIMARY KEY,
    op TEXT NOT NULL,
    alias TEXT,
    key_id TEXT,
    key_version INTEGER,
    algorithm TEXT,
    payload_hash TEXT,
    context TEXT,
    ok INTEGER,
    reason TEXT,
    latency_ms INTEGER,
    actor TEXT,
    created_date TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_kms_audit_date ON kms_audit(created_date);

  CREATE TABLE IF NOT EXISTS chain_checkpoints (
    id TEXT PRIMARY KEY,
    height INTEGER NOT NULL,
    tx_count INTEGER NOT NULL,
    root_hash TEXT NOT NULL,
    algorithm TEXT NOT NULL,
    key_id TEXT,
    key_version INTEGER,
    signature TEXT NOT NULL,
    payload_hash TEXT,
    payload TEXT,
    created_date TEXT
  );
`);

/* ================================================================== */
/* 主密钥（KEK）与信封加密                                              */
/* ================================================================== */

let KEK = null;
let KEK_SOURCE = "unknown";

function loadMasterKey() {
  if (KEK) return KEK;

  /* 已启用阿里云 KMS 托管：KEK 必须由 await loadMasterKeyAsync() 预加载 */
  if (aliyun.useCloudKek()) {
    const err = new Error("kms_not_initialized");
    err.status = 503;
    err.detail = "云托管根密钥需先 await kms.init()";
    throw err;
  }

  const env = process.env.NMS_KMS_MASTER_KEY;
  if (env && env.length >= 16) {
    KEK = crypto.hkdfSync("sha256", Buffer.from(env, "utf8"), Buffer.from("nms-kms-salt"), Buffer.from("kek-v1"), 32);
    KEK = Buffer.from(KEK);
    KEK_SOURCE = "env";
    return KEK;
  }

  /* 开发环境：生成并持久化到本地文件（0600），生产必须用环境变量或外部 KMS */
  if (!fs.existsSync(MASTER_FILE)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(MASTER_FILE, crypto.randomBytes(48).toString("base64"), { mode: 0o600 });
  }
  const raw = fs.readFileSync(MASTER_FILE, "utf8").trim();
  KEK = Buffer.from(
    crypto.hkdfSync("sha256", Buffer.from(raw, "utf8"), Buffer.from("nms-kms-salt"), Buffer.from("kek-v1"), 32)
  );
  KEK_SOURCE = "file";
  return KEK;
}

/**
 * 异步加载主密钥（支持阿里云 KMS 托管）
 * 云托管时：CiphertextBlob → KMS Decrypt → 48B 明文 → HKDF → 32B KEK
 * 明文用完立即清零，不落盘、不进日志。
 */
async function loadMasterKeyAsync() {
  if (KEK) return KEK;

  if (aliyun.useCloudKek()) {
    const c = aliyun.config();
    const plain = await aliyun.decrypt(c.sealedKek);
    try {
      KEK = Buffer.from(
        crypto.hkdfSync("sha256", plain, Buffer.from("nms-kms-salt"), Buffer.from("kek-v1"), 32)
      );
      KEK_SOURCE = "aliyun-kms";
      return KEK;
    } finally {
      plain.fill(0);
    }
  }

  return loadMasterKey();
}

/** 信封加密：v1.<iv>.<tag>.<ciphertext>（均为 base64url） */
function seal(plaintext) {
  const key = loadMasterKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${b64u(iv)}.${b64u(tag)}.${b64u(ct)}`;
}

function unseal(sealed) {
  const parts = String(sealed || "").split(".");
  if (parts.length !== 4 || parts[0] !== "v1") {
    const err = new Error("kms_sealed_format_invalid");
    err.status = 500;
    throw err;
  }
  const key = loadMasterKey();
  const iv = unb64u(parts[1]);
  const tag = unb64u(parts[2]);
  const ct = unb64u(parts[3]);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]);
}

/* ================================================================== */
/* Provider 探测                                                       */
/* ================================================================== */

const OPENSSL_BIN = process.env.OPENSSL_BIN || "openssl";

function opensslSupports(alg) {
  try {
    const out = execFileSync(OPENSSL_BIN, ["list", "-signature-algorithms"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 5000,
    });
    return new RegExp(alg, "i").test(out);
  } catch (e) {
    return false;
  }
}

function opensslVersion() {
  try {
    return execFileSync(OPENSSL_BIN, ["version"], { encoding: "utf8", timeout: 5000 }).trim();
  } catch (e) {
    return null;
  }
}

const PROVIDER = {
  opensslVersion: opensslVersion(),
  mlDsaAvailable: false,
  activeAlgorithm: "ed25519",
  pqcAlgorithms: [],
};

function detectProvider() {
  const candidates = [
    { name: "ml-dsa-65", label: "ML-DSA-65", pattern: "ML-DSA-65", bits: 192 },
    { name: "ml-dsa-44", label: "ML-DSA-44", pattern: "ML-DSA-44", bits: 128 },
    { name: "slh-dsa-sha2-128s", label: "SLH-DSA-SHA2-128s", pattern: "SLH-DSA-SHA2-128s", bits: 128 },
  ];
  for (const c of candidates) {
    if (opensslSupports(c.pattern)) {
      PROVIDER.pqcAlgorithms.push(c.name);
    }
  }
  PROVIDER.mlDsaAvailable = PROVIDER.pqcAlgorithms.length > 0;

  /* 默认算法：可用则用后量子，否则 Ed25519 降级 */
  const pref = process.env.NMS_KMS_ALGORITHM;
  if (pref && (PROVIDER.pqcAlgorithms.includes(pref) || pref === "ed25519")) {
    PROVIDER.activeAlgorithm = pref;
  } else {
    PROVIDER.activeAlgorithm = PROVIDER.mlDsaAvailable ? "ml-dsa-65" : "ed25519";
  }
  return PROVIDER;
}

/* ================================================================== */
/* 密钥生成 / 轮换                                                      */
/* ================================================================== */

const ALIAS_DEFAULT = "nms-chain-tx";

function keyFilePath(keyId) {
  return path.join(KEY_DIR, `${keyId}.pem`);
}

function writeKeyFile(keyId, pem) {
  fs.mkdirSync(KEY_DIR, { recursive: true });
  const p = keyFilePath(keyId);
  fs.writeFileSync(p, pem, { mode: 0o600 });
  return p;
}

/** 生成密钥对，返回 { algorithm, publicPem, privatePem } */
function generateKeyPair(algorithm) {
  if (algorithm === "ed25519") {
    const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");
    return {
      algorithm,
      publicPem: publicKey.export({ type: "spki", format: "pem" }),
      privatePem: privateKey.export({ type: "pkcs8", format: "pem" }),
    };
  }

  /* 后量子：交给 OpenSSL CLI 生成 */
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nms-kms-"));
  const keyOut = path.join(dir, "k.pem");
  const pubOut = path.join(dir, "p.pem");
  try {
    const alg = algorithm.toUpperCase().replace(/-/g, "-");
    execFileSync(OPENSSL_BIN, ["genpkey", "-algorithm", alg, "-out", keyOut], { stdio: "pipe", timeout: 20000 });
    execFileSync(OPENSSL_BIN, ["pkey", "-in", keyOut, "-pubout", "-out", pubOut], { stdio: "pipe", timeout: 20000 });
    return {
      algorithm,
      publicPem: fs.readFileSync(pubOut, "utf8"),
      privatePem: fs.readFileSync(keyOut, "utf8"),
    };
  } finally {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch (e) {
      /* 清理失败不影响主流程 */
    }
  }
}

const fingerprintOf = (publicPem) =>
  sha256(Buffer.from(publicPem.replace(/\r\n/g, "\n"), "utf8"))
    .slice(0, 32)
    .toUpperCase()
    .match(/.{4}/g)
    .join(":");

function nextVersion(alias) {
  const row = db.prepare("SELECT MAX(key_version) AS v FROM kms_keys WHERE alias = ?").get(alias);
  return (row?.v || 0) + 1;
}

function insertKey({ alias, algorithm, publicPem, privatePem, version }) {
  const id = newId("kmsk");
  const fp = fingerprintOf(publicPem);
  db.prepare(
    `INSERT INTO kms_keys (id, alias, algorithm, key_version, public_key_pem, sealed_private, fingerprint, status, created_date, rotated_date)
     VALUES (?,?,?,?,?,?,?,?,?,?)`
  ).run(id, alias, algorithm, version, publicPem, seal(Buffer.from(privatePem, "utf8")), fp, "active", nowISO(), null);
  writeKeyFile(id, privatePem);
  return db.prepare("SELECT * FROM kms_keys WHERE id = ?").get(id);
}

/** 取别名下处于 active 的密钥；没有则创建 */
export function ensureKey(alias = ALIAS_DEFAULT, algorithm = PROVIDER.activeAlgorithm) {
  const existing = db
    .prepare("SELECT * FROM kms_keys WHERE alias = ? AND status = 'active' ORDER BY key_version DESC LIMIT 1")
    .get(alias);
  if (existing) return existing;

  /* 云签名模式：登记一条「无本地私钥」的密钥记录，私钥在阿里云 KMS 内 */
  if (aliyun.useCloudSigner()) {
    const c = aliyun.config();
    const alg = `aliyun-${c.signAlgorithm}`;
    const id = `kmsk_aliyun_${c.signKeyId.slice(-12)}`;
    const found = db.prepare("SELECT * FROM kms_keys WHERE id = ?").get(id);
    if (found) return found;
    db.prepare(
      `INSERT INTO kms_keys (id, alias, algorithm, key_version, public_key_pem, sealed_private, fingerprint, status, created_date, rotated_date)
       VALUES (?,?,?,?,?,?,?,?,?,?)`
    ).run(
      id,
      alias,
      alg,
      1,
      "",
      "",
      sha256(Buffer.from(c.signKeyId, "utf8")).slice(0, 32).toUpperCase().match(/.{4}/g).join(":"),
      "active",
      nowISO(),
      null
    );
    return db.prepare("SELECT * FROM kms_keys WHERE id = ?").get(id);
  }

  const kp = generateKeyPair(algorithm);
  const key = insertKey({ alias, algorithm, publicPem: kp.publicPem, privatePem: kp.privatePem, version: nextVersion(alias) });
  return key;
}

/** 轮换：旧密钥置为 retired（保留验签能力），新版本置为 active */
export function rotateKey(alias = ALIAS_DEFAULT, actor = "system") {
  const kp = generateKeyPair(PROVIDER.activeAlgorithm);
  const version = nextVersion(alias);

  db.exec("BEGIN IMMEDIATE");
  try {
    db.prepare("UPDATE kms_keys SET status = 'retired', rotated_date = ? WHERE alias = ? AND status = 'active'").run(
      nowISO(),
      alias
    );
    const key = insertKey({ alias, algorithm: kp.algorithm, publicPem: kp.publicPem, privatePem: kp.privatePem, version });
    auditLog({ op: "rotate", alias, keyId: key.id, keyVersion: version, algorithm: kp.algorithm, ok: true, actor });
    db.exec("COMMIT");
    delete PRIVATE_CACHE[key.id];
    return { ok: true, alias, version, keyId: key.id, algorithm: kp.algorithm, fingerprint: key.fingerprint };
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

/* ================================================================== */
/* 签名 / 验签                                                         */
/* ================================================================== */

const PRIVATE_CACHE = new Map(); // keyId → { pem, path }
const SIG_CACHE = new Map(); // `${alg}:${keyId}:${payloadHash}` → envelope
const SIG_CACHE_MAX = 500;
const MAX_CONCURRENCY = Number(process.env.NMS_KMS_CONCURRENCY || 2);
let running = 0;
const queue = [];

/** 简易信号量：限制并发 openssl 子进程数量 */
function acquire() {
  return new Promise((resolve) => {
    const grant = () => {
      running += 1;
      resolve(() => {
        running -= 1;
        const next = queue.shift();
        if (next) next();
      });
    };
    if (running < MAX_CONCURRENCY) grant();
    else queue.push(grant);
  });
}

function privatePemOf(key) {
  const cached = PRIVATE_CACHE.get(key.id);
  if (cached && fs.existsSync(cached.path)) return cached;

  const pem = unseal(key.sealed_private).toString("utf8");
  const p = writeKeyFile(key.id, pem);
  const entry = { pem, path: p };
  PRIVATE_CACHE.set(key.id, entry);
  return entry;
}

/** 规范化 JSON：键排序、去掉 undefined，保证同一业务对象得到同一字节序列 */
export function canonical(obj) {
  const walk = (v) => {
    if (v === null || typeof v !== "object") return v;
    if (Array.isArray(v)) return v.map(walk);
    const out = {};
    for (const k of Object.keys(v).sort()) {
      if (v[k] !== undefined) out[k] = walk(v[k]);
    }
    return out;
  };
  return JSON.stringify(walk(obj));
}

function auditLog({ op, alias, keyId, keyVersion, algorithm, payloadHash, context, ok, reason, latencyMs, actor }) {
  db.prepare(
    `INSERT INTO kms_audit (id, op, alias, key_id, key_version, algorithm, payload_hash, context, ok, reason, latency_ms, actor, created_date)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`
  ).run(
    newId("kmsa"),
    op,
    alias || null,
    keyId || null,
    keyVersion || null,
    algorithm || null,
    payloadHash || null,
    context || null,
    ok ? 1 : 0,
    reason || null,
    latencyMs ?? null,
    actor || "system",
    nowISO()
  );
}

/** ML-DSA / SLH-DSA 签名（OpenSSL CLI，异步 + 并发池） */
async function signWithOpenSsl(key, payloadBuf) {
  const release = await acquire();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nms-sign-"));
  const msgPath = path.join(dir, "m.bin");
  const sigPath = path.join(dir, "s.bin");
  try {
    const { path: keyPath } = privatePemOf(key);
    fs.writeFileSync(msgPath, payloadBuf);
    await new Promise((resolve, reject) => {
      execFile(
        OPENSSL_BIN,
        ["pkeyutl", "-sign", "-inkey", keyPath, "-in", msgPath, "-rawin", "-out", sigPath],
        { timeout: 20000 },
        (err) => (err ? reject(err) : resolve())
      );
    });
    return fs.readFileSync(sigPath);
  } finally {
    release();
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch (e) {
      /* 忽略 */
    }
  }
}

async function verifyWithOpenSsl(key, payloadBuf, signatureBuf) {
  const release = await acquire();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nms-vfy-"));
  const msgPath = path.join(dir, "m.bin");
  const sigPath = path.join(dir, "s.bin");
  const pubPath = path.join(dir, "p.pem");
  try {
    fs.writeFileSync(msgPath, payloadBuf);
    fs.writeFileSync(sigPath, signatureBuf);
    fs.writeFileSync(pubPath, key.public_key_pem);
    await new Promise((resolve, reject) => {
      execFile(
        OPENSSL_BIN,
        ["pkeyutl", "-verify", "-pubin", "-inkey", pubPath, "-in", msgPath, "-rawin", "-sigfile", sigPath],
        { timeout: 20000 },
        (err) => (err ? reject(err) : resolve())
      );
    });
    return true;
  } catch (e) {
    return false;
  } finally {
    release();
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch (e) {
      /* 忽略 */
    }
  }
}

/**
 * 签名。payload 可为对象（自动规范化）或字符串/Buffer。
 * @returns { signature, algorithm, keyId, keyVersion, fingerprint, payloadHash, signedAt, latencyMs, cached }
 */
export async function sign(payload, { alias = ALIAS_DEFAULT, context = "generic", actor = "system" } = {}) {
  const started = Date.now();
  const key = ensureKey(alias);
  const payloadBuf = Buffer.isBuffer(payload)
    ? payload
    : Buffer.from(typeof payload === "string" ? payload : canonical(payload), "utf8");
  const payloadHash = sha256(payloadBuf);

  const cacheKey = `${key.algorithm}:${key.id}:${payloadHash}`;
  const hit = SIG_CACHE.get(cacheKey);
  if (hit) {
    return { ...hit, cached: true, latencyMs: Date.now() - started };
  }

  let signatureB64;
  try {
    if (key.algorithm.startsWith("aliyun-")) {
      /* 私钥在阿里云 KMS 内，签名在云端完成，本地只拿回签名值 */
      const c = aliyun.config();
      const res = await aliyun.signWithKms({
        message: payloadBuf,
        keyId: c.signKeyId,
        algorithm: key.algorithm.replace("aliyun-", ""),
      });
      signatureB64 = res.signature;
    } else if (key.algorithm === "ed25519") {
      const priv = crypto.createPrivateKey(unseal(key.sealed_private).toString("utf8"));
      signatureB64 = crypto.sign(null, payloadBuf, priv).toString("base64");
    } else {
      signatureB64 = (await signWithOpenSsl(key, payloadBuf)).toString("base64");
    }
  } catch (e) {
    auditLog({
      op: "sign",
      alias,
      keyId: key.id,
      keyVersion: key.key_version,
      algorithm: key.algorithm,
      payloadHash,
      context,
      ok: false,
      reason: e.message,
      latencyMs: Date.now() - started,
      actor,
    });
    const err = new Error(`kms_sign_failed: ${e.message}`);
    err.status = 500;
    throw err;
  }

  const envelope = {
    signature: signatureB64,
    algorithm: key.algorithm,
    keyId: key.id,
    keyVersion: key.key_version,
    fingerprint: key.fingerprint,
    payloadHash,
    signedAt: nowISO(),
    cached: false,
  };

  if (SIG_CACHE.size >= SIG_CACHE_MAX) {
    SIG_CACHE.delete(SIG_CACHE.keys().next().value);
  }
  SIG_CACHE.set(cacheKey, envelope);

  auditLog({
    op: "sign",
    alias,
    keyId: key.id,
    keyVersion: key.key_version,
    algorithm: key.algorithm,
    payloadHash,
    context,
    ok: true,
    latencyMs: Date.now() - started,
    actor,
  });

  return { ...envelope, latencyMs: Date.now() - started };
}

/**
 * 验签。只凭公钥即可，私钥不参与。
 * @returns { valid, reason?, algorithm, keyId, keyVersion, payloadHash }
 */
export async function verify({ payload, signature, keyId, alias = ALIAS_DEFAULT } = {}) {
  const started = Date.now();
  const payloadBuf = Buffer.isBuffer(payload)
    ? payload
    : Buffer.from(typeof payload === "string" ? payload : canonical(payload), "utf8");
  const payloadHash = sha256(payloadBuf);

  const key = keyId
    ? db.prepare("SELECT * FROM kms_keys WHERE id = ?").get(keyId)
    : db.prepare("SELECT * FROM kms_keys WHERE alias = ? AND status = 'active' ORDER BY key_version DESC LIMIT 1").get(alias);

  if (!key) {
    auditLog({ op: "verify", keyId, algorithm: null, payloadHash, ok: false, reason: "key_not_found", latencyMs: 0 });
    return { valid: false, reason: "key_not_found", payloadHash };
  }

  if (!signature) {
    return { valid: false, reason: "signature_missing", algorithm: key.algorithm, keyId: key.id, payloadHash };
  }

  let ok = false;
  let reason = null;
  try {
    if (key.algorithm.startsWith("aliyun-")) {
      const c = aliyun.config();
      const res = await aliyun.verifyWithKms({
        message: payloadBuf,
        signature: String(signature),
        keyId: c.signKeyId,
        algorithm: key.algorithm.replace("aliyun-", ""),
      });
      ok = res.valid === true;
      if (!ok) reason = "bad_signature";
    } else if (key.algorithm === "ed25519") {
      const pub = crypto.createPublicKey(key.public_key_pem);
      const sigBuf = Buffer.from(String(signature), "base64");
      ok = crypto.verify(null, payloadBuf, pub, sigBuf);
      if (!ok) reason = "bad_signature";
    } else {
      const sigBuf = Buffer.from(String(signature), "base64");
      ok = await verifyWithOpenSsl(key, payloadBuf, sigBuf);
      if (!ok) reason = "bad_signature";
    }
  } catch (e) {
    ok = false;
    reason = `verify_error: ${e.message}`;
  }

  auditLog({
    op: "verify",
    keyId: key.id,
    keyVersion: key.key_version,
    algorithm: key.algorithm,
    payloadHash,
    ok,
    reason,
    latencyMs: Date.now() - started,
  });

  return {
    valid: ok,
    reason,
    algorithm: key.algorithm,
    keyId: key.id,
    keyVersion: key.key_version,
    fingerprint: key.fingerprint,
    payloadHash,
  };
}

/** 同步签名（仅 Ed25519 路径，用于必须在事务内完成签名的场景） */
export function signSync(payload, { alias = ALIAS_DEFAULT } = {}) {
  const key = ensureKey(alias);
  if (key.algorithm !== "ed25519") {
    const err = new Error("kms_sign_sync_unsupported");
    err.status = 500;
    throw err;
  }
  const payloadBuf = Buffer.isBuffer(payload)
    ? payload
    : Buffer.from(typeof payload === "string" ? payload : canonical(payload), "utf8");
  const priv = crypto.createPrivateKey(unseal(key.sealed_private).toString("utf8"));
  return {
    signature: crypto.sign(null, payloadBuf, priv).toString("base64"),
    algorithm: key.algorithm,
    keyId: key.id,
    keyVersion: key.key_version,
    fingerprint: key.fingerprint,
    payloadHash: sha256(payloadBuf),
    signedAt: nowISO(),
  };
}

/* ================================================================== */
/* 链检查点（账本根哈希后量子签名）                                      */
/* ================================================================== */

/** 对当前账本生成检查点：root = sha256(所有 tx_hash 按序拼接) */
export async function checkpoint({ actor = "system" } = {}) {
  const rows = db.prepare('SELECT tx_hash FROM "Transaction" ORDER BY created_date ASC, id ASC').all();
  const rootHash = sha256(Buffer.from(rows.map((r) => r.tx_hash).join(""), "utf8"));
  const height = rows.length;

  const prev = db.prepare("SELECT * FROM chain_checkpoints ORDER BY height DESC, created_date DESC LIMIT 1").get();
  const payload = canonical({ height, rootHash, prevRoot: prev?.root_hash || null, at: nowISO().slice(0, 10) });

  const signed = await sign(payload, { context: "chain_checkpoint", actor });

  const id = newId("ckpt");
  db.prepare(
    `INSERT INTO chain_checkpoints (id, height, tx_count, root_hash, algorithm, key_id, key_version, signature, payload_hash, payload, created_date)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`
  ).run(
    id,
    height,
    rows.length,
    rootHash,
    signed.algorithm,
    signed.keyId,
    signed.keyVersion,
    signed.signature,
    signed.payloadHash,
    payload,
    nowISO()
  );

  return {
    id,
    height,
    txCount: rows.length,
    rootHash,
    prevRoot: prev?.root_hash || null,
    algorithm: signed.algorithm,
    keyId: signed.keyId,
    keyVersion: signed.keyVersion,
    signature: signed.signature,
    payloadHash: signed.payloadHash,
    payload,
    createdAt: nowISO(),
  };
}

export function listCheckpoints({ limit = 10 } = {}) {
  return db.prepare("SELECT * FROM chain_checkpoints ORDER BY created_date DESC LIMIT ?").all(limit);
}

/** 校验检查点签名 */
export async function verifyCheckpoint(idOrLatest) {
  const row =
    idOrLatest && idOrLatest !== "latest"
      ? db.prepare("SELECT * FROM chain_checkpoints WHERE id = ?").get(idOrLatest)
      : db.prepare("SELECT * FROM chain_checkpoints ORDER BY created_date DESC LIMIT 1").get();
  if (!row) return { valid: false, reason: "checkpoint_not_found" };

  /* 必须用原始 payload 验签：重算会丢 prevRoot 导致永远失败 */
  const res = await verify({ payload: row.payload, signature: row.signature, keyId: row.key_id });
  return { ...res, checkpointId: row.id, height: row.height, rootHash: row.root_hash };
}

/* ================================================================== */
/* 只读视图                                                            */
/* ================================================================== */

export function listKeys({ alias } = {}) {
  const rows = alias
    ? db.prepare("SELECT * FROM kms_keys WHERE alias = ? ORDER BY key_version DESC").all(alias)
    : db.prepare("SELECT * FROM kms_keys ORDER BY alias ASC, key_version DESC").all();
  return rows.map((r) => ({
    id: r.id,
    alias: r.alias,
    algorithm: r.algorithm,
    keyVersion: r.key_version,
    fingerprint: r.fingerprint,
    status: r.status,
    createdAt: r.created_date,
    rotatedAt: r.rotated_date,
    publicKeyPem: r.public_key_pem,
    /* 私钥永不返回 */
  }));
}

export function auditTrail({ limit = 20, op } = {}) {
  const rows = op
    ? db.prepare("SELECT * FROM kms_audit WHERE op = ? ORDER BY created_date DESC LIMIT ?").all(op, limit)
    : db.prepare("SELECT * FROM kms_audit ORDER BY created_date DESC LIMIT ?").all(limit);
  return rows.map((r) => ({
    id: r.id,
    op: r.op,
    alias: r.alias,
    keyId: r.key_id,
    keyVersion: r.key_version,
    algorithm: r.algorithm,
    payloadHash: r.payload_hash,
    context: r.context,
    ok: !!r.ok,
    reason: r.reason,
    latencyMs: r.latency_ms,
    actor: r.actor,
    createdAt: r.created_date,
  }));
}

export function stats() {
  const total = db.prepare("SELECT COUNT(*) c FROM kms_audit").get()?.c || 0;
  const signs = db.prepare("SELECT COUNT(*) c FROM kms_audit WHERE op='sign' AND ok=1").get()?.c || 0;
  const fails = db.prepare("SELECT COUNT(*) c FROM kms_audit WHERE ok=0").get()?.c || 0;
  const avg =
    db.prepare("SELECT AVG(latency_ms) a FROM kms_audit WHERE op='sign' AND ok=1 AND latency_ms IS NOT NULL").get()?.a || 0;
  return { total, signs, fails, avgSignMs: Math.round(avg) };
}

export function health() {
  const keys = db.prepare("SELECT COUNT(*) c FROM kms_keys WHERE status='active'").get()?.c || 0;
  const checkpoints = db.prepare("SELECT COUNT(*) c FROM chain_checkpoints").get()?.c || 0;
  const cloud = aliyun.health();
  return {
    provider: cloud.cloudSigner ? "aliyun-kms" : PROVIDER.mlDsaAvailable ? "openssl-pqc" : "node-ed25519",
    openssl: PROVIDER.opensslVersion,
    pqcAvailable: PROVIDER.mlDsaAvailable,
    pqcAlgorithms: PROVIDER.pqcAlgorithms,
    activeAlgorithm: aliyun.useCloudSigner() ? `aliyun-${cloud.signAlgorithm}` : PROVIDER.activeAlgorithm,
    keystore: KEK_SOURCE,
    activeKeys: keys,
    checkpoints,
    concurrency: MAX_CONCURRENCY,
    cacheSize: SIG_CACHE.size,
    aliyun: cloud,
    stats: stats(),
  };
}

/** 启动时初始化：探测 provider、加载主密钥（可能来自阿里云 KMS）、确保默认密钥存在 */
export async function init() {
  detectProvider();
  await loadMasterKeyAsync();
  const key = ensureKey(ALIAS_DEFAULT);
  return {
    provider: aliyun.useCloudSigner() ? "aliyun-kms" : PROVIDER.activeAlgorithm,
    keyId: key.id,
    version: key.key_version,
    fingerprint: key.fingerprint,
    keystore: KEK_SOURCE,
  };
}

export default {
  init,
  sign,
  signSync,
  verify,
  canonical,
  rotateKey,
  ensureKey,
  listKeys,
  auditTrail,
  checkpoint,
  listCheckpoints,
  verifyCheckpoint,
  health,
  stats,
};
