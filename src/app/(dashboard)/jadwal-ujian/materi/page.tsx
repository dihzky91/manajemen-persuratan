import type { Metadata } from "next";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { MateriManager } from "@/components/jadwal-ujian/MateriManager";
import { getSession } from "@/server/actions/auth";
import { listMateri } from "@/server/actions/jadwal-ujian/materi";
import { getKonfigByJenis } from "@/server/actions/jadwal-ujian/config";

export const metadata: Metadata = {
  title: "Materi Ujian | ARKA",
};

export default async function Page() {
  const [session, data, programOptions] = await Promise.all([
    getSession(),
    listMateri(),
    getKonfigByJenis("program"),
  ]);
  const role = (session?.user as { role?: string } | undefined)?.role;
  const canManage = role === "admin" || role === "staff";

  return (
    <PageWrapper
      title="Daftar Materi Ujian"
      description="Kelola master mata ujian yang tersedia saat membuat jadwal ujian."
    >
      <MateriManager
        initialData={data}
        canManage={canManage}
        programOptions={programOptions}
      />
    </PageWrapper>
  );
}
