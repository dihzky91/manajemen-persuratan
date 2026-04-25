import { Suspense } from "react";
import { listAuditLog, listAuditEntitasTypes } from "@/server/actions/auditLog";
import AuditLogManager from "@/components/audit-log/AuditLogManager";
import { ShieldCheck } from "lucide-react";
import { getSession } from "@/server/actions/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Audit Log — Manajemen Surat IAI Jakarta",
  description: "Riwayat seluruh aktivitas dan aksi pengguna di sistem.",
};

export default async function AuditLogPage() {
  const session = await getSession();
  if (!session) redirect("/login?redirect=/audit-log");

  const role = (session.user as { role?: string }).role;
  if (role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
        <ShieldCheck className="h-12 w-12 text-muted-foreground opacity-40" />
        <h2 className="text-lg font-semibold">Akses Ditolak</h2>
        <p className="text-muted-foreground text-sm max-w-sm">
          Halaman ini hanya dapat diakses oleh Administrator.
        </p>
      </div>
    );
  }

  const [initialData, entitasTypes] = await Promise.all([
    listAuditLog({ page: 1, pageSize: 25 }),
    listAuditEntitasTypes(),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2.5">
          <ShieldCheck className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Audit Log</h1>
          <p className="text-sm text-muted-foreground">
            Riwayat seluruh aktivitas pengguna di sistem — hanya dapat dilihat oleh Admin.
          </p>
        </div>
      </div>

      {/* Manager */}
      <Suspense fallback={<div className="text-sm text-muted-foreground">Memuat log…</div>}>
        <AuditLogManager initialData={initialData} entitasTypes={entitasTypes} />
      </Suspense>
    </div>
  );
}
