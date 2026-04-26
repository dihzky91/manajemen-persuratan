import type { Metadata } from "next";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { JadwalPengawasView } from "@/components/jadwal-ujian/JadwalPengawasView";
import { listPengawas } from "@/server/actions/jadwal-ujian/pengawas";
import { getPenugasanByPengawas } from "@/server/actions/jadwal-ujian/penugasan";

export const metadata: Metadata = {
  title: "Jadwal Pengawas | Manajemen Surat IAI Jakarta",
};

export default async function Page() {
  const [pengawasList, allPenugasan] = await Promise.all([
    listPengawas(),
    getPenugasanByPengawas(),
  ]);

  return (
    <PageWrapper
      title="Jadwal Pengawas"
      description="Lihat jadwal penugasan per pengawas dan filter berdasarkan periode."
    >
      <JadwalPengawasView
        pengawasList={pengawasList.map((p) => ({ id: p.id, nama: p.nama }))}
        allPenugasan={allPenugasan}
      />
    </PageWrapper>
  );
}
