import type { Metadata } from "next";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { RoadmapPlaceholder } from "@/components/layout/RoadmapPlaceholder";

export const metadata: Metadata = {
  title: "Surat MOU | Manajemen Surat IAI Jakarta",
};

export default function Page() {
  return (
    <PageWrapper title="Surat MOU" description="Daftar Memorandum of Understanding.">
      <RoadmapPlaceholder
        phase="Phase 4"
        title="Modul MOU belum dibuka"
        description="Fitur MOU akan dibangun ketika fondasi dokumen lanjutan siap, termasuk penyimpanan file dan dukungan verifikasi berbasis QR."
        scope={[
          "Daftar MOU aktif",
          "Detail dokumen dan metadata",
          "Lampiran file",
          "Verifikasi QR visual",
        ]}
      />
    </PageWrapper>
  );
}
