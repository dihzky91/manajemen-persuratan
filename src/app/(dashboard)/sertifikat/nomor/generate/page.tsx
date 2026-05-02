import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { GenerateBatchForm } from "@/components/sertifikat/GenerateBatchForm";
import { Button } from "@/components/ui/button";
import { listCertificatePrograms } from "@/server/actions/sertifikat/nomor/programs";
import {
  listCertificateClassTypes,
  getSerialConfig,
} from "@/server/actions/sertifikat/nomor/classTypes";

export const metadata: Metadata = {
  title: "Generate Batch Sertifikat | ARKA",
  description:
    "Generate batch nomor sertifikat baru dengan sistem serial berkesinambungan.",
};

export default async function Page() {
  const [programs, classTypes, serialInfo] = await Promise.all([
    listCertificatePrograms(),
    listCertificateClassTypes(),
    getSerialConfig(),
  ]);

  return (
    <PageWrapper
      title="Generate Batch Baru"
      description="Buat batch nomor sertifikat baru. Nomor akan melanjutkan serial global yang ada."
    >
      <div className="mb-5">
        <Button asChild variant="outline" size="sm">
          <Link href="/sertifikat/nomor">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Kembali ke Daftar Batch
          </Link>
        </Button>
      </div>

      <GenerateBatchForm
        programs={programs}
        classTypes={classTypes}
        lastSerial={serialInfo.lastSerialNumber}
      />
    </PageWrapper>
  );
}
