import type { Metadata } from "next";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { UjianTable } from "@/components/jadwal-ujian/UjianTable";
import { getSession } from "@/server/actions/auth";
import { listUjian } from "@/server/actions/jadwal-ujian/ujian";
import { listKelas } from "@/server/actions/jadwal-ujian/kelas";
import { getAllKonfig } from "@/server/actions/jadwal-ujian/config";

export const metadata: Metadata = {
  title: "Jadwal Ujian | Manajemen Surat IAI Jakarta",
};

export default async function Page() {
  const [session, ujianResult, kelasList, konfig] = await Promise.all([
    getSession(),
    listUjian(),
    listKelas(),
    getAllKonfig(),
  ]);

  const role = (session?.user as { role?: string } | undefined)?.role;
  const canManage = role === "admin" || role === "staff";

  return (
    <PageWrapper
      title="Jadwal Ujian"
      description="Daftar seluruh jadwal ujian, penugasan pengawas, dan status konflik."
    >
      <UjianTable
        initialData={ujianResult.rows}
        kelasList={kelasList.map((k) => ({ id: k.id, namaKelas: k.namaKelas, program: k.program }))}
        canManage={canManage}
        programOptions={konfig.program}
      />
    </PageWrapper>
  );
}
