import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { JadwalUjianPengaturan } from "@/components/jadwal-ujian/JadwalUjianPengaturan";
import { getSession } from "@/server/actions/auth";
import { listKonfig } from "@/server/actions/jadwal-ujian/config";

export const metadata: Metadata = {
  title: "Pengaturan Jadwal Ujian | ARKA",
};

export default async function Page() {
  const session = await getSession();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "admin") notFound();

  const rows = await listKonfig();

  return (
    <PageWrapper
      title="Pengaturan Jadwal Ujian"
      description="Kelola nilai program, tipe, dan mode yang tersedia saat membuat kelas ujian."
    >
      <JadwalUjianPengaturan rows={rows} />
    </PageWrapper>
  );
}
