import type { Metadata } from "next";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { RoadmapPlaceholder } from "@/components/layout/RoadmapPlaceholder";

export const metadata: Metadata = {
  title: "Pejabat Penandatangan | Manajemen Surat IAI Jakarta",
};

export default function Page() {
  return (
    <PageWrapper title="Pejabat Penandatangan" description="Daftar pejabat penandatangan surat.">
      <RoadmapPlaceholder
        phase="Phase 4"
        title="Data pejabat penandatangan akan dibuka pada fase lanjutan"
        description="Informasi pejabat aktif sudah menjadi referensi domain, namun UI pengelolaannya baru dibuka setelah modul dokumen lanjutan dan proses penandatanganan siap dihubungkan."
        scope={[
          "Daftar pejabat aktif",
          "Riwayat masa berlaku pejabat",
          "Integrasi penandatangan surat",
          "Sinkronisasi ke template dokumen",
        ]}
      />
    </PageWrapper>
  );
}
