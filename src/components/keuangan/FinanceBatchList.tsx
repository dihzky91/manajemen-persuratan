"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Eye, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { listHonorariumBatches } from "@/server/actions/jadwal-otomatis/honorarium";
import type { HonorariumBatchRow } from "@/server/actions/jadwal-otomatis/honorarium";

type BatchStatusFilter = "" | "dikirim_ke_keuangan" | "diproses_keuangan" | "dibayar" | "locked";

interface FinanceBatchListProps {
  initialBatches: HonorariumBatchRow[];
}

function formatCurrency(value: number) {
  return `Rp ${Math.round(value).toLocaleString("id-ID")}`;
}

function statusLabel(status: string) {
  if (status === "draft") return "Draft";
  if (status === "dikirim_ke_keuangan") return "Dikirim ke Keuangan";
  if (status === "diproses_keuangan") return "Diproses Keuangan";
  if (status === "dibayar") return "Dibayar";
  if (status === "locked") return "Locked";
  return status;
}

function statusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  if (status === "locked" || status === "dibayar") return "default";
  if (status === "dikirim_ke_keuangan" || status === "diproses_keuangan") return "secondary";
  return "outline";
}

export function FinanceBatchList({ initialBatches }: FinanceBatchListProps) {
  const [pending, startTransition] = useTransition();
  const [batches, setBatches] = useState(initialBatches);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState<BatchStatusFilter>("");

  function handleApplyFilter() {
    startTransition(async () => {
      try {
        const result = await listHonorariumBatches({
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          status: statusFilter || undefined,
          financeOnly: true,
        });
        setBatches(result);
        toast.success("Antrian diperbarui.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Filter tidak valid.");
      }
    });
  }

  return (
    <Card className="rounded-[28px]">
      <CardHeader className="border-b border-border">
        <CardTitle>Antrian Pembayaran Honorarium</CardTitle>
        <CardDescription>
          Batch yang sudah dikirim ke keuangan oleh admin/staff.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="grid gap-3 md:grid-cols-[160px_160px_200px_auto]">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Tanggal Mulai</p>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Tanggal Akhir</p>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Status</p>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as BatchStatusFilter)}>
              <SelectTrigger><SelectValue placeholder="Semua status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Semua status</SelectItem>
                <SelectItem value="dikirim_ke_keuangan">Dikirim ke Keuangan</SelectItem>
                <SelectItem value="diproses_keuangan">Diproses Keuangan</SelectItem>
                <SelectItem value="dibayar">Dibayar</SelectItem>
                <SelectItem value="locked">Locked</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={handleApplyFilter} disabled={pending}>
              <Filter className="h-4 w-4 mr-1" />
              Terapkan
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">No. Dokumen</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Periode</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Sesi</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Net</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Tgl Kirim</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {batches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    Belum ada batch masuk ke antrian keuangan.
                  </td>
                </tr>
              ) : (
                batches.map((batch) => (
                  <tr key={batch.id} className="border-b border-border hover:bg-muted/50">
                    <td className="px-4 py-3 font-medium">{batch.documentNumber}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {batch.periodStart} s.d. {batch.periodEnd}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{batch.itemCount}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">
                      {formatCurrency(batch.netAmount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={statusVariant(batch.status)}>
                        {statusLabel(batch.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {batch.submittedAt
                        ? new Date(batch.submittedAt).toLocaleDateString("id-ID")
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/keuangan/honorarium/${batch.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          Detail
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
