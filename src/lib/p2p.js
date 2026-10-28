/**
 * P2P 节点内核（浏览器原生，无需服务端）
 *
 * 落地方式：
 * - BroadcastChannel 作为"网络层"：同源多标签页 = 多个对等节点，互相发现、心跳、广播、同步账本
 * - Hypercore 式 append-only 账本：每条记录带 hash 与 prevHash，按 seq 对齐，哈希去重
 * - 断线重连：心跳 3s，peer 超时 10s 标记离线
 *
 * 设计约束：所有 API 必须在 SSR / 不支持 BroadcastChannel 时安全降级。
 */

const CHANNEL = "nms-p2p-v1";
const HEARTBEAT_MS = 3000;
const PEER_TIMEOUT_MS = 10000;

const isBrowser = () => typeof window !== "undefined";

/** 简易哈希（FNV-1a 32bit 双轮），用于账本去重与完整性校验 */
export function p2pHash(input) {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  const s = String(input);
  for (let i = 0; i < s.length; i += 1) {
    const c = s.charCodeAt(i);
    h1 ^= c;
    h1 = Math.imul(h1, 16777619) >>> 0;
    h2 = (Math.imul(h2 ^ c, 2246822519) + i) >>> 0;
  }
  return (h1.toString(16) + h2.toString(16)).padStart(16, "0").slice(0, 16);
}

function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

export function createP2PNode(options = {}) {
  const nodeId = `nms-${randomId()}`;
  const listeners = new Map();
  const peers = new Map(); // id -> { id, firstSeen, lastSeen, latency, version }
  const ledger = []; // { seq, type, payload, ts, nodeId, hash, prevHash }
  let channel = null;
  let timer = null;
  let destroyed = false;

  const emit = (event, payload) => {
    (listeners.get(event) || []).forEach((fn) => {
      try {
        fn(payload);
      } catch (e) {
        /* 单个监听器异常不影响其他监听 */
      }
    });
  };

  const on = (event, cb) => {
    if (!listeners.has(event)) listeners.set(event, []);
    listeners.get(event).push(cb);
    return () => {
      const arr = listeners.get(event) || [];
      const i = arr.indexOf(cb);
      if (i >= 0) arr.splice(i, 1);
    };
  };

  const post = (type, payload, extra = {}) => {
    if (!channel) return;
    try {
      channel.postMessage({ type, from: nodeId, payload, ts: Date.now(), ...extra });
    } catch (e) {
      /* 通道关闭时静默 */
    }
  };

  const appendLedger = (type, payload, from = nodeId) => {
    const prev = ledger[ledger.length - 1];
    const entry = {
      seq: ledger.length + 1,
      type,
      payload,
      ts: Date.now(),
      nodeId: from,
      prevHash: prev ? prev.hash : "genesis",
    };
    entry.hash = p2pHash(`${entry.seq}|${entry.type}|${entry.ts}|${entry.nodeId}|${entry.prevHash}|${JSON.stringify(payload)}`);
    if (!ledger.some((e) => e.hash === entry.hash)) ledger.push(entry);
    emit("ledger", ledger);
    return entry;
  };

  const mergeLedger = (entries = []) => {
    let added = 0;
    entries.forEach((e) => {
      if (!e || !e.hash) return;
      if (ledger.some((x) => x.hash === e.hash)) return;
      ledger.push(e);
      added += 1;
    });
    if (added) {
      ledger.sort((a, b) => a.ts - b.ts);
      ledger.forEach((e, i) => {
        e.seq = i + 1;
      });
      emit("ledger", ledger);
    }
    return added;
  };

  const broadcast = (type, payload) => {
    const entry = appendLedger(type, payload);
    post("ledger-append", entry);
    emit("broadcast", entry);
    return entry;
  };

  const start = () => {
    if (!isBrowser() || typeof window.BroadcastChannel !== "function" || destroyed) return;
    channel = new BroadcastChannel(CHANNEL);

    channel.onmessage = (evt) => {
      const msg = evt.data || {};
      if (!msg.type || msg.from === nodeId) return;

      if (msg.type === "hello" || msg.type === "heartbeat") {
        const known = peers.get(msg.from);
        peers.set(msg.from, {
          id: msg.from,
          firstSeen: known?.firstSeen || Date.now(),
          lastSeen: Date.now(),
          latency: known ? Date.now() - msg.ts : 0,
          version: msg.version || "v1",
        });
        post("heartbeat-ack", null, { to: msg.from });
        if (msg.type === "hello") post("ledger-request", null, { to: msg.from });
        emit("peers", [...peers.values()]);
      }

      if (msg.type === "heartbeat-ack" && (!msg.to || msg.to === nodeId)) {
        const known = peers.get(msg.from);
        if (known) {
          known.lastSeen = Date.now();
          known.latency = Date.now() - msg.ts;
          emit("peers", [...peers.values()]);
        }
      }

      if (msg.type === "ledger-request") {
        post("ledger-response", ledger, { to: msg.from });
      }

      if (msg.type === "ledger-response" && (!msg.to || msg.to === nodeId)) {
        const added = mergeLedger(msg.payload || []);
        if (added) emit("sync", { from: msg.from, added, height: ledger.length });
      }

      if (msg.type === "ledger-append") {
        const added = mergeLedger([msg.payload]);
        if (added) emit("sync", { from: msg.from, added, height: ledger.length });
      }

      if (msg.type === "chat") {
        emit("chat", msg.payload);
      }
    };

    post("hello", null, { version: "v1" });

    timer = setInterval(() => {
      const now = Date.now();
      let changed = false;
      peers.forEach((p) => {
        if (now - p.lastSeen > PEER_TIMEOUT_MS) {
          peers.delete(p.id);
          changed = true;
        }
      });
      if (changed) emit("peers", [...peers.values()]);
      post("heartbeat", null, { version: "v1" });
    }, HEARTBEAT_MS);
  };

  const destroy = () => {
    destroyed = true;
    clearInterval(timer);
    if (channel) {
      post("bye", null);
      channel.close();
      channel = null;
    }
    listeners.clear();
  };

  start();

  return {
    nodeId,
    enabled: !!channel,
    getPeers: () => [...peers.values()],
    getLedger: () => [...ledger],
    height: () => ledger.length,
    broadcast,
    mergeLedger,
    on,
    destroy,
    requestSync: () => post("ledger-request", null),
  };
}

/** 单例（每个标签页一个节点） */
let singleton = null;
export function getP2PNode() {
  if (!isBrowser()) return null;
  if (!singleton) singleton = createP2PNode();
  return singleton;
}

export const P2P_CONFIG = { CHANNEL, HEARTBEAT_MS, PEER_TIMEOUT_MS };
