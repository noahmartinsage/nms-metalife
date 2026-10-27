import React, { useMemo, useState } from "react";
import { MapPin, Navigation, Phone, QrCode, Search, ShieldCheck, Store } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/common/SectionCard";
import { fmtNum } from "@/lib/format";
import { useEntityList } from "@/hooks/useEntity";

const USER_LOC = { lat: 30.2741, lng: 120.1551 };

const CATEGORIES = ["全部", "餐饮", "零售", "服务", "娱乐", "教育", "医疗", "其他"];

function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** 附近商家（地图 + 列表，无第三方地图依赖） */
export default function NearbyMerchants({ compact = false }) {
  const { data: stores, loading } = useEntityList("MerchantStore", {}, "-created_date", 50);
  const [cat, setCat] = useState("全部");
  const [kw, setKw] = useState("");
  const [active, setActive] = useState(null);

  const list = useMemo(() => {
    return stores
      .map((s) => ({ ...s, distance: distanceKm(USER_LOC.lat, USER_LOC.lng, s.latitude, s.longitude) }))
      .filter((s) => (cat === "全部" ? true : s.category === cat))
      .filter((s) => (kw ? s.store_name.includes(kw) || s.address.includes(kw) : true))
      .sort((a, b) => a.distance - b.distance);
  }, [stores, cat, kw]);

  const shown = compact ? list.slice(0, 4) : list;

  const bounds = useMemo(() => {
    const lats = list.map((s) => s.latitude);
    const lngs = list.map((s) => s.longitude);
    return {
      minLat: Math.min(USER_LOC.lat, ...lats),
      maxLat: Math.max(USER_LOC.lat, ...lats),
      minLng: Math.min(USER_LOC.lng, ...lngs),
      maxLng: Math.max(USER_LOC.lng, ...lngs),
    };
  }, [list]);

  const pos = (lat, lng) => ({
    left: `${((lng - bounds.minLng) / Math.max(0.0001, bounds.maxLng - bounds.minLng)) * 84 + 8}%`,
    top: `${(1 - (lat - bounds.minLat) / Math.max(0.0001, bounds.maxLat - bounds.minLat)) * 78 + 11}%`,
  });

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4 text-cyan-300" />
              <h3 className="text-sm font-semibold">附近商家</h3>
              <Badge variant="outline">{list.length} 家</Badge>
            </div>
            {compact && <span className="text-[11px] text-muted-foreground">按距离排序</span>}
          </div>

          {!compact && (
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="搜索商家名称 / 地址"
                  value={kw}
                  onChange={(e) => setKw(e.target.value)}
                  className="h-9 pl-8 text-xs"
                />
              </div>
              <div className="scroll-x gap-1">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCat(c)}
                    className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] transition-colors ${
                      cat === c
                        ? "bg-cyan-400/15 text-cyan-200"
                        : "border border-white/10 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="relative mt-3 h-[180px] overflow-hidden rounded-xl border border-white/10 bg-[#0a1120] grid-bg">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-violet-500/5" />
            <div
              className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
              style={pos(USER_LOC.lat, USER_LOC.lng)}
            >
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-70" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-cyan-400" />
              </span>
            </div>
            {shown.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActive(s)}
                className="absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-lg border border-emerald-400/40 bg-emerald-500/20 px-1.5 py-0.5 text-[9px] text-emerald-200 backdrop-blur transition-transform hover:scale-110"
                style={pos(s.latitude, s.longitude)}
              >
                {s.store_name.slice(0, 4)}
              </button>
            ))}
            <span className="absolute bottom-2 left-2 rounded bg-black/50 px-1.5 py-0.5 text-[9px] text-muted-foreground">
              杭州 · 示意地图（非真实地理底图）
            </span>
          </div>

          <div className="mt-3 space-y-2">
            {loading ? (
              <p className="py-6 text-center text-xs text-muted-foreground">加载中…</p>
            ) : shown.length === 0 ? (
              <EmptyState title="附近暂无商家" desc="尝试切换分类或清除搜索关键词" />
            ) : (
              shown.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActive(s)}
                  className="flex w-full items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-2.5 text-left transition-colors hover:border-white/15 hover:bg-white/[0.05]"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/10 text-xs font-bold text-cyan-200">
                    {s.store_name.slice(0, 1)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-xs font-medium">{s.store_name}</p>
                      {s.is_verified && <ShieldCheck className="h-3 w-3 shrink-0 text-emerald-400" />}
                      <span className="rounded bg-white/5 px-1 text-[9px] text-muted-foreground">{s.category}</span>
                    </div>
                    <p className="truncate text-[10px] text-muted-foreground">{s.address}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="num text-[11px] text-cyan-300">{s.distance.toFixed(2)} km</p>
                    <p className="text-[9px] text-muted-foreground">打赏 {s.tip_ratio}%</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!active} onOpenChange={(v) => !v && setActive(null)}>
        {active && (
          <DialogContent onClose={() => setActive(null)}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {active.store_name}
                {active.is_verified && <Badge variant="success">已认证</Badge>}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-2 text-xs">
              <p className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" /> {active.address}
              </p>
              <p className="flex items-center gap-1.5 text-muted-foreground">
                <Phone className="h-3.5 w-3.5" /> {active.phone}
              </p>
              <p className="flex items-center gap-1.5 text-muted-foreground">
                <Navigation className="h-3.5 w-3.5" /> 距离{" "}
                {distanceKm(USER_LOC.lat, USER_LOC.lng, active.latitude, active.longitude).toFixed(2)} km
              </p>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              {[
                ["累计交易", active.total_transactions],
                ["累计销售额", fmtNum(active.total_sales)],
                ["打赏比例", `${active.tip_ratio}%`],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl border border-white/10 bg-white/[0.03] py-2">
                  <p className="num text-sm font-semibold text-cyan-300">{v}</p>
                  <p className="text-[10px] text-muted-foreground">{k}</p>
                </div>
              ))}
            </div>

            <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <QrCode className="h-3.5 w-3.5" /> 商家收款码
              </p>
              <p className="num mt-1 text-sm font-semibold tracking-wider text-cyan-200">{active.qr_code}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                门店 NFT 已发行 {active.store_nft_issued}/{active.store_nft_limit}
              </p>
            </div>

            <Button className="mt-3 w-full" variant="success">
              <QrCode className="h-4 w-4" /> 前往扫码支付
            </Button>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
