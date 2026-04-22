import type { Metadata } from "next";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { RoadmapPlaceholder } from "@/components/layout/RoadmapPlaceholder";

export const metadata: Metadata = {
  title: "Surat Keputusan | Manajemen Surat IAI Jakarta",
};

export default function Page() {
  return (
    <PageWrapper title="Surat Keputusan" description="Daftar Surat Keputusan (SK).">
      <RoadmapPlaceholder
        phase="Phase 4"
        title="Surat Keputusan menunggu fase lanjutan"
        description="Modul SK akan diaktifkan bersama fitur file, QR, dan kapabilitas lanjutan lain. Pada tahap ini halaman tetap tampil untuk menunjukkan arah produk tanpa membuka interaksi yang belum siap."
        scope={[
          "Daftar dan detail SK",
          "Integrasi file lampiran",
          "QR verifikasi surat",
          "Atribut status dokumen",
        ]}
      />
    </PageWrapper>
  );
}
