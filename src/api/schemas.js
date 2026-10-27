/**
 * 13 个数据实体 JSON Schema（规范 4.2）
 * 同时用于运行时演示数据校验提示，并导出至 base44/entities/*.json
 */

export const UserBalance = {
  name: "UserBalance",
  type: "object",
  properties: {
    user_email: { type: "string" },
    available_nms: { type: "number", default: 0 },
    pending_release_nms: { type: "number", default: 0 },
    locked_nms: { type: "number", default: 0 },
    acs_balance: { type: "number", default: 0 },
    yse_balance: { type: "number", default: 0 },
    gcp_balance: { type: "number", default: 0 },
    total_consumption: { type: "number", default: 0 },
    total_rewards: { type: "number", default: 0 },
    consumption_level: { type: "number", default: 0 },
    referral_level: { type: "number", default: 0 },
    nft_synthesis_level: { type: "number", default: 0 },
    major_level: {
      type: "string",
      enum: ["普通用户", "M1", "M2", "M3", "M4", "M5", "M6", "M7", "M8", "M9"],
      default: "普通用户",
    },
    release_speed_factor: { type: "number", default: 1 },
    release_days: { type: "number", default: 365 },
    referrer_email: { type: "string" },
    referral_code: { type: "string" },
    team_size: { type: "number", default: 0 },
    direct_referrals: { type: "number", default: 0 },
    user_type: {
      type: "string",
      enum: ["普通用户", "VIP用户", "商家", "节点服务商"],
      default: "普通用户",
    },
    sign_in_days: { type: "number", default: 0 },
    last_sign_in: { type: "string", format: "date" },
    nft_physical_count: { type: "number", default: 0 },
    nft_store_count: { type: "number", default: 0 },
    nft_node_count: { type: "number", default: 0 },
    nft_dividends_total: { type: "number", default: 0 },
    royalty_earnings_total: { type: "number", default: 0 },
  },
  required: ["user_email"],
};

export const WalletAccount = {
  name: "WalletAccount",
  type: "object",
  properties: {
    account_name: { type: "string" },
    account_type: { type: "string", enum: ["main", "savings", "trading", "staking", "spending"] },
    address: { type: "string" },
    nms_balance: { type: "number", default: 0 },
    acs_balance: { type: "number", default: 0 },
    yse_balance: { type: "number", default: 0 },
    gcp_balance: { type: "number", default: 0 },
    is_nfc_enabled: { type: "boolean", default: false },
    kyber_public_key: { type: "string" },
  },
  required: ["account_name", "account_type", "address"],
};

export const MerchantStore = {
  name: "MerchantStore",
  type: "object",
  properties: {
    store_name: { type: "string" },
    owner_email: { type: "string" },
    category: { type: "string", enum: ["餐饮", "零售", "服务", "娱乐", "教育", "医疗", "其他"] },
    tip_ratio: { type: "number", default: 10 },
    tip_wallet_balance: { type: "number", default: 0 },
    dividend_pool: { type: "number", default: 0 },
    lucky_packet_pool: { type: "number", default: 0 },
    physical_nft_pool: { type: "number", default: 0 },
    store_nft_pool: { type: "number", default: 0 },
    physical_nft_reserved: { type: "number", default: 0 },
    store_nft_reserved: { type: "number", default: 0 },
    address: { type: "string" },
    latitude: { type: "number" },
    longitude: { type: "number" },
    phone: { type: "string" },
    logo_url: { type: "string" },
    is_verified: { type: "boolean", default: false },
    business_license: { type: "string" },
    operating_permit: { type: "string" },
    qr_code: { type: "string" },
    total_transactions: { type: "number", default: 0 },
    total_sales: { type: "number", default: 0 },
    total_tips_given: { type: "number", default: 0 },
    total_tips_burned: { type: "number", default: 0 },
    physical_nft_issued: { type: "number", default: 0 },
    store_nft_issued: { type: "number", default: 0 },
    store_nft_limit: { type: "number", default: 100 },
    is_node_provider: { type: "boolean", default: false },
    user_matrix_count: { type: "number", default: 0 },
    merchant_matrix_count: { type: "number", default: 0 },
    node_matrix_count: { type: "number", default: 0 },
  },
  required: ["store_name", "owner_email", "category"],
};

