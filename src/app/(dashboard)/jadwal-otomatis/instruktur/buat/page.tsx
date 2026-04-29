import type { Metadata } from "next";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { FormBuatInstruktur } from "@/components/jadwal-otomatis/FormBuatInstruktur";
import { listPrograms } from "@/server/actions/jadwal-otomatis/programs";
import { listProgramMateriBlocks } from "@/server/actions/jadwal-otomatis/expertise";

export const metadata: Metadata = {
  title: "Tambah Instruktur | Jadwal Otomatis",
};

export default async function Page() {
  const [programs, programBlocks] = await Promise.all([
    listPrograms(),
    listProgramMateriBlocks(),
  ]);

  return (
    <PageWrapper title="Tambah Instruktur" description="Data diri instruktur baru.">
      <FormBuatInstruktur programs={programs} programBlocks={programBlocks} />
    </PageWrapper>
  );
}
