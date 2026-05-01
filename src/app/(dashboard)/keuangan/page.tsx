import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Banknote, CheckCircle2, Clock, Landmark } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUserAccess } from "@/server/actions/auth";
import { listHonorariumBatches } from "@/server/actions/jadwal-otomatis/honorarium";

export const metadata: Metadata = {
  title: "Dashboard Keuangan | Manajemen Surat IAI Jakarta",
};

function formatCurrency(value: number) {
  return `Rp ${Math.round(value).toLocaleString("id-ID")}`;
}

export default async function Page() {
  const access = await getCurrentUserAccess();
  const isSuperAdmin = access?.isSuperAdmin === true;

  const batches = await listHonorariumBatches({ financeOnly: true });

  const pending = batches.filter((b) => b.status === "dikirim_ke_keuangan");
  const inProcess = batches.filter((b) => b.status === "diproses_keuangan");
  const paid = batches.filter((b) => b.status === "dibayar" || b.status === "locked");

  const pendingTotal = pending.reduce((s, b) => s + b.netAmount, 0);
  const inProcessTotal = inProcess.reduce((s, b) => s + b.netAmount, 0);
  const paidTotal = paid.reduce((s, b) => s + b.netAmount, 0);

  return (
    <PageWrapper
      title="Dashboard Keuangan"
      description="Ringkasan status pembayaran honorarium instruktur."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-[28px]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Antrian</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pending.length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Total: {formatCurrency(pendingTotal)}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-[28px]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Diproses</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{inProcess.length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Total: {formatCurrency(inProcessTotal)}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-[28px]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Selesai</CardTitle>
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{paid.length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Total: {formatCurrency(paidTotal)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[28px]">
        <CardHeader className="border-b border-border">
          <CardTitle>Akses Cepat</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-3">
          <Button asChild variant="outline" className="w-full justify-between">
            <Link href="/keuangan/honorarium">
              <span className="flex items-center gap-2">
                <Banknote className="h-4 w-4" />
                Antrian Pembayaran Honorarium
              </span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      {isSuperAdmin ? (
        <Card className="rounded-[28px] border-destructive/30">
          <CardHeader className="border-b border-border">
            <CardTitle>Super Admin</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-3">
            <Button asChild variant="outline" className="w-full justify-between">
              <Link href="/jadwal-otomatis/honorarium">
                <span className="flex items-center gap-2">
                  <Banknote className="h-4 w-4" />
                  Kelola Honorarium (Full Access)
                </span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </PageWrapper>
  );
}
