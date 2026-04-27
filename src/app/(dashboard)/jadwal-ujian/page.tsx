import type { Metadata } from "next";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { UjianTable } from "@/components/jadwal-ujian/UjianTable";
import { getSession } from "@/server/actions/auth";
import { listUjian } from "@/server/actions/jadwal-ujian/ujian";
import { listKelas } from "@/server/actions/jadwal-ujian/kelas";
import { listPengawas } from "@/server/actions/jadwal-ujian/pengawas";
import { listMateri } from "@/server/actions/jadwal-ujian/materi";
import { getAllKonfig } from "@/server/actions/jadwal-ujian/config";

export const metadata: Metadata = {
  title: "Jadwal Ujian | Manajemen Surat IAI Jakarta",
};

export default async function Page() {
  const [session, ujianResult, kelasList, pengawasList, materiList, konfig] = await Promise.all([
    getSession(),
    listUjian(),
    listKelas(),
    listPengawas(),
    listMateri(),
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
        pengawasList={pengawasList.map((p) => ({ id: p.id, nama: p.nama }))}
        materiList={materiList.map((m) => ({ id: m.id, nama: m.nama, program: m.program }))}
        canManage={canManage}
        programOptions={konfig.program}
      />
    </PageWrapper>
  );
}
