import type { Metadata } from "next";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { EventManager } from "@/components/sertifikat/EventManager";
import { listEvents } from "@/server/actions/sertifikat/events";
import { listSignatories } from "@/server/actions/sertifikat/signatories";

export const metadata: Metadata = {
  title: "Kegiatan Sertifikat | Manajemen Surat IAI Jakarta",
};

export default async function Page() {
  const [events, signatories] = await Promise.all([
    listEvents(),
    listSignatories(),
  ]);

  return (
    <PageWrapper
      title="Sertifikat & Kegiatan"
      description="Kelola kegiatan, penandatangan, peserta, dan QR verifikasi sertifikat."
    >
      <EventManager initialEvents={events} signatoryOptions={signatories} />
    </PageWrapper>
  );
}
