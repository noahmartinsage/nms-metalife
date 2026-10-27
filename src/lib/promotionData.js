/**
 * 单一真相源 — 晋升 / 矩阵 / 信誉等级
 * 全站所有模块必须引用本文件，杜绝数值漂移（规范 4.3）
 */
const calcReleaseDays = (order) => Math.round(999 - (order / 13) * (999 - 31));

export const PROMOTION_TIERS = [
  { level: "普通用户", matchKey: "普通用户", order: 0, color: "#94a3b8", team: 0, consume: 0, reward: 0, diff: 0, priv: "基础消费返利", releaseDays: calcReleaseDays(0) },
  { level: "金卡", matchKey: "金卡", order: 1, color: "#f59e0b", team: 3, consume: 1000, reward: 10, diff: 10, priv: "直推10%级差奖励+释放加速", releaseDays: calcReleaseDays(1) },
  { level: "白金卡", matchKey: "白金卡", order: 2, color: "#cbd5e1", team: 10, consume: 5000, reward: 15, diff: 15, priv: "直推15%级差奖励+等级礼包", releaseDays: calcReleaseDays(2) },
  { level: "钻石卡", matchKey: "钻石卡", order: 3, color: "#06b6d4", team: 30, consume: 20000, reward: 20, diff: 20, priv: "直推20%级差奖励+专属客服", releaseDays: calcReleaseDays(3) },
  { level: "黑金卡M1", matchKey: "M1", order: 4, color: "#22c55e", team: 100, consume: 50000, reward: 15, diff: 8.1, priv: "级差8.1%+团队管理权", releaseDays: calcReleaseDays(4) },
  { level: "黑金卡M2", matchKey: "M2", order: 5, color: "#3b82f6", team: 300, consume: 150000, reward: 18, diff: 8.1, priv: "级差8.1%+区域代理权", releaseDays: calcReleaseDays(5) },
  { level: "黑金卡M3", matchKey: "M3", order: 6, color: "#06b6d4", team: 1000, consume: 500000, reward: 22, diff: 8.1, priv: "级差8.1%+城市合伙人", releaseDays: calcReleaseDays(6) },
  { level: "黑金卡M4", matchKey: "M4", order: 7, color: "#8b5cf6", team: 3000, consume: 1500000, reward: 26, diff: 8.1, priv: "级差8.1%+省级代理", releaseDays: calcReleaseDays(7) },
  { level: "黑金卡M5", matchKey: "M5", order: 8, color: "#ec4899", team: 10000, consume: 5000000, reward: 30, diff: 8.1, priv: "级差8.1%+全国代理", releaseDays: calcReleaseDays(8) },
  { level: "黑金卡M6", matchKey: "M6", order: 9, color: "#a855f7", team: 30000, consume: 15000000, reward: 35, diff: 8.1, priv: "级差8.1%+股东分红", releaseDays: calcReleaseDays(9) },
  { level: "黑金卡M7", matchKey: "M7", order: 10, color: "#14b8a6", team: 100000, consume: 50000000, reward: 40, diff: 8.1, priv: "级差8.1%+董事会席位", releaseDays: calcReleaseDays(10) },
  { level: "黑金卡M8", matchKey: "M8", order: 11, color: "#f43f5e", team: 300000, consume: 150000000, reward: 45, diff: 8.1, priv: "级差8.1%+联合创始人", releaseDays: calcReleaseDays(11) },
  { level: "黑金卡M9", matchKey: "M9", order: 12, color: "#fbbf24", team: 1000000, consume: 500000000, reward: 50, diff: 8.1, priv: "级差8.1%+终身合伙人", releaseDays: calcReleaseDays(12) },
  { level: "杰出贡献者", matchKey: "杰出贡献者", order: 13, color: "#fb7185", team: 0, consume: 0, reward: 7.1, diff: 7.1, priv: "特殊贡献7.1%奖励", releaseDays: calcReleaseDays(13) },
];

export const findTier = (levelName) =>
  PROMOTION_TIERS.find((c) => c.level === levelName || c.matchKey === levelName) || PROMOTION_TIERS[0];

