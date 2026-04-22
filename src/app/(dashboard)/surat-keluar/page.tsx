import type { Metadata } from "next";
import { PageWrapper } from "@/components/layout/PageWrapper";

export const metadata: Metadata = {
  title: "Arsip Surat Keluar | Manajemen Surat IAI Jakarta",
};

export default function Page() {
  return (
    <PageWrapper title="Arsip Surat Keluar" description="Daftar surat keluar, status workflow, dan nomor surat.">
      <div className="bg-card border rounded-lg p-8 text-center text-sm text-muted-foreground">
        Implementasi dalam pengembangan.
      </div>
    </PageWrapper>
  );
}
