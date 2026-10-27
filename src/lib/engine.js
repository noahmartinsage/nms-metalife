import {
  PROMOTION_TIERS,
  MATRIX_LAYERS,
  MERCHANT_REPUTATION_GRADES,
  USER_REPUTATION_GRADES,
  calcReleaseDays,
  findTier,
} from "./promotionData";

/* ------------------------------------------------------------------ */
/* 7.1 消费分红模型                                                    */
/* ------------------------------------------------------------------ */

export const SPLIT_RULES = {
  userReward: 1.0, // 消费者 1:1 返利
  vipRatio: 0.2, // VIP 推荐人永久 20%
  levelDiffRatio: 0.729, // M1-M9 级差 72.9%
  contributorRatio: 0.071, // 杰出贡献 7.1%
  merchantReturnMultiple: 2, // 商家双倍返还
  nftPoolPhysicalShare: 0.5, // 实物 NFT 池
  nftPoolStoreShare: 0.5, // 门店 NFT 池
};

/**
 * 单笔消费结算拆解
 * @param {number} amount 消费金额（元）
 * @param {number} tipRatio 打赏比例 5-30%
 */
export function calcPaymentSplit(amount = 0, tipRatio = 10) {
  const safeAmount = Math.max(0, Number(amount) || 0);
  const safeTip = Math.min(30, Math.max(5, Number(tipRatio) || 10));
  const merchantConsumed = (safeAmount * safeTip) / 100;
  return {
    amount: safeAmount,
    tipRatio: safeTip,
    userReward: safeAmount * SPLIT_RULES.userReward,
    merchantConsumed,
    merchantReturn: merchantConsumed * SPLIT_RULES.merchantReturnMultiple,
    vipReward: safeAmount * SPLIT_RULES.vipRatio,
    levelDiffReward: safeAmount * SPLIT_RULES.levelDiffRatio,
    contributorReward: safeAmount * SPLIT_RULES.contributorRatio,
    nftPoolAdd: merchantConsumed,
    physicalPoolAdd: merchantConsumed * SPLIT_RULES.nftPoolPhysicalShare,
    storePoolAdd: merchantConsumed * SPLIT_RULES.nftPoolStoreShare,
    totalDistributed:
      safeAmount * (SPLIT_RULES.vipRatio + SPLIT_RULES.levelDiffRatio + SPLIT_RULES.contributorRatio),
  };
}

/* ------------------------------------------------------------------ */
/* 7.2 9×9×9 释放机制                                                  */
/* ------------------------------------------------------------------ */

export const RELEASE = { MAX_DAYS: 999, MIN_DAYS: 31, MAX_SPEED: 999 / 31 };

/** 基础：按晋升等级序号计算释放天数 */
export const releaseDaysByOrder = (order = 0) => calcReleaseDays(Math.min(13, Math.max(0, order)));

/** 三维度：消费(0-9) + 推荐(0-9) + NFT合成(0-9)，最高 27 */
export function calcThreeDimension({ consumption = 0, referral = 0, nft = 0 } = {}) {
  const c = clampLevel(consumption);
  const r = clampLevel(referral);
  const n = clampLevel(nft);
  const total = c + r + n;
  const days = Math.round(999 - (total / 27) * (999 - 31));
  return {
    consumption: c,
    referral: r,
    nft: n,
    total,
    maxTotal: 27,
    days,
    speed: round(999 / days, 2),
  };
}

const clampLevel = (v) => Math.min(9, Math.max(0, Math.floor(Number(v) || 0)));

/** 释放进度 */
export function calcReleaseProgress({ pendingNms = 0, releaseDays = 999, elapsedDays = 0 } = {}) {
  const days = Math.max(1, Math.round(releaseDays));
  const elapsed = Math.min(days, Math.max(0, Math.floor(elapsedDays)));
  const daily = pendingNms / days;
  return {
    totalDays: days,
    elapsedDays: elapsed,
    remainingDays: days - elapsed,
    percent: round((elapsed / days) * 100, 2),
    dailyRelease: round(daily, 4),
    released: round(daily * elapsed, 2),
    remaining: round(daily * (days - elapsed), 2),
    speed: round(999 / days, 2),
  };
}

/** 未来 N 天释放计划 */
export function buildReleaseSchedule({ pendingNms = 0, releaseDays = 999, elapsedDays = 0, days = 7 } = {}) {
  const p = calcReleaseProgress({ pendingNms, releaseDays, elapsedDays });
  return Array.from({ length: days }, (_, i) => ({
    day: i + 1,
    amount: round(p.dailyRelease * (i + 1), 2),
    remaining: round(Math.max(0, p.remaining - p.dailyRelease * (i + 1)), 2),
  }));
}