export const MATRIX_LAYERS = [
  { layer: 1, label: "直推", count: 8, pct: 20, color: "#22c55e" },
  { layer: 2, label: "2层", count: 32, pct: 10, color: "#06b6d4" },
  { layer: 3, label: "3层", count: 128, pct: 5, color: "#8b5cf6" },
  { layer: 4, label: "4层", count: 256, pct: 3, color: "#f59e0b" },
  { layer: 5, label: "5层", count: 512, pct: 2, color: "#ec4899" },
  { layer: 6, label: "6层", count: 1024, pct: 1, color: "#14b8a6" },
  { layer: 7, label: "7层", count: 2048, pct: 0.5, color: "#f43f5e" },
  { layer: 8, label: "8层", count: 4096, pct: 0.3, color: "#a855f7" },
  { layer: 9, label: "9层", count: 8192, pct: 0.2, color: "#fbbf24" },
];

export const MERCHANT_REPUTATION_GRADES = [
  { grade: "S", label: "S级商家", minDeposit: 100000, minTrades: 500, color: "#fbbf24", desc: "顶级信誉·优先展示" },
  { grade: "A", label: "A级商家", minDeposit: 50000, minTrades: 200, color: "#22c55e", desc: "优质信誉·推荐交易" },
  { grade: "B", label: "B级商家", minDeposit: 30000, minTrades: 100, color: "#06b6d4", desc: "标准信誉·正常交易" },
  { grade: "C", label: "C级商家", minDeposit: 10000, minTrades: 30, color: "#f59e0b", desc: "基础信誉·谨慎交易" },
  { grade: "D", label: "D级商家", minDeposit: 0, minTrades: 0, color: "#94a3b8", desc: "待评级·限制交易" },
];

export const USER_REPUTATION_GRADES = [
  { grade: "VIP3", label: "钻石用户", minConsume: 20000, color: "#06b6d4", desc: "高消费·高信誉" },
  { grade: "VIP2", label: "白金用户", minConsume: 5000, color: "#cbd5e1", desc: "中高消费·良好信誉" },
  { grade: "VIP1", label: "金卡用户", minConsume: 1000, color: "#f59e0b", desc: "基础消费·已认证" },
  { grade: "普通", label: "普通用户", minConsume: 0, color: "#94a3b8", desc: "未购礼包·待激活" },
];

/** VIP / 商家大礼包定价（规范 7.5） */
export const GIFT_PACKAGES = [
  { id: "gold", name: "金卡", total: 99, cash: 74, nms: 25, bonus: 200, tier: "金卡", releaseDays: calcReleaseDays(1), color: "#f59e0b" },
  { id: "platinum", name: "白金卡", total: 199, cash: 149, nms: 50, bonus: 400, tier: "白金卡", releaseDays: calcReleaseDays(2), color: "#cbd5e1" },
  { id: "diamond", name: "钻石卡", total: 499, cash: 374, nms: 125, bonus: 1000, tier: "钻石卡", releaseDays: calcReleaseDays(3), color: "#06b6d4" },
  { id: "merchant", name: "商家礼包", total: 499, cash: 374, nms: 125, bonus: 1000, tier: "商家", releaseDays: calcReleaseDays(4), color: "#22c55e" },
];

/** 四代币体系（规范 1.4） */
export const TOKENS = [
  { symbol: "NMS", name: "NMS 绿色积分", supply: "19万亿 → 1.9亿", color: "#22c55e", use: "消费返利·打赏·质押·分红" },
  { symbol: "ACS", name: "ACS 稳定币", supply: "弹性发行", color: "#06b6d4", use: "价值尺度·跨链桥锚定" },
  { symbol: "YSE", name: "YSE 收益币", supply: "5亿", color: "#a855f7", use: "收益分配·流动性挖矿" },
  { symbol: "GCP", name: "GCP 治理币", supply: "2.1亿", color: "#f59e0b", use: "DAO投票权·节点治理" },
];

export { calcReleaseDays };
export default PROMOTION_TIERS;
