import React from "react";
import { MapPin } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { Badge } from "@/components/ui/badge";
import NearbyMerchants from "@/components/merchant/NearbyMerchants";
import { useEntityList } from "@/hooks/useEntity";
import { DataErrorBanner } from "@/components/common/ModuleState";

export default function NearbyMerchantsPage() {
  const { data: stores, loading, error, refresh } = useEntityList("MerchantStore", {}, "-created_date", 50);
  const verified = stores.filter((s) => s.is_verified).length;

  return (
    <div className="space-y-4">
      <DataErrorBanner error={error} loading={loading} onRetry={refresh} />

      <PageHeader
        icon={MapPin}
        title="附近商家"
        subtitle="RWA 已确权门店 · 扫码消费 1:1 返 NMS · 打赏 5-30% 可调"
        badge={<Badge variant="success">{verified} 家已认证</Badge>}
      />
      <NearbyMerchants />
    </div>
  );
}
