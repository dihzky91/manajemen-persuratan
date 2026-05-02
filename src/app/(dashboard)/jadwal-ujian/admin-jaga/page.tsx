import type { Metadata } from "next";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { AdminJagaView } from "@/components/jadwal-ujian/AdminJagaView";
import {
  listJadwalAdminJaga,
  getBebanJadwalAdminJaga,
} from "@/server/actions/jadwal-ujian/jadwalAdminJaga";
import { listPengawas } from "@/server/actions/jadwal-ujian/pengawas";
import { listKelas } from "@/server/actions/jadwal-ujian/kelas";
import { getSystemSettings } from "@/server/actions/systemSettings";

export const metadata: Metadata = {
  title: "Admin Jaga | ARKA",
};

export default async function Page() {
  const [rows, beban, pengawasList, kelasList, systemSettings] =
    await Promise.all([
      listJadwalAdminJaga(),
      getBebanJadwalAdminJaga(),
      listPengawas(),
      listKelas(),
      getSystemSettings(),
    ]);

  return (
    <PageWrapper
      title="Admin Jaga"
      description="Jadwal piket admin jaga per sesi kelas."
    >
      <AdminJagaView
        rows={rows}
        beban={beban}
        pengawasOptions={pengawasList.map((p) => ({ id: p.id, nama: p.nama }))}
        kelasOptions={kelasList.map((k) => ({
          id: k.id,
          namaKelas: k.namaKelas,
          program: k.program,
        }))}
        systemIdentity={{
          namaSistem: systemSettings.namaSistem,
          logoUrl: systemSettings.logoUrl,
        }}
      />
    </PageWrapper>
  );
}
