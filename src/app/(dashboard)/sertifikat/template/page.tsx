import type { Metadata } from "next";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { TemplateManager } from "@/components/sertifikat/TemplateManager";
import { listTemplates } from "@/server/actions/sertifikat/templates";

export const metadata: Metadata = {
  title: "Template Sertifikat | ARKA",
};

export default async function Page() {
  const templates = await listTemplates({ isActive: true });

  return (
    <PageWrapper
      title="Template Sertifikat"
      description="Kelola template gambar sertifikat dan posisi field cetak."
    >
      <TemplateManager templates={templates} />
    </PageWrapper>
  );
}
