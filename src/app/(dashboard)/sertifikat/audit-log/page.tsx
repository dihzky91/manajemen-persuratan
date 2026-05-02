import type { Metadata } from "next";
import { PageWrapper } from "@/components/layout/PageWrapper";
import AuditLogManager from "@/components/audit-log/AuditLogManager";
import { listSertifikatAuditLog } from "@/server/actions/auditLog";

export const metadata: Metadata = {
  title: "Audit Log Sertifikat | ARKA",
};

const SERTIFIKAT_ENTITY_TYPES = [
  "sertifikat_event",
  "sertifikat_participant",
  "sertifikat_template",
  "sertifikat_signatory",
];

export default async function Page() {
  const initialData = await listSertifikatAuditLog();

  return (
    <PageWrapper
      title="Audit Log Sertifikat"
      description="Riwayat aktivitas modul Sertifikat & Kegiatan."
    >
      <AuditLogManager
        initialData={initialData}
        entitasTypes={SERTIFIKAT_ENTITY_TYPES}
        scope="sertifikat"
      />
    </PageWrapper>
  );
}
