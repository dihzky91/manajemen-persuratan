import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Button } from "@/components/ui/button";
import { FinanceBatchList } from "@/components/keuangan/FinanceBatchList";
import { listHonorariumBatches } from "@/server/actions/jadwal-otomatis/honorarium";

export const metadata: Metadata = {
  title: "Antrian Pembayaran | Keuangan | ARKA",
};

export default async function Page() {
  const batches = await listHonorariumBatches({ financeOnly: true });

  return (
    <PageWrapper
      title="Antrian Pembayaran Honorarium"
      description="Daftar batch honorarium yang dikirim ke keuangan."
    >
      <div className="mb-5">
        <Button asChild variant="outline" size="sm">
          <Link href="/keuangan">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Kembali ke Dashboard Keuangan
          </Link>
        </Button>
      </div>

      <FinanceBatchList initialBatches={batches} />
    </PageWrapper>
  );
}
