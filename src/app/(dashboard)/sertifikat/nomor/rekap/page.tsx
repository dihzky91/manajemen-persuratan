import type { Metadata } from "next";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { YearlyReportView } from "@/components/sertifikat/YearlyReportView";
import {
  getAvailableYears,
  getYearlyStats,
  getYearlyProgramStats,
} from "@/server/actions/sertifikat/nomor/batches";

export const metadata: Metadata = {
  title: "Rekap Tahunan Sertifikat | Manajemen Surat IAI Jakarta",
  description: "Rekap statistik penomoran sertifikat per tahun, program, dan jenis kelas.",
};

export default async function Page() {
  const availableYears = await getAvailableYears();

  // Default: tampilkan tahun ini, atau tahun terbaru jika tidak ada data tahun ini
  const currentYear = new Date().getFullYear();
  const initialYear = availableYears.includes(currentYear)
    ? currentYear
    : (availableYears[0] ?? currentYear);

  const [initialStats, initialDetailStats] = await Promise.all([
    getYearlyStats(initialYear),
    getYearlyProgramStats(initialYear),
  ]);

  return (
    <PageWrapper
      title="Rekap Tahunan"
      description="Statistik penomoran sertifikat formal dikelompokkan per tahun, program, dan jenis kelas."
    >
      <YearlyReportView
        availableYears={availableYears.length > 0 ? availableYears : [currentYear]}
        initialYear={initialYear}
        initialStats={initialStats}
        initialDetailStats={initialDetailStats}
      />
    </PageWrapper>
  );
}