/** 等级 → 加速倍数表 */
export const RELEASE_TABLE = PROMOTION_TIERS.map((t) => ({
  level: t.level,
  order: t.order,
  days: t.releaseDays,
  speed: round(999 / t.releaseDays, 2),
  color: t.color,
}));

/* ------------------------------------------------------------------ */
/* 7.3 团队矩阵 9 层                                                   */
/* ------------------------------------------------------------------ */

export function calcMatrixRewards(baseAmount = 0) {
  return MATRIX_LAYERS.map((l) => ({
    ...l,
    reward: round((baseAmount * l.pct) / 100, 2),
  }));
}

export const MATRIX_TOTAL_COUNT = MATRIX_LAYERS.reduce((s, l) => s + l.count, 0);
export const MATRIX_TOTAL_PCT = MATRIX_LAYERS.reduce((s, l) => s + l.pct, 0);

/* ------------------------------------------------------------------ */
/* 7.4 NFT 版税四方分配                                                */
/* ------------------------------------------------------------------ */

export function calcRoyaltySplit(price = 0, percent = 10) {
  const total = (Math.max(0, price) * Math.max(0, percent)) / 100;
  return {
    total: round(total, 2),
    referrer: round(total * 0.25, 2),
    merchant: round(total * 0.25, 2),
    node: round(total * 0.25, 2),
    platform: round(total * 0.25, 2),
  };
}

/* ------------------------------------------------------------------ */
/* 7.6 个人发布 NFT 锁定 / 7.7 消费凭证销毁                             */
/* ------------------------------------------------------------------ */

export const calcNftLock = (unitPrice = 0, quantity = 1, lockRatio = 35) => {
  const total = Math.max(0, unitPrice) * Math.max(0, quantity);
  return { total: round(total, 2), lockRatio, locked: round((total * lockRatio) / 100, 2) };
};

export const calcConsumptionProof = (amount = 0, burnRatio = 35) => {
  const total = Math.max(0, amount);
  return {
    amount: total,
    burnRatio,
    burned: round((total * burnRatio) / 100, 2),
    returned: round(total * 1.0, 2),
  };
};

/* ------------------------------------------------------------------ */
/* 7.11 信誉等级（双维度）                                             */
/* ------------------------------------------------------------------ */

export function resolveMerchantGrade(deposit = 0, trades = 0) {
  return (
    MERCHANT_REPUTATION_GRADES.find((g) => deposit >= g.minDeposit && trades >= g.minTrades) ||
    MERCHANT_REPUTATION_GRADES[MERCHANT_REPUTATION_GRADES.length - 1]
  );
}

export function resolveUserGrade(consume = 0) {
  return (
    USER_REPUTATION_GRADES.find((g) => consume >= g.minConsume) ||
    USER_REPUTATION_GRADES[USER_REPUTATION_GRADES.length - 1]
  );
}

/* ------------------------------------------------------------------ */
/* 7.8 AI 熔断触发条件                                                 */
/* ------------------------------------------------------------------ */

export const CIRCUIT_THRESHOLDS = [
  { key: "volatility", label: "全网流动性异常波动", threshold: 25, unit: "%", action: "暂停所有跨链调度" },
  { key: "poolRisk", label: "单矿池资产风险加剧", threshold: 75, unit: "分", action: "从高风险矿池撤回至安全池" },
  { key: "auditAlert", label: "智能合约异常", threshold: 1, unit: "告警", action: "冻结相关资产" },
  { key: "bridgeDelay", label: "跨链桥确认延迟", threshold: 30, unit: "min", action: "暂停桥接通道" },
];

export function evaluateCircuitBreaker(state = {}) {
  const hits = CIRCUIT_THRESHOLDS.filter((t) => (state[t.key] ?? 0) >= t.threshold);
  return {
    triggered: hits.length > 0,
    hits,
    level: hits.length >= 2 ? "critical" : hits.length === 1 ? "warning" : "safe",
  };
}

/* ------------------------------------------------------------------ */
/* 工具函数                                                            */
/* ------------------------------------------------------------------ */

export function round(n, digits = 2) {
  const f = 10 ** digits;
  return Math.round((Number(n) || 0) * f) / f;
}

export { findTier, calcReleaseDays };
