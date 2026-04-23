import type { Metadata } from "next";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { SuratKeluarManager } from "@/components/surat-keluar/SuratKeluarManager";
import { getSession } from "@/server/actions/auth";
import {
  listSuratKeluar,
  listPejabatAktif,
  listDivisiOptions,
} from "@/server/actions/suratKeluar";

export const metadata: Metadata = {
  title: "Arsip Surat Keluar | Manajemen Surat IAI Jakarta",
};

export default async function Page() {
  const [session, data, pejabatList, divisiList] = await Promise.all([
    getSession(),
    listSuratKeluar(),
    listPejabatAktif(),
    listDivisiOptions(),
  ]);

  const role =
    (session?.user as { role?: string } | undefined)?.role ?? null;

  return (
    <PageWrapper
      title="Arsip Surat Keluar"
      description="Kelola surat keluar, pantau workflow 5 tahap, dan penomoran surat otomatis."
    >
      <SuratKeluarManager
        initialData={data}
        pejabatList={pejabatList}
        divisiList={divisiList}
        role={role}
      />
    </PageWrapper>
  );
}
