import type { Metadata } from "next";
import { ArrowUpRight, Building2, Clock3, FolderKanban, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dashboard | Manajemen Surat IAI Jakarta",
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[28px] border border-border bg-card shadow-sm">
        <div className="bg-linear-to-r from-primary/10 via-primary/5 to-transparent px-6 py-8 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <Badge variant="outline">Dashboard Foundation</Badge>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">
                Operasional persuratan dimulai dari fondasi yang tertata.
              </h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground lg:text-base">
                Phase 1 memprioritaskan shell aplikasi, autentikasi, visual konsisten, serta modul inti administrasi internal yang dibutuhkan untuk mulai bekerja.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/divisi">
                  Kelola Divisi
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/pegawai">Lihat Pegawai</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Modul Aktif"
          value="4"
          hint="Dashboard, Divisi, Pegawai, Surat Keluar"
          icon={FolderKanban}
        />
        <StatCard
          label="Roadmap Tertunda"
          value="6"
          hint="Ditandai jelas per phase"
          icon={Clock3}
        />
        <StatCard
          label="Divisi"
          value="Siap"
          hint="CRUD tersedia pada phase aktif"
          icon={Building2}
        />
        <StatCard
          label="Kepegawaian"
          value="7 Tab"
          hint="Kerangka modul disiapkan"
          icon={Users}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-[28px] border border-border bg-card p-6 shadow-sm lg:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Fokus Implementasi Phase 1
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Tampilan awal sudah disusun agar terasa seperti produk internal yang siap dipakai.
              </p>
            </div>
            <Badge>Aktif</Badge>
          </div>

          <div className="mt-6 grid gap-3">
            {[
              "Shell aplikasi dengan sidebar, header, dan struktur halaman yang konsisten.",
              "Halaman login formal berbahasa Indonesia dan siap menerima redirect setelah autentikasi.",
              "Dashboard foundation untuk mengarahkan pekerjaan administrasi awal.",
              "Roadmap modul lanjutan tetap terlihat tetapi diberi status nonaktif yang eksplisit.",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-border bg-muted/35 px-4 py-4 text-sm text-foreground"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-border bg-card p-6 shadow-sm lg:p-8">
          <h2 className="text-lg font-semibold text-foreground">Tahap Berikutnya</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Fondasi sudah stabil, dan modul berikutnya dilanjutkan bertahap sesuai roadmap.
          </p>

          <div className="mt-6 space-y-3">
            <PhaseItem
              phase="Phase 2"
              label="Surat Keluar dan penomoran"
              status="Sudah aktif pada shell saat ini."
            />
            <PhaseItem phase="Phase 3" label="Surat Masuk dan disposisi" />
            <PhaseItem phase="Phase 4" label="QR, file, SK, MOU, pejabat" />
            <PhaseItem phase="Phase 5" label="Polish, RBAC, deploy, dan E2E" />
          </div>
        </div>
      </section>
    </div>
  );
}

function PhaseItem({
  phase,
  label,
  status = "Belum dibuka pada shell aktif.",
}: {
  phase: string;
  label: string;
  status?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background px-4 py-4">
      <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
        {phase}
      </p>
      <p className="mt-2 text-sm font-medium text-foreground">{label}</p>
      <p className="mt-1 text-xs text-muted-foreground">{status}</p>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: typeof FolderKanban;
}) {
  return (
    <div className="rounded-[24px] border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            {label}
          </p>
          <p className="mt-3 text-3xl font-semibold text-foreground">{value}</p>
          <p className="mt-2 text-sm text-muted-foreground">{hint}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
