import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { JadwalDetail } from "@/components/jadwal-otomatis/JadwalDetail";
import { JadwalUjianIntegrasi } from "@/components/jadwal-otomatis/JadwalUjianIntegrasi";
import {
  getKelasOtomatisDetail,
  getSessionsByKelas,
} from "@/server/actions/jadwal-otomatis/kelasOtomatis";
import { getAssignmentsByKelas } from "@/server/actions/jadwal-otomatis/assignments";
import { listInstructors } from "@/server/actions/jadwal-otomatis/instructors";
import { getMateriBlocksByProgram } from "@/server/actions/jadwal-otomatis/expertise";
import { getKelasUjianByPelatihan } from "@/server/actions/jadwal-otomatis/integrasi";
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
  const kelas = await getKelasOtomatisDetail(id);

  if (!kelas) notFound();

  const [sessions, assignments, instructors, materiBlocks, linkedKelasUjian, session] =
    await Promise.all([
      getSessionsByKelas(id),
      getAssignmentsByKelas(id),
      listInstructors(),
      getMateriBlocksByProgram(kelas.programId),
      getKelasUjianByPelatihan(id),
      getSession(),
    ]);

  const role = (session?.user as { role?: string } | undefined)?.role;
  const canManage = role === "admin" || role === "staff";
  const hasExamSessions = sessions.some((s) => s.isExamDay);

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
      <JadwalUjianIntegrasi
        kelasId={id}
        canManage={canManage}
        linkedKelasUjian={linkedKelasUjian}
        hasExamSessions={hasExamSessions}
      />
    </PageWrapper>
  );
}
