import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Button } from "@/components/ui/button";
import { getSession } from "@/server/actions/auth";
import {
  listDisposisiRecipients,
  listDisposisiTimeline,
} from "@/server/actions/disposisi";
import { getSuratMasukById } from "@/server/actions/suratMasuk";
import { SuratMasukDetailWorkspace } from "@/components/surat-masuk/SuratMasukDetailWorkspace";

export const metadata: Metadata = {
  title: "Detail Surat Masuk | Manajemen Surat IAI Jakarta",
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [session, surat, timeline, recipients] = await Promise.all([
    getSession(),
    getSuratMasukById(id),
    listDisposisiTimeline(),
    listDisposisiRecipients(),
  ]);

  if (!surat) {
    notFound();
  }

  const role =
    (session?.user as { role?: string } | undefined)?.role ?? null;
  const canManage = role === "admin" || role === "staff";
  const canCreateDisposisi = role === "admin" || role === "pejabat";
  const timelineItems = timeline.filter((item) => item.suratMasukId === surat.id);

  return (
    <PageWrapper
      title="Detail Surat Masuk"
      description="Tampilan review penuh untuk arsip surat masuk dan chain disposisinya."
      action={
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/surat-masuk">
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Link>
          </Button>
          {canManage ? (
            <Button asChild variant="outline">
              <Link href="/surat-masuk">
                Kelola Arsip
              </Link>
            </Button>
          ) : null}
        </div>
      }
    >
      <SuratMasukDetailWorkspace
        row={surat}
        timeline={timelineItems}
        recipients={recipients}
        canManage={canManage}
        canCreateDisposisi={canCreateDisposisi}
        showPageLink={false}
      />
    </PageWrapper>
  );
}
