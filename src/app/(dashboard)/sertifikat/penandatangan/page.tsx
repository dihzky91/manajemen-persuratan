import type { Metadata } from "next";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { SignatoryManager } from "@/components/sertifikat/SignatoryManager";
import { listSignatories } from "@/server/actions/sertifikat/signatories";

export const metadata: Metadata = {
  title: "Penandatangan Sertifikat | ARKA",
};

export default async function Page() {
  const signatories = await listSignatories();

  return (
    <PageWrapper
      title="Penandatangan"
      description="Kelola master data penandatangan sertifikat kegiatan."
    >
      <SignatoryManager initialData={signatories} />
    </PageWrapper>
  );
}