export const PromotionLevel = {
  name: "PromotionLevel",
  type: "object",
  properties: {
    level_name: {
      type: "string",
      enum: [
        "普通用户", "VIP1", "VIP2", "VIP3",
        "M1", "M2", "M3", "M4", "M5", "M6", "M7", "M8", "M9", "杰出贡献者",
      ],
    },
    level_order: { type: "number" },
    required_team_size: { type: "number" },
    required_consumption: { type: "number" },
    reward_ratio: { type: "number" },
    level_diff_ratio: { type: "number" },
    privileges: { type: "string" },
    icon: { type: "string" },
    color: { type: "string" },
  },
  required: ["level_name", "level_order"],
};

export const PaymentOrder = {
  name: "PaymentOrder",
  type: "object",
  properties: {
    order_no: { type: "string" },
    merchant_id: { type: "string" },
    merchant_email: { type: "string" },
    merchant_name: { type: "string" },
    user_email: { type: "string" },
    amount: { type: "number" },
    payment_method: { type: "string", enum: ["nms", "wechat", "alipay", "mixed"], default: "nms" },
    tip_ratio: { type: "number" },
    merchant_consumed: { type: "number" },
    user_reward: { type: "number" },
    merchant_return: { type: "number" },
    vip_reward: { type: "number" },
    level_diff_reward: { type: "number" },
    contributor_reward: { type: "number" },
    physical_nft_pool_add: { type: "number" },
    nft_minted: { type: "boolean", default: false },
    nft_id: { type: "string" },
    burned_amount: { type: "number" },
    status: { type: "string", enum: ["pending", "completed", "cancelled", "refunded"], default: "pending" },
    quantum_signature: { type: "string" },
  },
  required: ["order_no", "merchant_email", "user_email", "amount"],
};

export const NFTItem = {
  name: "NFTItem",
  type: "object",
  properties: {
    name: { type: "string" },
    description: { type: "string" },
    image_url: { type: "string" },
    nft_type: { type: "string", enum: ["physical", "store", "node", "personal"] },
    category: { type: "string", enum: ["餐饮", "零售", "服务", "娱乐", "教育", "医疗", "其他"] },
    price: { type: "number" },
    original_value: { type: "number" },
    royalty_percent: { type: "number", default: 10 },
    royalty_referrer: { type: "number", default: 2.5 },
    royalty_merchant: { type: "number", default: 2.5 },
    royalty_node: { type: "number", default: 2.5 },
    royalty_platform: { type: "number", default: 2.5 },
    owner_address: { type: "string" },
    owner_email: { type: "string" },
    creator_address: { type: "string" },
    creator_email: { type: "string" },
    merchant_id: { type: "string" },
    merchant_name: { type: "string" },
    token_id: { type: "string" },
    is_for_sale: { type: "boolean", default: false },
    rarity: { type: "string", enum: ["common", "rare", "epic", "legendary"], default: "common" },
    trade_count: { type: "number", default: 0 },
    total_royalty_earned: { type: "number", default: 0 },
    dividend_earned: { type: "number", default: 0 },
    can_synthesize_with: { type: "array", items: { type: "string" } },
    synthesized_from: { type: "array", items: { type: "string" } },
    synthesis_level: { type: "number", default: 0 },
  },
  required: ["name", "nft_type", "price"],
};

export const Transaction = {
  name: "Transaction",
  type: "object",
  properties: {
    tx_hash: { type: "string" },
    block_number: { type: "number" },
    from_address: { type: "string" },
    to_address: { type: "string" },
    amount: { type: "number" },
    token_type: { type: "string", enum: ["NMS", "ACS", "YSE", "GCP"], default: "NMS" },
    status: { type: "string", enum: ["pending", "confirmed", "failed"], default: "confirmed" },
    gas_fee: { type: "number", default: 0 },
    quantum_signature: { type: "string" },
    signature_time_ms: { type: "number" },
  },
  required: ["tx_hash", "from_address", "to_address", "amount"],
};

