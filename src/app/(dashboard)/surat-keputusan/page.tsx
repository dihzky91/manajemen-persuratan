import type { Metadata } from "next";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { SuratKeputusanManager } from "@/components/surat-keputusan/SuratKeputusanManager";
import { getSession } from "@/server/actions/auth";
import { listPejabatAktif } from "@/server/actions/suratKeluar";
import { listSuratKeputusan } from "@/server/actions/suratKeputusan";

export const metadata: Metadata = {
  title: "Surat Keputusan | Manajemen Surat IAI Jakarta",
};

export default async function Page() {
  const [session, data, pejabatList] = await Promise.all([
    getSession(),
    listSuratKeputusan(),
    listPejabatAktif(),
  ]);
  const role = (session?.user as { role?: string } | undefined)?.role ?? null;

  return (
    <PageWrapper title="Surat Keputusan" description="Daftar Surat Keputusan (SK).">
      <SuratKeputusanManager initialData={data} pejabatList={pejabatList} role={role} />
    </PageWrapper>
  );
}
