import type { Metadata } from "next";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { BebanKerjaChart } from "@/components/jadwal-ujian/BebanKerjaChart";
import { getBebanKerja } from "@/server/actions/jadwal-ujian/bebanKerja";

export const metadata: Metadata = {
  title: "Beban Kerja Pengawas | ARKA",
};

export default async function Page() {
  const initialData = await getBebanKerja({
    tahun: new Date().getFullYear(),
  });

  return (
    <PageWrapper
      title="Beban Kerja Pengawas"
      description="Distribusi penugasan dan analitik beban kerja per pengawas."
    >
      <BebanKerjaChart initialData={initialData} />
    </PageWrapper>
  );
}
