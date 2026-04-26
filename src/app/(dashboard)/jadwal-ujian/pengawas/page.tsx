import type { Metadata } from "next";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { PengawasManager } from "@/components/jadwal-ujian/PengawasManager";
import { getSession } from "@/server/actions/auth";
import { listPengawas } from "@/server/actions/jadwal-ujian/pengawas";

export const metadata: Metadata = {
  title: "Pengawas Ujian | Manajemen Surat IAI Jakarta",
};

export default async function Page() {
  const [session, data] = await Promise.all([getSession(), listPengawas()]);
  const role = (session?.user as { role?: string } | undefined)?.role;
  const canManage = role === "admin" || role === "staff";

  return (
    <PageWrapper
      title="Daftar Pengawas"
      description="Kelola daftar pengawas ujian dan pantau beban penugasan masing-masing."
    >
      <PengawasManager initialData={data} canManage={canManage} />
    </PageWrapper>
  );
}
