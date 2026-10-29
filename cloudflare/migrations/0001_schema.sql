-- NMS MetaLife · D1 初始化（由 scripts/gen-cloudflare.mjs 生成）

CREATE TABLE IF NOT EXISTS "UserBalance" (
  id TEXT PRIMARY KEY,
  "user_email" TEXT,
  "available_nms" REAL,
  "pending_release_nms" REAL,
  "locked_nms" REAL,
  "acs_balance" REAL,
  "yse_balance" REAL,
  "gcp_balance" REAL,
  "total_consumption" REAL,
  "total_rewards" REAL,
  "consumption_level" REAL,
  "referral_level" REAL,
  "nft_synthesis_level" REAL,
  "major_level" TEXT,
  "release_speed_factor" REAL,
  "release_days" REAL,
  "referrer_email" TEXT,
  "referral_code" TEXT,
  "team_size" REAL,
  "direct_referrals" REAL,
  "user_type" TEXT,
  "sign_in_days" REAL,
  "last_sign_in" TEXT,
  "nft_physical_count" REAL,
  "nft_store_count" REAL,
  "nft_node_count" REAL,
  "nft_dividends_total" REAL,
  "royalty_earnings_total" REAL,
  created_date TEXT,
  updated_date TEXT
);
CREATE INDEX IF NOT EXISTS idx_UserBalance_created ON "UserBalance"(created_date);

CREATE TABLE IF NOT EXISTS "WalletAccount" (
  id TEXT PRIMARY KEY,
  "account_name" TEXT,
  "account_type" TEXT,
  "address" TEXT,
  "nms_balance" REAL,
  "acs_balance" REAL,
  "yse_balance" REAL,
  "gcp_balance" REAL,
  "is_nfc_enabled" INTEGER,
  "kyber_public_key" TEXT,
  created_date TEXT,
  updated_date TEXT
);
CREATE INDEX IF NOT EXISTS idx_WalletAccount_created ON "WalletAccount"(created_date);

CREATE TABLE IF NOT EXISTS "MerchantStore" (
  id TEXT PRIMARY KEY,
  "store_name" TEXT,
  "owner_email" TEXT,
  "category" TEXT,
  "tip_ratio" REAL,
  "tip_wallet_balance" REAL,
  "dividend_pool" REAL,
  "lucky_packet_pool" REAL,
  "physical_nft_pool" REAL,
  "store_nft_pool" REAL,
  "physical_nft_reserved" REAL,
  "store_nft_reserved" REAL,
  "address" TEXT,
  "latitude" REAL,
  "longitude" REAL,
  "phone" TEXT,
  "logo_url" TEXT,
  "is_verified" INTEGER,
  "business_license" TEXT,
  "operating_permit" TEXT,
  "qr_code" TEXT,
  "total_transactions" REAL,
  "total_sales" REAL,
  "total_tips_given" REAL,
  "total_tips_burned" REAL,
  "physical_nft_issued" REAL,
  "store_nft_issued" REAL,
  "store_nft_limit" REAL,
  "is_node_provider" INTEGER,
  "user_matrix_count" REAL,
  "merchant_matrix_count" REAL,
  "node_matrix_count" REAL,
  created_date TEXT,
  updated_date TEXT
);
CREATE INDEX IF NOT EXISTS idx_MerchantStore_created ON "MerchantStore"(created_date);

CREATE TABLE IF NOT EXISTS "PromotionLevel" (
  id TEXT PRIMARY KEY,
  "level_name" TEXT,
  "level_order" REAL,
  "required_team_size" REAL,
  "required_consumption" REAL,
  "reward_ratio" REAL,
  "level_diff_ratio" REAL,
  "privileges" TEXT,
  "icon" TEXT,
  "color" TEXT,
  created_date TEXT,
  updated_date TEXT
);
CREATE INDEX IF NOT EXISTS idx_PromotionLevel_created ON "PromotionLevel"(created_date);

CREATE TABLE IF NOT EXISTS "PaymentOrder" (
  id TEXT PRIMARY KEY,
  "order_no" TEXT,
  "merchant_id" TEXT,
  "merchant_email" TEXT,
  "merchant_name" TEXT,
  "user_email" TEXT,
  "amount" REAL,
  "payment_method" TEXT,
  "tip_ratio" REAL,
  "merchant_consumed" REAL,
  "user_reward" REAL,
  "merchant_return" REAL,
  "vip_reward" REAL,
  "level_diff_reward" REAL,
  "contributor_reward" REAL,
  "physical_nft_pool_add" REAL,
  "nft_minted" INTEGER,
  "nft_id" TEXT,
  "burned_amount" REAL,
  "status" TEXT,
  "quantum_signature" TEXT,
  created_date TEXT,
  updated_date TEXT
);
CREATE INDEX IF NOT EXISTS idx_PaymentOrder_created ON "PaymentOrder"(created_date);

