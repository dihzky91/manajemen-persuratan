import type { Metadata } from "next";
import { PageWrapper } from "@/components/layout/PageWrapper";

export const metadata: Metadata = {
  title: "Data Pegawai | Manajemen Surat IAI Jakarta",
};

export default function Page() {
  return (
    <PageWrapper title="Data Pegawai" description="Daftar dan manajemen pegawai.">
      <div className="bg-card border rounded-lg p-8 text-center text-sm text-muted-foreground">
        Implementasi dalam pengembangan.
      </div>
    </PageWrapper>
  );
}
