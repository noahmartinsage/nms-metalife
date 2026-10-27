import { PROMOTION_TIERS } from "@/lib/promotionData";
import { mockHash, mockQuantumSignature } from "@/lib/format";

export const DEMO_USER = {
  id: "usr_demo_001",
  email: "demo@nms.ai",
  full_name: "陈元",
  role: "user",
  avatar_url: "",
  created_date: "2025-11-08T09:12:00.000Z",
};

/** 确定性随机数，保证每次刷新演示数据一致 */
function mulberry32(a) {
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20261026);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const between = (min, max, digits = 2) =>
  Math.round((min + rand() * (max - min)) * 10 ** digits) / 10 ** digits;

const daysAgo = (n, hours = 0) =>
  new Date(Date.now() - n * 86400000 - hours * 3600000).toISOString();

const ADDRESSES = [
  "0x7A3f9C21bE45d8A0c6F1e2D9b84a5C3e1F0d7B26",
  "0x9C1dE4b7A25f8C0e3D6b1F49aC72e5B8d0F3a6194",
  "0xB52aC71e9D4f6A0b8C3e5D1f7A92c4E6b0D8f3A15",
  "0x3E8bF0c4A71d9B25e6C8f3D0a4B7e1C95F2a6D83",
  "0xD41c7B9e2A85f0C36E1d8B4a7F92c5E0d3A6b81F7",
];

/* ------------------------------ UserBalance ------------------------------ */
const balance = {
  id: "bal_demo_001",
  user_email: DEMO_USER.email,
  available_nms: 12860.5,
  pending_release_nms: 48000,
  locked_nms: 8400,
  acs_balance: 3260.4,
  yse_balance: 1580.2,
  gcp_balance: 820,
  total_consumption: 128600,
  total_rewards: 31240.8,
  consumption_level: 6,
  referral_level: 4,
  nft_synthesis_level: 3,
  major_level: "M3",
  release_speed_factor: 1.81,
  release_days: 552,
  referrer_email: "mentor@nms.ai",
  referral_code: "NMSDEMO",
  team_size: 1364,
  direct_referrals: 8,
  user_type: "VIP用户",
  sign_in_days: 27,
  last_sign_in: new Date().toISOString().slice(0, 10),
  nft_physical_count: 6,
  nft_store_count: 3,
  nft_node_count: 1,
  nft_dividends_total: 2864.4,
  royalty_earnings_total: 1320.75,
  created_date: daysAgo(320),
};

const peerBalances = [
  ["lin.xiaoyu@nms.ai", "林小雨", "M2", 8640.2, 32000, 412],
  ["wang.zhiyuan@nms.ai", "王志远", "M1", 5210.8, 18000, 268],
  ["zhao.mengqi@nms.ai", "赵梦琪", "M4", 24680.4, 92000, 3420],
  ["sun.haoran@nms.ai", "孙浩然", "金卡", 1980.6, 4200, 36],
  ["xu.jingyi@nms.ai", "徐静怡", "M3", 15320.9, 56000, 1024],
].map(([email, name, level, available, pending, team], i) => ({
  id: `bal_peer_${i}`,
  user_email: email,
  full_name: name,
  available_nms: available,
  pending_release_nms: pending,
  locked_nms: 1200 + i * 300,
  acs_balance: 800 + i * 260,
  yse_balance: 420 + i * 120,
  gcp_balance: 120 + i * 40,
  total_consumption: 20000 + i * 18000,
  total_rewards: 6000 + i * 2400,
  consumption_level: 3 + i,
  referral_level: i,
  nft_synthesis_level: i % 4,
  major_level: level,
  release_speed_factor: 1 + i * 0.2,
  release_days: 999 - i * 80,
  referral_code: `NMS${name.slice(0, 1)}${1000 + i}`,
  team_size: team,
  direct_referrals: 8,
  user_type: i % 3 === 0 ? "商家" : "VIP用户",
  sign_in_days: 12 + i,
  last_sign_in: daysAgo(i).slice(0, 10),
  nft_physical_count: i + 1,
  nft_store_count: i % 3,
  nft_node_count: i % 2,
  nft_dividends_total: 320 * (i + 1),
  royalty_earnings_total: 180 * (i + 1),
}));

