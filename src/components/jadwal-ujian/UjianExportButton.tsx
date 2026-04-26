"use client";

import { useTransition } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getUjianForExport } from "@/server/actions/jadwal-ujian/ujian";
import type { UjianFilter } from "@/lib/validators/jadwalUjian.schema";

interface UjianExportButtonProps {
  filter?: UjianFilter;
}

export function UjianExportButton({ filter }: UjianExportButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleExport() {
    startTransition(async () => {
      try {
        const rows = await getUjianForExport(filter);
        if (rows.length === 0) {
          toast.info("Tidak ada data untuk diekspor.");
          return;
        }

        const XLSX = await import("xlsx");
        const wsData = [
          ["Tanggal", "Jam Mulai", "Jam Selesai", "Mata Pelajaran", "Kelas", "Program", "Tipe", "Mode", "Pengawas", "Catatan"],
          ...rows.map((r) => [
            r.tanggalUjian,
            r.jamMulai,
            r.jamSelesai,
            r.mataPelajaran,
            r.namaKelas,
            r.program,
            r.tipe,
            r.mode,
            r.pengawas,
            r.catatan ?? "",
          ]),
        ];

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        ws["!cols"] = [
          { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 30 },
          { wch: 30 }, { wch: 12 }, { wch: 16 }, { wch: 10 },
          { wch: 40 }, { wch: 30 },
        ];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Jadwal Ujian");

        const tanggal = new Date().toISOString().slice(0, 10);
        XLSX.writeFile(wb, `jadwal-ujian-${tanggal}.xlsx`);
        toast.success(`${rows.length} data berhasil diekspor.`);
      } catch {
        toast.error("Gagal mengekspor data.");
      }
    });
  }

  return (
    <Button variant="outline" onClick={handleExport} disabled={isPending}>
      <Download className="h-4 w-4" />
      {isPending ? "Mengekspor..." : "Export Excel"}
    </Button>
  );
}