export const LiquidityPool = {
  name: "LiquidityPool",
  type: "object",
  properties: {
    pool_name: { type: "string" },
    token_a: { type: "string", enum: ["NMS", "ACS", "YSE", "GCP", "USDT"] },
    token_b: { type: "string", enum: ["NMS", "ACS", "YSE", "GCP", "USDT"] },
    reserve_a: { type: "number", default: 0 },
    reserve_b: { type: "number", default: 0 },
    tvl: { type: "number", default: 0 },
    apy: { type: "number", default: 0 },
    volume_24h: { type: "number", default: 0 },
    fee_percent: { type: "number", default: 0.3 },
  },
  required: ["pool_name", "token_a", "token_b"],
};

export const RedPacket = {
  name: "RedPacket",
  type: "object",
  properties: {
    sender_address: { type: "string" },
    total_amount: { type: "number" },
    remaining_amount: { type: "number" },
    packet_count: { type: "number" },
    claimed_count: { type: "number", default: 0 },
    type: { type: "string", enum: ["lucky", "average", "merchant"], default: "lucky" },
    message: { type: "string" },
    expires_at: { type: "string", format: "date-time" },
    status: { type: "string", enum: ["active", "claimed", "expired"], default: "active" },
  },
  required: ["sender_address", "total_amount", "packet_count"],
};

export const DataAsset = {
  name: "DataAsset",
  type: "object",
  properties: {
    user_email: { type: "string" },
    asset_type: { type: "string", enum: ["consumption", "health", "social", "location", "behavior"] },
    asset_name: { type: "string" },
    data_hash: { type: "string" },
    nft_token_id: { type: "string" },
    estimated_value: { type: "number" },
    is_listed: { type: "boolean", default: false },
    list_price: { type: "number" },
    trade_count: { type: "number", default: 0 },
    total_earnings: { type: "number", default: 0 },
    data_size: { type: "string" },
    status: { type: "string", enum: ["pending", "confirmed", "trading"], default: "pending" },
  },
  required: ["user_email", "asset_type", "asset_name"],
};

export const DAORegion = {
  name: "DAORegion",
  type: "object",
  properties: {
    region_code: { type: "string" },
    region_name: { type: "string" },
    parent_code: { type: "string" },
    level: { type: "string", enum: ["province", "city", "district", "street"] },
    member_count: { type: "number", default: 0 },
    dao_fund: { type: "number", default: 0 },
    is_active: { type: "boolean", default: true },
  },
  required: ["region_code", "region_name", "level"],
};

export const ChatMessage = {
  name: "ChatMessage",
  type: "object",
  properties: {
    region_code: { type: "string" },
    sender_email: { type: "string" },
    sender_name: { type: "string" },
    sender_avatar: { type: "string" },
    message_type: { type: "string", enum: ["text", "image", "red_packet", "nft"], default: "text" },
    content: { type: "string" },
    red_packet_id: { type: "string" },
    is_pinned: { type: "boolean", default: false },
  },
  required: ["region_code", "sender_email", "content"],
};

export const TradingStrategy = {
  name: "TradingStrategy",
  type: "object",
  properties: {
    name: { type: "string" },
    type: {
      type: "string",
      enum: ["arbitrage", "yield_farming", "market_making", "trend_following", "sentiment"],
    },
    status: { type: "string", enum: ["active", "paused", "stopped"], default: "paused" },
    win_rate: { type: "number" },
    pnl: { type: "number" },
    pnl_percent: { type: "number" },
    allocated_capital: { type: "number" },
    risk_level: { type: "string", enum: ["low", "medium", "high"], default: "medium" },
    trades_count: { type: "number", default: 0 },
  },
  required: ["name", "type"],
};

/** 实体创建顺序（规范 4.1） */
export const ENTITY_ORDER = [
  "UserBalance",
  "WalletAccount",
  "MerchantStore",
  "PromotionLevel",
  "PaymentOrder",
  "NFTItem",
  "Transaction",
  "LiquidityPool",
  "RedPacket",
  "DataAsset",
  "DAORegion",
  "ChatMessage",
  "TradingStrategy",
];

export const SCHEMAS = {
  UserBalance,
  WalletAccount,
  MerchantStore,
  PromotionLevel,
  PaymentOrder,
  NFTItem,
  Transaction,
  LiquidityPool,
  RedPacket,
  DataAsset,
  DAORegion,
  ChatMessage,
  TradingStrategy,
};

export default SCHEMAS;