/* ------------------------------ WalletAccount ------------------------------ */
const walletAccounts = [
  { account_name: "主账户", account_type: "main", nms_balance: 8260.5, acs_balance: 1800, yse_balance: 900, gcp_balance: 520, is_nfc_enabled: true },
  { account_name: "储蓄账户", account_type: "savings", nms_balance: 2400, acs_balance: 860, yse_balance: 380, gcp_balance: 120, is_nfc_enabled: false },
  { account_name: "交易账户", account_type: "trading", nms_balance: 1400, acs_balance: 420, yse_balance: 220, gcp_balance: 140, is_nfc_enabled: false },
  { account_name: "质押账户", account_type: "staking", nms_balance: 600, acs_balance: 120, yse_balance: 60, gcp_balance: 30, is_nfc_enabled: false },
  { account_name: "消费账户", account_type: "spending", nms_balance: 200, acs_balance: 60.4, yse_balance: 20.2, gcp_balance: 10, is_nfc_enabled: true },
].map((a, i) => ({
  id: `wa_${i}`,
  ...a,
  address: ADDRESSES[i % ADDRESSES.length],
  kyber_public_key: `kyber768:${mockHash("", 32)}`,
  created_date: daysAgo(300 - i * 10),
}));

/* ------------------------------ MerchantStore ------------------------------ */
const STORE_SEED = [
  ["元味小馆", "餐饮", "杭州市西湖区文三路 128 号", 30.2741, 120.1551, 12, 6, 42800, 1260, true],
  ["青柠便利", "零售", "杭州市拱墅区莫干山路 66 号", 30.3192, 120.1402, 8, 4, 18600, 860, true],
  ["星野咖啡", "餐饮", "杭州市上城区解放路 22 号", 30.2453, 120.1688, 15, 9, 26400, 1520, true],
  ["悦活健身", "服务", "杭州市滨江区江南大道 588 号", 30.2084, 120.2115, 10, 3, 9800, 340, false],
  ["拾光书店", "教育", "杭州市余杭区文一西路 969 号", 30.2796, 120.0185, 5, 2, 6400, 210, true],
  ["康泰药房", "医疗", "杭州市萧山区市心北路 101 号", 30.1846, 120.2643, 8, 5, 15200, 480, true],
  ["PLAY 电竞馆", "娱乐", "杭州市西湖区教工路 18 号", 30.2838, 120.1288, 20, 8, 31200, 940, false],
  ["鲜物生鲜", "零售", "杭州市钱塘区学源街 66 号", 30.3165, 120.3412, 10, 6, 22400, 1180, true],
];

const stores = STORE_SEED.map(([name, category, address, lat, lng, tip, storeNft, sales, txns, verified], i) => ({
  id: `store_${i}`,
  store_name: name,
  owner_email: `merchant${i}@nms.ai`,
  category,
  tip_ratio: tip,
  tip_wallet_balance: between(1200, 9800),
  dividend_pool: between(3000, 42000),
  lucky_packet_pool: between(500, 5000),
  physical_nft_pool: between(2000, 18000),
  store_nft_pool: between(1000, 12000),
  physical_nft_reserved: between(100, 900),
  store_nft_reserved: between(50, 400),
  address,
  latitude: lat,
  longitude: lng,
  phone: `0571-88${String(100000 + i * 137).slice(0, 6)}`,
  logo_url: "",
  is_verified: verified,
  business_license: verified ? `9133010${i}MA2B${mockHash("", 6).toUpperCase()}` : "",
  operating_permit: verified ? `浙餐证字 2025-${1000 + i}` : "",
  qr_code: `NMS-STORE-${1000 + i}`,
  total_transactions: txns,
  total_sales: sales,
  total_tips_given: Math.round(sales * 0.1),
  total_tips_burned: Math.round(sales * 0.04),
  physical_nft_issued: Math.round(txns * 0.6),
  store_nft_issued: storeNft,
  store_nft_limit: 100,
  is_node_provider: i % 3 === 0,
  user_matrix_count: Math.round(txns * 0.8),
  merchant_matrix_count: Math.round(txns * 0.15),
  node_matrix_count: Math.round(txns * 0.05),
  created_date: daysAgo(280 - i * 12),
}));

/* ------------------------------ PromotionLevel ------------------------------ */
const promotionLevels = PROMOTION_TIERS.map((t, i) => ({
  id: `pl_${i}`,
  level_name: t.level,
  level_order: t.order,
  required_team_size: t.team,
  required_consumption: t.consume,
  reward_ratio: t.reward,
  level_diff_ratio: t.diff,
  privileges: t.priv,
  icon: t.matchKey,
  color: t.color,
  release_days: t.releaseDays,
  created_date: daysAgo(300),
}));

