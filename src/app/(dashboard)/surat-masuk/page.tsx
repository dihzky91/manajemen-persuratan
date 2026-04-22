import type { Metadata } from "next";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { RoadmapPlaceholder } from "@/components/layout/RoadmapPlaceholder";

export const metadata: Metadata = {
  title: "Arsip Surat Masuk | Manajemen Surat IAI Jakarta",
};

export default function Page() {
  return (
    <PageWrapper title="Arsip Surat Masuk" description="Daftar surat masuk yang tercatat.">
      <RoadmapPlaceholder
        phase="Phase 3"
        title="Modul surat masuk belum dibuka pada shell aktif"
        description="UI modul ini sengaja ditahan agar ekspektasi pengguna tetap akurat. Setelah Phase 3 dimulai, halaman ini akan menampung input surat masuk, daftar arsip, dan tampilan detail surat."
        scope={[
          "Form input surat masuk",
          "Daftar arsip surat masuk",
          "Halaman detail surat",
          "Integrasi alur disposisi",
        ]}
      />
    </PageWrapper>
  );
}
