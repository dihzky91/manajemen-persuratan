import type { Metadata } from "next";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { TrashManager } from "@/components/sertifikat/TrashManager";
import { listDeletedEvents } from "@/server/actions/sertifikat/events";
import { listDeletedParticipants } from "@/server/actions/sertifikat/participants";

export const metadata: Metadata = {
  title: "Sampah Sertifikat | ARKA",
};

export default async function Page() {
  const [events, participants] = await Promise.all([
    listDeletedEvents(),
    listDeletedParticipants(),
  ]);

  return (
    <PageWrapper
      title="Sampah Sertifikat"
      description="Kegiatan dan peserta yang telah dihapus. Anda dapat memulihkannya kembali."
    >
      <TrashManager initialEvents={events} initialParticipants={participants} />
    </PageWrapper>
  );
}