/* ------------------------------ PaymentOrder ------------------------------ */
const paymentOrders = Array.from({ length: 16 }, (_, i) => {
  const store = stores[i % stores.length];
  const amount = between(28, 2680);
  const tip = store.tip_ratio;
  const consumed = Math.round(amount * tip) / 100;
  return {
    id: `po_${i}`,
    order_no: `NMS${20261026000 + i}`,
    merchant_id: store.id,
    merchant_email: store.owner_email,
    merchant_name: store.store_name,
    user_email: i % 5 === 0 ? "lin.xiaoyu@nms.ai" : DEMO_USER.email,
    amount,
    payment_method: pick(["nms", "wechat", "alipay", "mixed"]),
    tip_ratio: tip,
    merchant_consumed: consumed,
    user_reward: amount,
    merchant_return: consumed * 2,
    vip_reward: Math.round(amount * 0.2 * 100) / 100,
    level_diff_reward: Math.round(amount * 0.729 * 100) / 100,
    contributor_reward: Math.round(amount * 0.071 * 100) / 100,
    physical_nft_pool_add: consumed / 2,
    nft_minted: true,
    nft_id: `nft_${i % 12}`,
    burned_amount: Math.round(amount * 0.35 * 100) / 100,
    status: i === 2 ? "pending" : i === 7 ? "refunded" : "completed",
    quantum_signature: mockQuantumSignature(),
    created_date: daysAgo(i, i * 3),
  };
});

/* ------------------------------ NFTItem ------------------------------ */
const NFT_SEED = [
  ["西湖龙井·明前特级 250g", "physical", "餐饮", 680, 980, "legendary", "元味小馆"],
  ["手冲瑰夏·日晒 G1 200g", "physical", "餐饮", 268, 320, "rare", "星野咖啡"],
  ["元味小馆 · 门店股权凭证 #07", "store", "餐饮", 12800, 20000, "epic", "元味小馆"],
  ["青柠便利 · 门店股权凭证 #12", "store", "零售", 8600, 12000, "rare", "青柠便利"],
  ["NMS 共识节点席位 · 华东 03", "node", "其他", 48000, 60000, "legendary", "NMS 基金会"],
  ["NMS 轻节点席位 · 华南 11", "node", "其他", 12000, 15000, "epic", "NMS 基金会"],
  ["星野咖啡 · 年度会员卡", "personal", "餐饮", 1280, 1680, "rare", "星野咖啡"],
  ["悦活健身 · 私教 20 课时", "physical", "服务", 3600, 4200, "common", "悦活健身"],
  ["拾光书店 · 限量签名藏书", "physical", "教育", 880, 1200, "epic", "拾光书店"],
  ["康泰药房 · 健康管理年卡", "personal", "医疗", 660, 900, "common", "康泰药房"],
  ["PLAY 电竞馆 · 包厢季卡", "personal", "娱乐", 1980, 2400, "rare", "PLAY 电竞馆"],
  ["鲜物生鲜 · 产地溯源礼盒", "physical", "零售", 398, 520, "common", "鲜物生鲜"],
];

const nftItems = NFT_SEED.map(([name, nft_type, category, price, original_value, rarity, merchant], i) => ({
  id: `nft_${i}`,
  name,
  description:
    nft_type === "store"
      ? "门店经营收益权凭证，按季度享受门店分红池分配，永久版税四方分成。"
      : nft_type === "node"
        ? "NMS 公链节点席位，参与 PoS + AI 验证出块，享 GCP 治理投票权。"
        : "实物资产已完成 RWA 确权：法律公证 + AI 合规评分 + 3/5 多签 + DOI 存证。",
  image_url: "",
  nft_type,
  category,
  price,
  original_value,
  royalty_percent: 10,
  royalty_referrer: 2.5,
  royalty_merchant: 2.5,
  royalty_node: 2.5,
  royalty_platform: 2.5,
  owner_address: ADDRESSES[i % ADDRESSES.length],
  owner_email: i < 4 ? DEMO_USER.email : `holder${i}@nms.ai`,
  creator_address: ADDRESSES[(i + 2) % ADDRESSES.length],
  creator_email: `merchant${i % stores.length}@nms.ai`,
  merchant_id: stores[i % stores.length].id,
  merchant_name: merchant,
  token_id: `#${1000 + i}`,
  is_for_sale: i % 3 !== 0,
  rarity,
  trade_count: Math.floor(rand() * 24),
  total_royalty_earned: between(0, 480),
  dividend_earned: between(0, 1260),
  can_synthesize_with: [],
  synthesized_from: [],
  synthesis_level: i % 4,
  created_date: daysAgo(200 - i * 8),
}));

