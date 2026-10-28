/**
 * 页面路由映射 — 单一真相源
 * createPageUrl 来自 "@/utils"（规范 2.3）
 */
export const PAGE_ROUTES = {
  Home: "/",
  Champions: "/Champions",
  QuantumChain: "/quantum",
  Register: "/register",
  Invite: "/invite",
  Wallet: "/wallet",
  PaymentCenter: "/payment",
  NFTMarket: "/nft",
  DEXTrading: "/dex",
  QuantDashboard: "/quant",
  Monitor: "/monitor",
  Social: "/social",
  Discover: "/discover",
  AIAssistant: "/ai",
  DeFi: "/defi",
  PredictionMarket: "/prediction",
  OTC: "/OTC",
  Profile: "/profile",
  Documentation: "/docs",
  AdminPanel: "/admin",
  Explorer: "/explorer",
  Whitepaper: "/whitepaper",
  MetaPay: "/metapay",
  MetaLife: "/metalife",
  Landing: "/landing",
  CloudStorage: "/cloudstorage",
  LifeScience: "/lifescience",
  ShortVideo: "/shortvideo",
  NearbyMerchants: "/nearby",
  FixedDeposit: "/fixeddeposit",
  UserActivity: "/useractivity",
  OnChainAgent: "/onchainagent",
  DigitalRights: "/digitalrights",
  Singularity: "/singularity",
};

export const createPageUrl = (page) => {
  if (!page) return "/";
  return PAGE_ROUTES[page] || `/${page}`;
};

/** 路由 → 页面名 反查 */
export const pageNameFromPath = (path) => {
  const hit = Object.entries(PAGE_ROUTES).find(([, p]) => p === path);
  return hit ? hit[0] : null;
};

export default createPageUrl;
