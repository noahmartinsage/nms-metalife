/**
 * KMS / HSM 后量子签名验证
 * 用法：node scripts/test-kms.mjs [base]
 */
const BASE = (process.argv[2] || "http://127.0.0.1:8787").replace(/\/api$/, "") + "/api";

let pass = 0;
let fail = 0;
const ok = (n, c, d = "") => {
  c ? (pass++, console.log(`  ✅ ${n}${d ? " — " + d : ""}`)) : (fail++, console.log(`  ❌ ${n}${d ? " — " + d : ""}`));
};

const api = async (p, { method = "GET", body, token = "nms-demo-token" } = {}) => {
  const res = await fetch(BASE + p, {
    method,
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: res.status, data };
};

console.log("\n=== KMS / HSM 后量子签名验证 ===\n");

/* ---------------- 1. 后端能力 ---------------- */
console.log("1) 后端与算法");
const health = (await api("/kms/health")).data;
ok("KMS 服务可用", !!health.provider, health.provider);
ok("OpenSSL 版本上报", !!health.openssl, (health.openssl || "").slice(0, 24));
ok("检测到后量子算法", health.pqcAvailable === true, (health.pqcAlgorithms || []).join(" / "));
ok("活动算法为 ML-DSA 系列", /ml-dsa|slh-dsa/i.test(health.activeAlgorithm || ""), health.activeAlgorithm);
ok("存在活动密钥", health.activeKeys > 0, `${health.activeKeys} 个`);

/* ---------------- 2. 密钥不泄露 ---------------- */
console.log("\n2) 私钥保护");
const keysRes = await api("/kms/keys");
ok("密钥列表可读", keysRes.status === 200 && Array.isArray(keysRes.data.keys), `${keysRes.data.keys?.length} 个`);
const activeKey = keysRes.data.keys?.find((k) => k.status === "active");
ok("存在 active 密钥", !!activeKey, activeKey?.alias);
ok("返回公钥 PEM", (activeKey?.publicKeyPem || "").includes("BEGIN PUBLIC KEY"));
ok("不返回私钥字段", !("sealed_private" in (activeKey || {})) && !("privateKeyPem" in (activeKey || {})));
ok("指纹格式正确", /^([0-9A-F]{4}:){7}[0-9A-F]{4}$/.test(activeKey?.fingerprint || ""), activeKey?.fingerprint);

/* ---------------- 3. 签名与验签 ---------------- */
console.log("\n3) 签名 / 验签闭环");
const payload = { order: "NMS-KMS-001", amount: 268, to: "store_1", at: "2026-10-31" };
const signed = await api("/kms/sign", { method: "POST", body: { payload, context: "test" } });
ok("签名成功", signed.status === 200 && !!signed.data.signature, `${signed.data.signature?.length} 字符`);
ok("签名带算法标识", !!signed.data.algorithm, signed.data.algorithm);
ok("签名带密钥溯源", !!signed.data.keyId && !!signed.data.fingerprint, `v${signed.data.keyVersion}`);
ok("签名带载荷哈希", (signed.data.payloadHash || "").length === 64);

const v1 = await api("/kms/verify", { method: "POST", body: { payload, signature: signed.data.signature, keyId: signed.data.keyId } });
ok("原始载荷验签通过", v1.status === 200 && v1.data.valid === true, v1.data.algorithm);

const v2 = await api("/kms/verify", {
  method: "POST",
  body: { payload: { ...payload, amount: 1 }, signature: signed.data.signature, keyId: signed.data.keyId },
});
ok("篡改金额 → 验签失败", v2.status === 400 && v2.data.valid === false, v2.data.reason);

const v3 = await api("/kms/verify", {
  method: "POST",
  body: { payload, signature: signed.data.signature.slice(0, -8) + "AAAAAAAA", keyId: signed.data.keyId },
});
ok("篡改签名 → 验签失败", v3.data.valid === false, v3.data.reason);

const v4 = await api("/kms/verify", { method: "POST", body: { payload, signature: signed.data.signature, keyId: "kmsk_notexist" } });
ok("未知密钥 → 验签失败", v4.data.valid === false, v4.data.reason);

const again = await api("/kms/sign", { method: "POST", body: { payload, context: "test" } });
ok("同载荷缓存命中", again.data.cached === true, `${again.data.latencyMs}ms`);

/* ---------------- 4. 密钥轮换 ---------------- */
console.log("\n4) 密钥轮换与历史验签");
const rotated = await api("/kms/rotate", { method: "POST", body: { alias: "nms-chain-tx" } });
ok("轮换成功", rotated.status === 200 && rotated.data.version > (signed.data.keyVersion || 0), `v${rotated.data.version}`);
ok("轮换算法一致", rotated.data.algorithm === signed.data.algorithm, rotated.data.algorithm);

const keysAfter = (await api("/kms/keys")).data.keys;
const retired = keysAfter.filter((k) => k.status === "retired");
ok("旧密钥标记 retired", retired.length >= 1, `${retired.length} 个`);
ok("旧密钥仍保留公钥", (retired[0]?.publicKeyPem || "").includes("BEGIN PUBLIC KEY"));

const vOld = await api("/kms/verify", { method: "POST", body: { payload, signature: signed.data.signature, keyId: signed.data.keyId } });
ok("旧密钥仍可验历史签名", vOld.data.valid === true, "密钥轮换不破坏历史");

const signedNew = await api("/kms/sign", { method: "POST", body: { payload: { ...payload, order: "NMS-KMS-002" }, context: "test" } });
ok("新签名使用新密钥", signedNew.data.keyVersion === rotated.data.version, `v${signedNew.data.keyVersion}`);

/* ---------------- 5. 审计 ---------------- */
console.log("\n5) 签名审计");
const auditRes = await api("/kms/audit?limit=20");
ok("审计可读", auditRes.status === 200 && Array.isArray(auditRes.data.items), `${auditRes.data.items?.length} 条`);
const ops = (auditRes.data.items || []).map((i) => i.op);
ok("记录 sign", ops.includes("sign"));
ok("记录 verify", ops.includes("verify"));
ok("记录 rotate", ops.includes("rotate"));
ok("审计含载荷哈希", (auditRes.data.items || []).some((i) => (i.payloadHash || "").length === 64));
ok("审计含延迟", (auditRes.data.items || []).some((i) => typeof i.latencyMs === "number"));

/* ---------------- 6. 链检查点 ---------------- */
console.log("\n6) 链检查点");
const cp = await api("/chain/checkpoint", { method: "POST", body: {} });
ok("生成检查点", cp.status === 201 && cp.data.rootHash, `高度 ${cp.data.height}`);
ok("检查点后量子签名", !!cp.data.signature && /ml-dsa|slh-dsa|ed25519/i.test(cp.data.algorithm), cp.data.algorithm);

const cpv = await api("/chain/checkpoint/verify", { method: "POST", body: { id: "latest" } });
ok("检查点验签通过", cpv.data.valid === true, cpv.data.reason || "ok");

/* ---------------- 7. 交易强制签名（防伪造） ---------------- */
console.log("\n7) 交易强制服务端签名");
const store = (await api("/entities/MerchantStore/list", { method: "POST", body: { limit: 1 } })).data[0];
const stamp = Date.now().toString(36);
const fakeSig = "FORGED-SIGNATURE-SHOULD-BE-REPLACED";
const tx = await api("/entities/Transaction", {
  method: "POST",
  body: {
    tx_hash: `0x${stamp.padEnd(40, "0").slice(0, 40)}`,
    block_number: 18499999,
    from_address: "demo@nms.ai",
    to_address: store?.id || "store_1",
    amount: 12.5,
    token_type: "NMS",
    status: "confirmed",
    gas_fee: 0,
    quantum_signature: fakeSig,
    signature_time_ms: Date.now(),
  },
});
ok("交易创建成功", tx.status === 201, tx.data?.tx_hash?.slice(0, 12));
ok("客户端伪造签名被覆盖", tx.data?.quantum_signature !== fakeSig, `${(tx.data?.quantum_signature || "").length} 字符`);
ok("写入签名算法", !!tx.data?.signature_algorithm, tx.data?.signature_algorithm);
ok("写入密钥指纹", !!tx.data?.signing_key_fingerprint, (tx.data?.signing_key_fingerprint || "").slice(0, 18));
ok("写入载荷哈希", (tx.data?.payload_hash || "").length === 64);

const chainVerify = (await api("/chain/verify?limit=10")).data;
ok("链上逐笔验签无失败", chainVerify.invalid === 0, `通过 ${chainVerify.valid}/${chainVerify.checked}`);
ok("新交易被验签通过", (chainVerify.details || []).some((d) => d.valid === true && /ml-dsa|slh-dsa|ed25519/i.test(d.algorithm || "")));

/* ---------------- 8. 篡改检测 ---------------- */
console.log("\n8) 篡改检测");
const targetTx = tx.data;
const tamperedPayload = {
  tx_hash: targetTx.tx_hash,
  block_number: targetTx.block_number,
  from: targetTx.from_address,
  to: targetTx.to_address,
  amount: Number(targetTx.amount) + 1000,
  token: targetTx.token_type,
};
const tamperRes = await api("/kms/verify", {
  method: "POST",
  body: { payload: tamperedPayload, signature: targetTx.quantum_signature, keyId: targetTx.signing_key_id },
});
ok("篡改交易金额 → 验签失败", tamperRes.data.valid === false, tamperRes.data.reason);

console.log(`\n=== 结果：${pass} 通过 / ${fail} 失败 ===\n`);
process.exit(fail === 0 ? 0 : 1);
