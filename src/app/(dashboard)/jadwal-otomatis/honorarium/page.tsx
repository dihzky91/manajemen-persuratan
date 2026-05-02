import type { Metadata } from "next";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { HonorariumReport } from "@/components/jadwal-otomatis/HonorariumReport";
import {
  getHonorariumReport,
  listHonorariumBatches,
} from "@/server/actions/jadwal-otomatis/honorarium";
import { listInstructors } from "@/server/actions/jadwal-otomatis/instructors";
import { listPrograms } from "@/server/actions/jadwal-otomatis/programs";

export const metadata: Metadata = {
  title: "Honorarium | Jadwal Otomatis | ARKA",
};

export default async function Page() {
  const [report, batches, instructors, programs] = await Promise.all([
    getHonorariumReport(),
    listHonorariumBatches(),
    listInstructors(),
    listPrograms(),
  ]);

  return (
    <PageWrapper
      title="Laporan Honorarium Instruktur"
      description="Rekap honorarium berdasarkan periode, instruktur, dan program kelas."
    >
      <HonorariumReport
        initialReport={report}
        initialBatches={batches}
        instructors={instructors.map((item) => ({
          id: item.id,
          name: item.name,
        }))}
        programs={programs.map((item) => ({ id: item.id, name: item.name }))}
      />
    </PageWrapper>
  );
}
