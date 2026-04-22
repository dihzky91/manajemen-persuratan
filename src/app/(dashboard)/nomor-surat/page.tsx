import type { Metadata } from "next";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { RoadmapPlaceholder } from "@/components/layout/RoadmapPlaceholder";

export const metadata: Metadata = {
  title: "Nomor Surat | Manajemen Surat IAI Jakarta",
};

export default function Page() {
  return (
    <PageWrapper title="Nomor Surat" description="Manajemen counter nomor surat.">
      <RoadmapPlaceholder
        phase="Phase 4"
        title="Counter nomor surat belum tersedia sebagai modul terpisah"
        description="Penomoran surat akan mulai dipakai pada alur surat keluar, lalu dikembangkan lebih lanjut untuk kebutuhan bulk dan pengelolaan prefix lintas jenis surat."
        scope={[
          "Counter per jenis surat",
          "Konfigurasi prefix nomor surat",
          "Riwayat penomoran",
          "Bulk nomor surat",
        ]}
      />
    </PageWrapper>
  );
}
