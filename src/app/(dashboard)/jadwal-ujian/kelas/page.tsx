import type { Metadata } from "next";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { KelasManager } from "@/components/jadwal-ujian/KelasManager";
import { getSession } from "@/server/actions/auth";
import { listKelas } from "@/server/actions/jadwal-ujian/kelas";
import { getAllKonfig } from "@/server/actions/jadwal-ujian/config";

export const metadata: Metadata = {
  title: "Kelas Ujian | ARKA",
};

export default async function Page() {
  const [session, data, konfig] = await Promise.all([
    getSession(),
    listKelas(),
    getAllKonfig(),
  ]);
  const role = (session?.user as { role?: string } | undefined)?.role;
  const canManage = role === "admin" || role === "staff";

  return (
    <PageWrapper
      title="Daftar Kelas"
      description="Kelola kelas ujian berdasarkan program, tipe, dan mode pembelajaran."
    >
      <KelasManager
        initialData={data}
        canManage={canManage}
        programOptions={konfig.program}
        tipeOptions={konfig.tipe}
        modeOptions={konfig.mode}
      />
    </PageWrapper>
  );
}