/* ------------------------------ Transaction ------------------------------ */
const txTypes = ["NMS", "ACS", "YSE", "GCP"];
const transactions = Array.from({ length: 26 }, (_, i) => ({
  id: `tx_${i}`,
  tx_hash: mockHash(),
  block_number: 18492000 - i * 37,
  from_address: ADDRESSES[i % ADDRESSES.length],
  to_address: ADDRESSES[(i + 3) % ADDRESSES.length],
  amount: between(12, 8600),
  token_type: txTypes[i % txTypes.length],
  status: i === 4 ? "pending" : i === 11 ? "failed" : "confirmed",
  gas_fee: 0,
  quantum_signature: `KYBER768-${mockHash("", 12).toUpperCase()}`,
  signature_time_ms: Date.now() - i * 1800000,
  created_date: daysAgo(i % 12, i * 2),
}));

/* ------------------------------ LiquidityPool ------------------------------ */
const pools = [
  ["NMS/ACS", "NMS", "ACS", 4_820_000, 2_640_000, 186.4, 18_600_000, 0.3],
  ["NMS/USDT", "NMS", "USDT", 3_260_000, 1_240_000, 142.8, 24_800_000, 0.3],
  ["YSE/NMS", "YSE", "NMS", 1_840_000, 2_960_000, 268.2, 8_640_000, 0.25],
  ["GCP/ACS", "GCP", "ACS", 960_000, 1_120_000, 96.4, 3_280_000, 0.25],
  ["ACS/USDT", "ACS", "USDT", 6_400_000, 6_380_000, 12.6, 42_600_000, 0.1],
  ["NMS/YSE", "NMS", "YSE", 2_180_000, 1_460_000, 214.5, 6_920_000, 0.35],
].map(([pool_name, token_a, token_b, reserve_a, reserve_b, apy, volume_24h, fee_percent], i) => ({
  id: `pool_${i}`,
  pool_name,
  token_a,
  token_b,
  reserve_a,
  reserve_b,
  tvl: reserve_a + reserve_b,
  apy,
  volume_24h,
  fee_percent,
  created_date: daysAgo(240 - i * 20),
}));

/* ------------------------------ RedPacket ------------------------------ */
const redPackets = [
  ["元味小馆 · 消费红包雨", 5000, 200, "lucky", "恭喜发财，消费即分红"],
  ["星野咖啡 · 新客礼", 1200, 100, "average", "第一杯，我们请"],
  ["NMS 社区 · 周周有礼", 20000, 888, "lucky", "共同富裕，人人有份"],
  ["青柠便利 · 到店红包", 600, 60, "merchant", "到店消费即领"],
].map(([message, total_amount, packet_count, type, msg], i) => ({
  id: `rp_${i}`,
  sender_address: ADDRESSES[i % ADDRESSES.length],
  total_amount,
  remaining_amount: Math.round(total_amount * between(0.2, 0.8)),
  packet_count,
  claimed_count: Math.round(packet_count * between(0.3, 0.85)),
  type,
  message: msg,
  expires_at: new Date(Date.now() + (i + 1) * 86400000).toISOString(),
  status: "active",
  created_date: daysAgo(i),
}));

/* ------------------------------ DataAsset ------------------------------ */
const dataAssets = [
  ["consumption", "近 12 个月消费行为图谱", 1280, "1.8 MB", "confirmed", true, 880],
  ["health", "可穿戴设备健康时序数据", 2460, "42 MB", "confirmed", true, 1520],
  ["social", "社交图谱（脱敏）· 3 度关系", 960, "6.4 MB", "trading", true, 640],
  ["location", "城市出行轨迹（栅格化）", 1480, "12 MB", "confirmed", false, 0],
  ["behavior", "DEX 交易偏好模型特征集", 3200, "2.2 MB", "confirmed", true, 2180],
].map(([asset_type, asset_name, estimated_value, data_size, status, is_listed, list_price], i) => ({
  id: `da_${i}`,
  user_email: DEMO_USER.email,
  asset_type,
  asset_name,
  data_hash: mockHash("0x", 32),
  nft_token_id: `#D${2000 + i}`,
  estimated_value,
  is_listed,
  list_price,
  trade_count: Math.floor(rand() * 12),
  total_earnings: between(0, 900),
  data_size,
  status,
  created_date: daysAgo(60 - i * 8),
}));

