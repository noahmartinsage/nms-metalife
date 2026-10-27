/**
 * 页面配置映射（Base44 约定：pages.config.js）
 * 路由 ↔ 页面组件 ↔ 展示名
 */
import Home from "@/pages/Home";
import Champions from "@/pages/Champions";
import QuantumChain from "@/pages/QuantumChain";
import Register from "@/pages/Register";
import Wallet from "@/pages/Wallet";
import PaymentCenter from "@/pages/PaymentCenter";
import NFTMarket from "@/pages/NFTMarket";
import DEXTrading from "@/pages/DEXTrading";
import QuantDashboard from "@/pages/QuantDashboard";
import Monitor from "@/pages/Monitor";
import Social from "@/pages/Social";
import Discover from "@/pages/Discover";
import AIAssistant from "@/pages/AIAssistant";
import DeFi from "@/pages/DeFi";
import PredictionMarket from "@/pages/PredictionMarket";
import OTC from "@/pages/OTC";
import Profile from "@/pages/Profile";
import Documentation from "@/pages/Documentation";
import AdminPanel from "@/pages/AdminPanel";
import Explorer from "@/pages/Explorer";
import Whitepaper from "@/pages/Whitepaper";
import MetaPay from "@/pages/MetaPay";
import MetaLife from "@/pages/MetaLife";
import Landing from "@/pages/Landing";
import CloudStorage from "@/pages/CloudStorage";
import LifeScience from "@/pages/LifeScience";
import ShortVideo from "@/pages/ShortVideo";
import NearbyMerchants from "@/pages/NearbyMerchants";
import FixedDeposit from "@/pages/FixedDeposit";
import UserActivity from "@/pages/UserActivity";
import OnChainAgent from "@/pages/OnChainAgent";
import DigitalRights from "@/pages/DigitalRights";
import Singularity from "@/pages/Singularity";
import PageNotFound from "@/pages/PageNotFound";

export const pagesConfig = {
  Home: { component: Home, label: "首页", path: "/" },
  Champions: { component: Champions, label: "社区动态", path: "/Champions" },
  QuantumChain: { component: QuantumChain, label: "量子公链", path: "/quantum" },
  Register: { component: Register, label: "注册", path: "/register" },
  Wallet: { component: Wallet, label: "钱包", path: "/wallet" },
  PaymentCenter: { component: PaymentCenter, label: "支付中心", path: "/payment" },
  NFTMarket: { component: NFTMarket, label: "AI商城", path: "/nft" },
  DEXTrading: { component: DEXTrading, label: "DEX交易所", path: "/dex" },
  QuantDashboard: { component: QuantDashboard, label: "AI量化", path: "/quant" },
  Monitor: { component: Monitor, label: "监控中心", path: "/monitor" },
  Social: { component: Social, label: "元Social", path: "/social" },
  Discover: { component: Discover, label: "发现", path: "/discover" },
  AIAssistant: { component: AIAssistant, label: "AI管家", path: "/ai" },
  DeFi: { component: DeFi, label: "DeFi金融", path: "/defi" },
  PredictionMarket: { component: PredictionMarket, label: "预测市场", path: "/prediction" },
  OTC: { component: OTC, label: "C2C法币", path: "/OTC" },
  Profile: { component: Profile, label: "个人中心", path: "/profile" },
  Documentation: { component: Documentation, label: "文档中心", path: "/docs" },
  AdminPanel: { component: AdminPanel, label: "管理后台", path: "/admin" },
  Explorer: { component: Explorer, label: "区块浏览器", path: "/explorer" },
  Whitepaper: { component: Whitepaper, label: "白皮书", path: "/whitepaper" },
  MetaPay: { component: MetaPay, label: "元Pay", path: "/metapay" },
  MetaLife: { component: MetaLife, label: "元Life", path: "/metalife" },
  Landing: { component: Landing, label: "落地页", path: "/landing" },
  CloudStorage: { component: CloudStorage, label: "云存储", path: "/cloudstorage" },
  LifeScience: { component: LifeScience, label: "生命科学", path: "/lifescience" },
  ShortVideo: { component: ShortVideo, label: "短视频", path: "/shortvideo" },
  NearbyMerchants: { component: NearbyMerchants, label: "附近商家", path: "/nearby" },
  FixedDeposit: { component: FixedDeposit, label: "定期存款", path: "/fixeddeposit" },
  UserActivity: { component: UserActivity, label: "用户动态", path: "/useractivity" },
  OnChainAgent: { component: OnChainAgent, label: "链上Agent", path: "/onchainagent" },
  DigitalRights: { component: DigitalRights, label: "数字版权", path: "/digitalrights" },
  Singularity: { component: Singularity, label: "奇点", path: "/singularity" },
  PageNotFound: { component: PageNotFound, label: "页面不存在", path: "*" },
};

export default pagesConfig;
