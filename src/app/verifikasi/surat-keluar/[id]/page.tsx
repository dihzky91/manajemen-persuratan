import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { getSuratKeluarVerificationById } from "@/server/actions/suratKeluar";
import { formatTanggal } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Verifikasi Surat Keluar | Manajemen Surat IAI Jakarta",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

function getVerificationStatus(status: string | null, qrCodeUrl: string | null) {
  if (status === "dibatalkan") {
    return {
      label: "Tidak valid",
      tone: "destructive" as const,
      description: "Surat ini sudah dibatalkan di sistem.",
    };
  }

  if (!qrCodeUrl) {
    return {
      label: "Belum terverifikasi",
      tone: "secondary" as const,
      description: "QR verifikasi untuk surat ini belum tersedia.",
    };
  }

  if (status === "pengarsipan" || status === "selesai") {
    return {
      label: "Valid",
      tone: "default" as const,
      description: "Surat tercatat resmi di sistem manajemen surat.",
    };
  }

  return {
    label: "Dalam proses",
    tone: "outline" as const,
    description: "Surat masih berada dalam alur internal dan belum final.",
  };
}

export default async function VerificationSuratKeluarPage({ params }: PageProps) {
  const { id } = await params;
  const surat = await getSuratKeluarVerificationById(id);

  if (!surat) {
    notFound();
  }

  const verification = getVerificationStatus(surat.status, surat.qrCodeUrl);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7f5ef_0%,#ffffff_100%)] px-4 py-10 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-[32px] border border-border bg-card shadow-sm">
        <section className="border-b border-border bg-linear-to-r from-primary/10 via-primary/5 to-transparent px-6 py-8 sm:px-8">
          <Badge variant={verification.tone}>{verification.label}</Badge>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">
            Verifikasi Surat Keluar
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            {verification.description}
          </p>
        </section>

        <section className="grid gap-4 px-6 py-8 sm:grid-cols-2 sm:px-8">
          <InfoItem label="Nomor Surat" value={surat.nomorSurat ?? "-"} mono />
          <InfoItem
            label="Tanggal Surat"
            value={formatTanggal(surat.tanggalSurat)}
          />
          <InfoItem label="Perihal" value={surat.perihal} />
          <InfoItem label="Tujuan" value={surat.tujuan} />
          <InfoItem
            label="Pejabat Penandatangan"
            value={surat.pejabatNama ?? "-"}
          />
          <InfoItem label="Status Sistem" value={surat.status ?? "-"} />
        </section>

        {surat.fileFinalUrl ? (
          <section className="px-6 pb-8 sm:px-8">
            <Link
              href={surat.fileFinalUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-full border border-border px-4 py-2 text-sm font-medium text-primary transition hover:bg-muted"
            >
              Buka Dokumen Final
            </Link>
          </section>
        ) : null}
      </div>
    </main>
  );
}

function InfoItem({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background px-4 py-4">
      <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
        {label}
      </p>
      <p className={`mt-2 text-sm text-foreground ${mono ? "font-mono" : ""}`}>
        {value}
      </p>
    </div>
  );
}