/* ------------------------------ DAORegion ------------------------------ */
const regions = [
  ["330000", "浙江省", "", "province", 128460, 8_640_000],
  ["330100", "杭州市", "330000", "city", 42680, 3_260_000],
  ["330106", "西湖区", "330100", "district", 12860, 1_480_000],
  ["330106001", "文三路街道", "330106", "street", 3260, 486_000],
  ["310000", "上海市", "", "province", 96420, 6_820_000],
  ["440300", "深圳市", "440000", "city", 38260, 2_940_000],
].map(([region_code, region_name, parent_code, level, member_count, dao_fund], i) => ({
  id: `dr_${i}`,
  region_code,
  region_name,
  parent_code,
  level,
  member_count,
  dao_fund,
  is_active: true,
  created_date: daysAgo(280),
}));

/* ------------------------------ ChatMessage ------------------------------ */
const chatMessages = [
  ["330106", "林小雨", "西湖区本周的 DAO 提案投票开始了，关于商家补贴池比例调整。"],
  ["330106", "王志远", "支持提高餐饮类商家补贴到 12%，线下客流明显在回升。"],
  ["330106", "赵梦琪", "我补充一份数据：本区 30 天复购率 43%，高于全市均值。"],
  ["330106", "陈元", "已投票赞成。另外建议把红包池和分红池分开计账。"],
  ["330106", "徐静怡", "同意，分开计账后审计更清晰。"],
  ["330106", "孙浩然", "有人知道 9×9×9 的 NFT 合成维度怎么快速提升吗？"],
  ["330106", "陈元", "合成 3 次同级 NFT 可 +1 维度，最高 9 级，配合消费维度最快 31 天释放。"],
  ["330106", "林小雨", "刚刚在元味小馆消费 268，秒到账 268 NMS，还铸了个实物 NFT。"],
  ["330106", "王志远", "这就是消费即铸造，版税还是永久四方分成。"],
  ["330106", "赵梦琪", "下周线下沙龙在文三路，报名链接我发群里了。"],
  ["330106", "徐静怡", "收到，我带两个新同事一起。"],
  ["330106", "陈元", "欢迎，记得带推荐码，新人首购翻倍赠送。"],
].map(([region_code, sender_name, content], i) => ({
  id: `cm_${i}`,
  region_code,
  sender_email: i === 3 || i === 6 || i === 11 ? DEMO_USER.email : `member${i}@nms.ai`,
  sender_name,
  sender_avatar: "",
  message_type: i === 7 ? "nft" : "text",
  content,
  red_packet_id: "",
  is_pinned: i === 0,
  created_date: new Date(Date.now() - (12 - i) * 1800000).toISOString(),
}));

/* ------------------------------ TradingStrategy ------------------------------ */
const strategies = [
  ["三池跨链套利 v3", "arbitrage", "active", 78.4, 28640.2, 18.6, 150000, "medium", 1284],
  ["稳定币收益农场", "yield_farming", "active", 92.1, 12680.4, 12.4, 320000, "low", 486],
  ["NMS 做市网格", "market_making", "active", 68.2, 8640.8, 8.2, 260000, "medium", 3240],
  ["趋势跟踪 · 4H", "trend_following", "paused", 54.6, -3260.4, -4.8, 120000, "high", 862],
  ["情绪因子 · 社交热度", "sentiment", "active", 61.8, 4260.2, 6.4, 80000, "high", 642],
  ["Alpha 六因子组合", "trend_following", "active", 74.2, 18420.6, 22.8, 180000, "medium", 962],
].map(([name, type, status, win_rate, pnl, pnl_percent, allocated_capital, risk_level, trades_count], i) => ({
  id: `ts_${i}`,
  name,
  type,
  status,
  win_rate,
  pnl,
  pnl_percent,
  allocated_capital,
  risk_level,
  trades_count,
  created_date: daysAgo(120 - i * 12),
}));

export function buildSeed() {
  return {
    UserBalance: [balance, ...peerBalances],
    WalletAccount: walletAccounts,
    MerchantStore: stores,
    PromotionLevel: promotionLevels,
    PaymentOrder: paymentOrders,
    NFTItem: nftItems,
    Transaction: transactions,
    LiquidityPool: pools,
    RedPacket: redPackets,
    DataAsset: dataAssets,
    DAORegion: regions,
    ChatMessage: chatMessages,
    TradingStrategy: strategies,
  };
}

export { ADDRESSES };
