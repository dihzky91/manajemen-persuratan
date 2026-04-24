import type { Metadata } from "next";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { PejabatManager } from "@/components/pejabat/PejabatManager";
import { getSession } from "@/server/actions/auth";
import { listPegawaiReference } from "@/server/actions/pegawai";
import { listPejabat } from "@/server/actions/pejabat";

export const metadata: Metadata = {
  title: "Pejabat Penandatangan | Manajemen Surat IAI Jakarta",
};

export default async function Page() {
  const [session, data, pegawaiRef] = await Promise.all([
    getSession(),
    listPejabat(),
    listPegawaiReference(),
  ]);
  const role = (session?.user as { role?: string } | undefined)?.role;
  const canManage = role === "admin";

  return (
    <PageWrapper title="Pejabat Penandatangan" description="Daftar pejabat penandatangan surat.">
      <PejabatManager
        initialData={data}
        canManage={canManage}
        userOptions={pegawaiRef.map((item) => ({
          id: item.id,
          label: `${item.namaLengkap} - ${item.email}`,
        }))}
      />
    </PageWrapper>
  );
}
