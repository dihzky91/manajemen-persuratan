import type { Metadata } from "next";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { NomorSuratManager } from "@/components/nomor-surat/NomorSuratManager";
import { getSession } from "@/server/actions/auth";
import { listNomorSuratCounters } from "@/server/actions/nomor";

export const metadata: Metadata = {
  title: "Nomor Surat | ARKA",
};

export default async function Page() {
  const [session, data] = await Promise.all([
    getSession(),
    listNomorSuratCounters(),
  ]);
  const role = (session?.user as { role?: string } | undefined)?.role ?? null;

  return (
    <PageWrapper
      title="Nomor Surat"
      description="Manajemen counter nomor surat."
    >
      <NomorSuratManager initialData={data} role={role} />
    </PageWrapper>
  );
}
