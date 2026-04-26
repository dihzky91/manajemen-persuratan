import type { Metadata } from "next";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { GlobalParticipantSearch } from "@/components/sertifikat/GlobalParticipantSearch";
import { searchAllParticipants } from "@/server/actions/sertifikat/participants";

export const metadata: Metadata = {
  title: "Cari Peserta | Manajemen Surat IAI Jakarta",
};

export default async function Page() {
  const initialData = await searchAllParticipants({ pageSize: 25 });

  return (
    <PageWrapper
      title="Cari Peserta"
      description="Cari peserta lintas kegiatan berdasarkan nama, nomor sertifikat, atau email."
    >
      <GlobalParticipantSearch initialData={initialData} />
    </PageWrapper>
  );
}
