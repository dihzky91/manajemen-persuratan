"use client";

import { useTransition } from "react";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getUjianForExport } from "@/server/actions/jadwal-ujian/ujian";
import type { UjianFilter } from "@/lib/validators/jadwalUjian.schema";

interface UjianExportButtonProps {
  filter?: UjianFilter;
}

function formatTanggal(dateStr: string) {
  return format(parseISO(dateStr), "dd MMM yyyy", { locale: localeId });
}

function formatHari(dateStr: string) {
  return format(parseISO(dateStr), "EEEE", { locale: localeId });
}

async function doExportExcel(filter?: UjianFilter) {
  const rows = await getUjianForExport(filter);
  if (rows.length === 0) {
    toast.info("Tidak ada data untuk diekspor.");
    return;
  }

  const XLSX = await import("xlsx");
  const wsData = [
    ["No", "Hari", "Tanggal", "Waktu", "Mata Pelajaran", "Kelas", "Program", "Tipe", "Mode", "Pengawas", "Catatan"],
    ...rows.map((r, i) => [
      i + 1,
      formatHari(r.tanggalUjian),
      formatTanggal(r.tanggalUjian),
      `${r.jamMulai} – ${r.jamSelesai}`,
      r.mataPelajaran.join(" & "),
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
    { wch: 4 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 28 },
    { wch: 24 }, { wch: 12 }, { wch: 14 }, { wch: 10 }, { wch: 36 }, { wch: 28 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Jadwal Ujian");

  const tanggal = format(new Date(), "yyyyMMdd");
  XLSX.writeFile(wb, `jadwal-ujian-${tanggal}.xlsx`);
  toast.success(`${rows.length} data berhasil diekspor ke Excel.`);
}

async function doExportPDF(filter?: UjianFilter) {
  const rows = await getUjianForExport(filter);
  if (rows.length === 0) {
    toast.info("Tidak ada data untuk diekspor.");
    return;
  }

  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 64, 175);
  doc.text("JADWAL UJIAN", pageWidth / 2, 16, { align: "center" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Dicetak pada: ${format(new Date(), "dd MMMM yyyy, HH:mm", { locale: localeId })}`,
    pageWidth / 2,
    22,
    { align: "center" },
  );

  // Garis bawah header
  doc.setDrawColor(30, 64, 175);
  doc.setLineWidth(0.5);
  doc.line(14, 25, pageWidth - 14, 25);

  // Tabel
  autoTable(doc, {
    startY: 29,
    head: [["No", "Hari", "Tanggal", "Waktu", "Mata Pelajaran", "Kelas", "Program", "Tipe", "Mode", "Pengawas"]],
    body: rows.map((r, i) => [
      i + 1,
      formatHari(r.tanggalUjian),
      formatTanggal(r.tanggalUjian),
      `${r.jamMulai} – ${r.jamSelesai}`,
      r.mataPelajaran.join(" & "),
      r.namaKelas,
      r.program,
      r.tipe,
      r.mode,
      r.pengawas,
    ]),
    styles: { fontSize: 8, cellPadding: 2.5, valign: "middle" },
    headStyles: {
      fillColor: [30, 64, 175],
      textColor: 255,
      fontStyle: "bold",
      halign: "center",
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { halign: "center", cellWidth: 8 },
      1: { cellWidth: 20 },
      2: { cellWidth: 24 },
      3: { halign: "center", cellWidth: 22 },
      4: { cellWidth: 40 },
      5: { cellWidth: 32 },
      6: { cellWidth: 20 },
      7: { cellWidth: 18 },
      8: { cellWidth: 14 },
      9: { cellWidth: "auto" },
    },
    didDrawPage: (data) => {
      const pageCount = doc.getNumberOfPages();
      const currentPage = data.pageNumber;
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Halaman ${currentPage} dari ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 6,
        { align: "center" },
      );
    },
  });

  const tanggal = format(new Date(), "yyyyMMdd");
  doc.save(`jadwal-ujian-${tanggal}.pdf`);
  toast.success(`${rows.length} data berhasil diekspor ke PDF.`);
}

export function UjianExportButton({ filter }: UjianExportButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleExcel() {
    startTransition(async () => {
      try {
        await doExportExcel(filter);
      } catch {
        toast.error("Gagal mengekspor ke Excel.");
      }
    });
  }

  function handlePDF() {
    startTransition(async () => {
      try {
        await doExportPDF(filter);
      } catch {
        toast.error("Gagal mengekspor ke PDF.");
      }
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isPending}>
          <Download className="h-4 w-4" />
          {isPending ? "Mengekspor..." : "Export"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExcel}>
          <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
          Export Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlePDF}>
          <FileText className="mr-2 h-4 w-4 text-red-500" />
          Export PDF (.pdf)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
