import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { InstrukturDetail } from "@/components/jadwal-otomatis/InstrukturDetail";
import { listInstructors } from "@/server/actions/jadwal-otomatis/instructors";
import { listExpertise, listUnavailability } from "@/server/actions/jadwal-otomatis/expertise";
import {
  getTeachingHistory,
  getInstructorAllocationSummary,
} from "@/server/actions/jadwal-otomatis/assignments";
import { listPrograms } from "@/server/actions/jadwal-otomatis/programs";
import { listInstructorRates } from "@/server/actions/jadwal-otomatis/honorarium";

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const all = await listInstructors();
  const inst = all.find((i) => i.id === id);
  return { title: inst ? `${inst.name} | Instruktur` : "Instruktur Tidak Ditemukan" };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  const [all, expertise, rates, unavailability, history, programs, allocationSummary] = await Promise.all([
    listInstructors(),
    listExpertise(id),
    listInstructorRates(id),
    listUnavailability(id),
    getTeachingHistory(id),
    listPrograms(),
    getInstructorAllocationSummary(id),
  ]);

  const instructor = all.find((i) => i.id === id);
  if (!instructor) notFound();

  return (
    <PageWrapper title={instructor.name} description="Detail instruktur, keahlian, dan histori mengajar.">
      <InstrukturDetail
        instructor={instructor}
        expertise={expertise}
        rates={rates}
        unavailability={unavailability}
        history={history}
        programs={programs}
        allocationSummary={allocationSummary}
      />
    </PageWrapper>
  );
}
