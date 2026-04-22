import type { Metadata } from "next";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { RoadmapPlaceholder } from "@/components/layout/RoadmapPlaceholder";

export const metadata: Metadata = {
  title: "Disposisi | Manajemen Surat IAI Jakarta",
};

export default function Page() {
  return (
    <PageWrapper title="Disposisi" description="Kotak masuk disposisi Anda.">
      <RoadmapPlaceholder
        phase="Phase 3"
        title="Inbox disposisi belum aktif"
        description="Disposisi baru dibuka ketika alur surat masuk siap. Dengan begitu notifikasi, rantai disposisi, dan inbox pengguna bisa dihadirkan dalam konteks data yang sudah lengkap."
        scope={[
          "Inbox disposisi pengguna",
          "Status baca dan tindak lanjut",
          "Chain disposisi bertingkat",
          "Notifikasi terkait surat masuk",
        ]}
      />
    </PageWrapper>
  );
}
