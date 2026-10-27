/** 行情模拟数据（确定性随机，刷新稳定） */

function rng(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export const NMS_GUIDE_PRICE = 0.42; // 指导价（ACS）

export function priceSeries(days = 30, base = NMS_GUIDE_PRICE, seed = 7) {
  const rand = rng(seed);
  let price = base * 0.86;
  const out = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const drift = (base - price) * 0.08;
    const shock = (rand() - 0.48) * base * 0.09;
    price = Math.max(base * 0.6, price + drift + shock);
    const d = new Date(Date.now() - i * 86400000);
    out.push({
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      price: Math.round(price * 10000) / 10000,
      volume: Math.round(rand() * 800000 + 120000),
    });
  }
  return out;
}

export function candleSeries(count = 60, intervalMinutes = 60, base = NMS_GUIDE_PRICE, seed = 11) {
  const rand = rng(seed);
  const out = [];
  let price = base * 0.92;
  for (let i = count - 1; i >= 0; i -= 1) {
    const open = price;
    const vol = base * (0.004 + rand() * 0.012);
    const close = Math.max(base * 0.5, open + (rand() - 0.47) * vol * 2);
    const high = Math.max(open, close) + rand() * vol;
    const low = Math.min(open, close) - rand() * vol;
    price = close;
    const t = new Date(Date.now() - i * intervalMinutes * 60000);
    out.push({
      time: `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`,
      fullTime: t.toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }),
      open: round4(open),
      high: round4(high),
      low: round4(low),
      close: round4(close),
      volume: Math.round(rand() * 60000 + 8000),
    });
  }
  return out;
}

const round4 = (n) => Math.round(n * 10000) / 10000;

export function orderBook(mid = NMS_GUIDE_PRICE, depth = 12) {
  const rand = rng(23);
  const bids = [];
  const asks = [];
  let bidTotal = 0;
  let askTotal = 0;
  for (let i = 1; i <= depth; i += 1) {
    const bp = round4(mid - i * 0.0006);
    const ba = Math.round(rand() * 42000 + 3200);
    bidTotal += ba;
    bids.push({ price: bp, amount: ba, total: bidTotal });
    const ap = round4(mid + i * 0.0006);
    const aa = Math.round(rand() * 42000 + 3200);
    askTotal += aa;
    asks.push({ price: ap, amount: aa, total: askTotal });
  }
  return { bids, asks: asks.reverse(), spread: round4(0.0006) };
}

export function recentTrades(count = 16) {
  const rand = rng(41);
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    price: round4(NMS_GUIDE_PRICE + (rand() - 0.5) * 0.006),
    amount: Math.round(rand() * 8600 + 60),
    side: rand() > 0.5 ? "buy" : "sell",
    time: new Date(Date.now() - i * 23000).toLocaleTimeString("zh-CN", { hour12: false }),
  }));
}

export function fundingRate() {
  return 0;
}