CREATE TABLE IF NOT EXISTS "NFTItem" (
  id TEXT PRIMARY KEY,
  "name" TEXT,
  "description" TEXT,
  "image_url" TEXT,
  "nft_type" TEXT,
  "category" TEXT,
  "price" REAL,
  "original_value" REAL,
  "royalty_percent" REAL,
  "royalty_referrer" REAL,
  "royalty_merchant" REAL,
  "royalty_node" REAL,
  "royalty_platform" REAL,
  "owner_address" TEXT,
  "owner_email" TEXT,
  "creator_address" TEXT,
  "creator_email" TEXT,
  "merchant_id" TEXT,
  "merchant_name" TEXT,
  "token_id" TEXT,
  "is_for_sale" INTEGER,
  "rarity" TEXT,
  "trade_count" REAL,
  "total_royalty_earned" REAL,
  "dividend_earned" REAL,
  "can_synthesize_with" TEXT,
  "synthesized_from" TEXT,
  "synthesis_level" REAL,
  created_date TEXT,
  updated_date TEXT
);
CREATE INDEX IF NOT EXISTS idx_NFTItem_created ON "NFTItem"(created_date);

CREATE TABLE IF NOT EXISTS "Transaction" (
  id TEXT PRIMARY KEY,
  "tx_hash" TEXT,
  "block_number" REAL,
  "from_address" TEXT,
  "to_address" TEXT,
  "amount" REAL,
  "token_type" TEXT,
  "status" TEXT,
  "gas_fee" REAL,
  "quantum_signature" TEXT,
  "signature_time_ms" REAL,
  created_date TEXT,
  updated_date TEXT
);
CREATE INDEX IF NOT EXISTS idx_Transaction_created ON "Transaction"(created_date);

CREATE TABLE IF NOT EXISTS "LiquidityPool" (
  id TEXT PRIMARY KEY,
  "pool_name" TEXT,
  "token_a" TEXT,
  "token_b" TEXT,
  "reserve_a" REAL,
  "reserve_b" REAL,
  "tvl" REAL,
  "apy" REAL,
  "volume_24h" REAL,
  "fee_percent" REAL,
  created_date TEXT,
  updated_date TEXT
);
CREATE INDEX IF NOT EXISTS idx_LiquidityPool_created ON "LiquidityPool"(created_date);

CREATE TABLE IF NOT EXISTS "RedPacket" (
  id TEXT PRIMARY KEY,
  "sender_address" TEXT,
  "total_amount" REAL,
  "remaining_amount" REAL,
  "packet_count" REAL,
  "claimed_count" REAL,
  "type" TEXT,
  "message" TEXT,
  "expires_at" TEXT,
  "status" TEXT,
  created_date TEXT,
  updated_date TEXT
);
CREATE INDEX IF NOT EXISTS idx_RedPacket_created ON "RedPacket"(created_date);

CREATE TABLE IF NOT EXISTS "DataAsset" (
  id TEXT PRIMARY KEY,
  "user_email" TEXT,
  "asset_type" TEXT,
  "asset_name" TEXT,
  "data_hash" TEXT,
  "nft_token_id" TEXT,
  "estimated_value" REAL,
  "is_listed" INTEGER,
  "list_price" REAL,
  "trade_count" REAL,
  "total_earnings" REAL,
  "data_size" TEXT,
  "status" TEXT,
  created_date TEXT,
  updated_date TEXT
);
CREATE INDEX IF NOT EXISTS idx_DataAsset_created ON "DataAsset"(created_date);

CREATE TABLE IF NOT EXISTS "DAORegion" (
  id TEXT PRIMARY KEY,
  "region_code" TEXT,
  "region_name" TEXT,
  "parent_code" TEXT,
  "level" TEXT,
  "member_count" REAL,
  "dao_fund" REAL,
  "is_active" INTEGER,
  created_date TEXT,
  updated_date TEXT
);
CREATE INDEX IF NOT EXISTS idx_DAORegion_created ON "DAORegion"(created_date);

CREATE TABLE IF NOT EXISTS "ChatMessage" (
  id TEXT PRIMARY KEY,
  "region_code" TEXT,
  "sender_email" TEXT,
  "sender_name" TEXT,
  "sender_avatar" TEXT,
  "message_type" TEXT,
  "content" TEXT,
  "red_packet_id" TEXT,
  "is_pinned" INTEGER,
  created_date TEXT,
  updated_date TEXT
);
CREATE INDEX IF NOT EXISTS idx_ChatMessage_created ON "ChatMessage"(created_date);

CREATE TABLE IF NOT EXISTS "TradingStrategy" (
  id TEXT PRIMARY KEY,
  "name" TEXT,
  "type" TEXT,
  "status" TEXT,
  "win_rate" REAL,
  "pnl" REAL,
  "pnl_percent" REAL,
  "allocated_capital" REAL,
  "risk_level" TEXT,
  "trades_count" REAL,
  created_date TEXT,
  updated_date TEXT
);
CREATE INDEX IF NOT EXISTS idx_TradingStrategy_created ON "TradingStrategy"(created_date);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'user',
  token TEXT,
  created_date TEXT
);
CREATE TABLE IF NOT EXISTS ledger_meta (key TEXT PRIMARY KEY, value TEXT);
