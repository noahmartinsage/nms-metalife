import React, { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Layout from "./Layout";
import { Toaster } from "./components/ui/toast";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { PAGE_ROUTES } from "./utils";

import Home from "./pages/Home";
import Champions from "./pages/Champions";
import QuantumChain from "./pages/QuantumChain";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Invite from "./pages/Invite";
import Wallet from "./pages/Wallet";
import PaymentCenter from "./pages/PaymentCenter";
import NFTMarket from "./pages/NFTMarket";
import DEXTrading from "./pages/DEXTrading";
import QuantDashboard from "./pages/QuantDashboard";
import Monitor from "./pages/Monitor";
import Social from "./pages/Social";
import Discover from "./pages/Discover";
import AIAssistant from "./pages/AIAssistant";
import DeFi from "./pages/DeFi";
import PredictionMarket from "./pages/PredictionMarket";
import OTC from "./pages/OTC";
import Profile from "./pages/Profile";
import Documentation from "./pages/Documentation";
import AdminPanel from "./pages/AdminPanel";
import Explorer from "./pages/Explorer";
import Whitepaper from "./pages/Whitepaper";
import MetaPay from "./pages/MetaPay";
import MetaLife from "./pages/MetaLife";
import Landing from "./pages/Landing";
import CloudStorage from "./pages/CloudStorage";
import LifeScience from "./pages/LifeScience";
import ShortVideo from "./pages/ShortVideo";
import NearbyMerchants from "./pages/NearbyMerchants";
import FixedDeposit from "./pages/FixedDeposit";
import UserActivity from "./pages/UserActivity";
import OnChainAgent from "./pages/OnChainAgent";
import DigitalRights from "./pages/DigitalRights";
import Singularity from "./pages/Singularity";
import PageNotFound from "./pages/PageNotFound";

const ROUTES = [
  { path: PAGE_ROUTES.Home, element: Home },
  { path: PAGE_ROUTES.Champions, element: Champions },
  { path: PAGE_ROUTES.QuantumChain, element: QuantumChain },
  { path: PAGE_ROUTES.Login, element: Login },
  { path: PAGE_ROUTES.Register, element: Register },
  { path: PAGE_ROUTES.Invite, element: Invite },
  { path: PAGE_ROUTES.Wallet, element: Wallet },
  { path: PAGE_ROUTES.PaymentCenter, element: PaymentCenter },
  { path: PAGE_ROUTES.NFTMarket, element: NFTMarket },
  { path: PAGE_ROUTES.DEXTrading, element: DEXTrading },
  { path: PAGE_ROUTES.QuantDashboard, element: QuantDashboard },
  { path: PAGE_ROUTES.Monitor, element: Monitor },
  { path: PAGE_ROUTES.Social, element: Social },
  { path: PAGE_ROUTES.Discover, element: Discover },
  { path: PAGE_ROUTES.AIAssistant, element: AIAssistant },
  { path: PAGE_ROUTES.DeFi, element: DeFi },
  { path: PAGE_ROUTES.PredictionMarket, element: PredictionMarket },
  { path: PAGE_ROUTES.OTC, element: OTC },
  { path: PAGE_ROUTES.Profile, element: Profile },
  { path: PAGE_ROUTES.Documentation, element: Documentation },
  { path: PAGE_ROUTES.AdminPanel, element: AdminPanel },
  { path: PAGE_ROUTES.Explorer, element: Explorer },
  { path: PAGE_ROUTES.Whitepaper, element: Whitepaper },
  { path: PAGE_ROUTES.MetaPay, element: MetaPay },
  { path: PAGE_ROUTES.MetaLife, element: MetaLife },
  { path: PAGE_ROUTES.CloudStorage, element: CloudStorage },
  { path: PAGE_ROUTES.LifeScience, element: LifeScience },
  { path: PAGE_ROUTES.ShortVideo, element: ShortVideo },
  { path: PAGE_ROUTES.NearbyMerchants, element: NearbyMerchants },
  { path: PAGE_ROUTES.FixedDeposit, element: FixedDeposit },
  { path: PAGE_ROUTES.UserActivity, element: UserActivity },
  { path: PAGE_ROUTES.OnChainAgent, element: OnChainAgent },
  { path: PAGE_ROUTES.DigitalRights, element: DigitalRights },
  { path: PAGE_ROUTES.Singularity, element: Singularity },
];

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" in window ? "auto" : "auto" });
  }, [pathname]);
  return null;
}

/** 捕获推荐码（?ref=CODE）并本地绑定 */
function useReferralCapture() {
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) localStorage.setItem("nms_ref_code", ref.toUpperCase());
  }, []);
}

export default function App() {
  useReferralCapture();

  return (
    <>
      <ScrollToTop />
      <ErrorBoundary>
      <Routes>
        {/* 落地页：全屏无导航 */}
        <Route path={PAGE_ROUTES.Landing} element={<Landing />} />

        {ROUTES.map(({ path, element: Page }) => (
          <Route
            key={path}
            path={path}
            element={
              <Layout>
                <Page />
              </Layout>
            }
          />
        ))}

        <Route
          path="*"
          element={
            <Layout>
              <PageNotFound />
            </Layout>
          }
        />
      </Routes>
      </ErrorBoundary>
      <Toaster />
    </>
  );
}
