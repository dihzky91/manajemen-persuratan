import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { BatchDetailView } from "@/components/sertifikat/BatchDetailView";
import { Button } from "@/components/ui/button";
import { getBatch } from "@/server/actions/sertifikat/nomor/batches";
import { requireRole } from "@/server/actions/auth";

export const metadata: Metadata = {
  title: "Detail Batch Sertifikat | Manajemen Surat IAI Jakarta",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;

  const [batch, session] = await Promise.all([
    getBatch(id),
    requireRole(["admin", "staff"]),
  ]);

  if (!batch) notFound();

  const userRole = ((session.user as { role?: string }).role ?? "staff") as string;

  return (
    <PageWrapper
      title={`Batch — ${batch.programName} Angkatan ${batch.angkatan}`}
      description={`${batch.classTypeName} (${batch.classTypeCode}) · ${batch.quantityRequested} nomor · ${batch.firstCertificateNumber} s/d ${batch.lastCertificateNumber}`}
    >
      <div className="mb-5">
        <Button asChild variant="outline" size="sm">
          <Link href="/sertifikat/nomor">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Kembali ke Daftar Batch
          </Link>
        </Button>
      </div>

      <BatchDetailView batch={batch} role={userRole} />
    </PageWrapper>
  );
}
