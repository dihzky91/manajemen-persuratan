import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { ParticipantManager } from "@/components/sertifikat/ParticipantManager";
import {
  getEvent,
  getEventQuickStats,
} from "@/server/actions/sertifikat/events";
import { listByEvent } from "@/server/actions/sertifikat/participants";

export const metadata: Metadata = {
  title: "Detail Kegiatan Sertifikat | ARKA",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const eventId = Number(id);
  if (!Number.isInteger(eventId) || eventId <= 0) notFound();

  const [event, participantList, initialStats] = await Promise.all([
    getEvent(eventId),
    listByEvent(eventId),
    getEventQuickStats(eventId),
  ]);

  if (!event) notFound();

  return (
    <PageWrapper
      title="Detail Kegiatan"
      description="Kelola peserta, import data, dan QR verifikasi untuk kegiatan ini."
    >
      <ParticipantManager
        event={event}
        initialParticipants={participantList}
        initialStats={initialStats}
      />
    </PageWrapper>
  );
}
