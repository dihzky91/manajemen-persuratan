import type { Metadata } from "next";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { FormBuatInstruktur } from "@/components/jadwal-otomatis/FormBuatInstruktur";

export const metadata: Metadata = {
  title: "Tambah Instruktur | Jadwal Otomatis",
};

export default function Page() {
  return (
    <PageWrapper title="Tambah Instruktur" description="Data diri instruktur baru.">
      <FormBuatInstruktur />
    </PageWrapper>
  );
}
