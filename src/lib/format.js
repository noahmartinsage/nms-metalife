/** 数字 / 货币 / 地址格式化工具 */

export const fmtNum = (n, digits = 2) => {
  const v = Number(n) || 0;
  if (Math.abs(v) >= 1e12) return `${(v / 1e12).toFixed(2)}万亿`;
  if (Math.abs(v) >= 1e8) return `${(v / 1e8).toFixed(2)}亿`;
  if (Math.abs(v) >= 1e4) return `${(v / 1e4).toFixed(2)}万`;
  return v.toLocaleString("zh-CN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
};

export const fmtCny = (n, digits = 2) => `¥${fmtNum(n, digits)}`;
export const fmtNms = (n, digits = 2) => `${fmtNum(n, digits)} NMS`;
export const fmtPct = (n, digits = 2) => `${(Number(n) || 0).toFixed(digits)}%`;

export const shortAddr = (addr = "", head = 6, tail = 4) => {
  if (!addr || addr.length <= head + tail) return addr || "—";
  return `${addr.slice(0, head)}...${addr.slice(-tail)}`;
};

export const shortHash = (hash = "") => shortAddr(hash, 10, 8);

export const timeAgo = (iso) => {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const diff = Date.now() - t;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "刚刚";
  if (min < 60) return `${min} 分钟前`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} 小时前`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} 天前`;
  return new Date(iso).toLocaleDateString("zh-CN");
};

export const fmtDate = (iso, withTime = false) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
};

/** 生成伪随机哈希（演示用，非真实加密） */
export const mockHash = (prefix = "0x", len = 40) => {
  const chars = "0123456789abcdef";
  let s = prefix;
  for (let i = 0; i < len; i += 1) s += chars[Math.floor(Math.random() * 16)];
  return s;
};

export const mockQuantumSignature = () =>
  `KYBER768-${mockHash("", 16).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

/** 金融输入防负数（规范 5.3） */
export const sanitizeAmount = (raw) => {
  const v = String(raw ?? "").replace(/[^\d.]/g, "");
  const num = parseFloat(v);
  if (Number.isNaN(num) || num < 0) return "0";
  return v;
};
