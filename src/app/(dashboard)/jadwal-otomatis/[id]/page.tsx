import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { JadwalDetail } from "@/components/jadwal-otomatis/JadwalDetail";
import {
  getKelasOtomatisDetail,
  getSessionsByKelas,
} from "@/server/actions/jadwal-otomatis/kelasOtomatis";
import { getAssignmentsByKelas } from "@/server/actions/jadwal-otomatis/assignments";
import { listInstructors } from "@/server/actions/jadwal-otomatis/instructors";
import { getMateriBlocksByProgram } from "@/server/actions/jadwal-otomatis/expertise";
import { getSession } from "@/server/actions/auth";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const kelas = await getKelasOtomatisDetail(id);
  if (!kelas) return { title: "Kelas Tidak Ditemukan" };
  return {
    title: `${kelas.namaKelas} | Jadwal Otomatis | Manajemen Surat IAI Jakarta`,
  };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  const [kelas, sessions, assignments, instructors, materiBlocks, session] = await Promise.all([
    getKelasOtomatisDetail(id),
    getSessionsByKelas(id),
    getAssignmentsByKelas(id),
    listInstructors(),
    getMateriBlocksByProgram((await getKelasOtomatisDetail(id))?.programId ?? ""),
    getSession(),
  ]);

  if (!kelas) notFound();

  const role = (session?.user as { role?: string } | undefined)?.role;
  const canManage = role === "admin" || role === "staff";

  return (
    <PageWrapper title={kelas.namaKelas} description="Jadwal lengkap kelas pelatihan.">
      <JadwalDetail
        kelas={{
          ...kelas,
          programName: kelas.programName ?? "",
          programCode: kelas.programCode ?? "",
          classTypeName: kelas.classTypeName ?? "",
          mode: kelas.mode ?? "offline",
        }}
        sessions={sessions}
        assignments={assignments}
        instructors={instructors}
        materiBlocks={materiBlocks}
        canManage={canManage}
      />
    </PageWrapper>
  );
}
