import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { PenugasanManager } from "@/components/jadwal-ujian/PenugasanManager";
import { getSession } from "@/server/actions/auth";
import { getUjianById } from "@/server/actions/jadwal-ujian/ujian";
import { getPenugasanByUjian } from "@/server/actions/jadwal-ujian/penugasan";
import { listPengawas } from "@/server/actions/jadwal-ujian/pengawas";

export const metadata: Metadata = {
  title: "Detail Ujian | Manajemen Surat IAI Jakarta",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;

  const [session, ujian, penugasanList, pengawasList] = await Promise.all([
    getSession(),
    getUjianById(id),
    getPenugasanByUjian(id),
    listPengawas(),
  ]);

  if (!ujian) notFound();

  const role = (session?.user as { role?: string } | undefined)?.role;
  const canManage = role === "admin" || role === "staff";

  return (
    <PageWrapper
      title={ujian.mataPelajaran}
      description={`${ujian.namaKelas} · ${ujian.tanggalUjian} · ${ujian.jamMulai}–${ujian.jamSelesai}`}
    >
      <PenugasanManager
        ujianId={ujian.id}
        mataPelajaran={ujian.mataPelajaran}
        tanggalUjian={ujian.tanggalUjian}
        jamMulai={ujian.jamMulai}
        jamSelesai={ujian.jamSelesai}
        initialPenugasan={penugasanList}
        pengawasList={pengawasList.map((p) => ({ id: p.id, nama: p.nama }))}
        canManage={canManage}
      />
    </PageWrapper>
  );
}
