import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | Manajemen Surat IAI Jakarta",
};

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Ringkasan aktivitas persuratan &amp; disposisi Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Surat Masuk" value="—" hint="Bulan ini" />
        <StatCard label="Surat Keluar" value="—" hint="Bulan ini" />
        <StatCard label="Disposisi Pending" value="—" hint="Belum dibaca" />
        <StatCard label="SK / MOU Aktif" value="—" hint="Total" />
      </div>

      <div className="mt-8 bg-card border rounded-lg p-6">
        <h2 className="font-medium text-foreground mb-2">Selamat Datang</h2>
        <p className="text-sm text-muted-foreground">
          Infrastruktur sistem sudah terpasang. Lanjutkan dengan menjalankan
          migrasi database, mengisi env, dan mengembangkan fitur sesuai
          roadmap di <code>SYSTEM.md</code>.
        </p>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="bg-card border rounded-lg p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold text-foreground mt-1">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{hint}</p>
    </div>
  );
}
