import type { Metadata } from "next";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { RoadmapPlaceholder } from "@/components/layout/RoadmapPlaceholder";

export const metadata: Metadata = {
  title: "Arsip Surat Keluar | Manajemen Surat IAI Jakarta",
};

export default function Page() {
  return (
    <PageWrapper title="Arsip Surat Keluar" description="Daftar surat keluar, status workflow, dan nomor surat.">
      <RoadmapPlaceholder
        phase="Phase 2"
        title="Modul surat keluar dijadwalkan setelah foundation stabil"
        description="Halaman ini akan menjadi pusat pembuatan surat keluar, pemantauan workflow 5 tahap, serta penomoran surat otomatis. Pada Phase 1 modul ini hanya tampil sebagai roadmap terarah."
        scope={[
          "Form pembuatan surat keluar",
          "Daftar surat keluar dengan status workflow",
          "Stepper 5 tahap",
          "Penomoran surat otomatis",
        ]}
      />
    </PageWrapper>
  );
}
