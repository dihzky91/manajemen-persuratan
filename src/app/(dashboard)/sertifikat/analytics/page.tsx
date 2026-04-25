import type { Metadata } from "next";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { AnalyticsCharts } from "@/components/sertifikat/AnalyticsCharts";
import {
  getAnalytics,
  getStats,
} from "@/server/actions/sertifikat/analytics";

export const metadata: Metadata = {
  title: "Analytics Sertifikat | Manajemen Surat IAI Jakarta",
};

export default async function Page() {
  const [stats, analytics] = await Promise.all([getStats(), getAnalytics()]);

  return (
    <PageWrapper
      title="Analytics Sertifikat"
      description="Ringkasan kegiatan, peserta, kategori, dan tren penerbitan sertifikat."
    >
      <AnalyticsCharts stats={stats} analytics={analytics} />
    </PageWrapper>
  );
}
