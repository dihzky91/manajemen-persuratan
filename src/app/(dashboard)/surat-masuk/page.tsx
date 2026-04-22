import type { Metadata } from "next";
import { PageWrapper } from "@/components/layout/PageWrapper";

export const metadata: Metadata = {
  title: "Arsip Surat Masuk | Manajemen Surat IAI Jakarta",
};

export default function Page() {
  return (
    <PageWrapper title="Arsip Surat Masuk" description="Daftar surat masuk yang tercatat.">
      <div className="bg-card border rounded-lg p-8 text-center text-sm text-muted-foreground">
        Implementasi dalam pengembangan.
      </div>
    </PageWrapper>
  );
}
