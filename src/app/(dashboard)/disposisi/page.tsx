import type { Metadata } from "next";
import { PageWrapper } from "@/components/layout/PageWrapper";

export const metadata: Metadata = {
  title: "Disposisi | Manajemen Surat IAI Jakarta",
};

export default function Page() {
  return (
    <PageWrapper title="Disposisi" description="Kotak masuk disposisi Anda.">
      <div className="bg-card border rounded-lg p-8 text-center text-sm text-muted-foreground">
        Implementasi dalam pengembangan.
      </div>
    </PageWrapper>
  );
}
