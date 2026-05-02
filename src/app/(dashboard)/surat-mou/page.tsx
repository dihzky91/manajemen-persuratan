import type { Metadata } from "next";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { SuratMouManager } from "@/components/surat-mou/SuratMouManager";
import { getSession } from "@/server/actions/auth";
import { listPejabatAktif } from "@/server/actions/suratKeluar";
import { listSuratMou } from "@/server/actions/suratMou";

export const metadata: Metadata = {
  title: "Surat MOU | ARKA",
};

export default async function Page() {
  const [session, data, pejabatList] = await Promise.all([
    getSession(),
    listSuratMou(),
    listPejabatAktif(),
  ]);
  const role = (session?.user as { role?: string } | undefined)?.role ?? null;

  return (
    <PageWrapper
      title="Surat MOU"
      description="Daftar Memorandum of Understanding."
    >
      <SuratMouManager
        initialData={data}
        pejabatList={pejabatList}
        role={role}
      />
    </PageWrapper>
  );
}
