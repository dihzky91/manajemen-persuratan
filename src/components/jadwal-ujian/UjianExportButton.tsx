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
import { getUjianForExport, type UjianExportRow } from "@/server/actions/jadwal-ujian/ujian";
import type { UjianFilter } from "@/lib/validators/jadwalUjian.schema";

interface UjianExportButtonProps {
  filter?: UjianFilter;
  includePastExams: boolean;
  today: string;
  systemIdentity: {
    namaSistem: string;
    logoUrl: string | null;
  };
}

function formatTanggal(dateStr: string) {
  return format(parseISO(dateStr), "dd MMM yyyy", { locale: localeId });
}

function formatHari(dateStr: string) {
  return format(parseISO(dateStr), "EEEE", { locale: localeId });
}

function formatWaktu(jamMulai: string, jamSelesai: string) {
  return `${jamMulai} - ${jamSelesai}`;
}

async function loadRows(filter: UjianFilter | undefined, includePastExams: boolean, today: string) {
  const rows = await getUjianForExport(filter);
  return includePastExams ? rows : rows.filter((row) => row.tanggalUjian >= today);
}

function groupRowsByClass(rows: UjianExportRow[]) {
  const sortedRows = [...rows].sort((a, b) => {
    const classCompare = a.namaKelas.localeCompare(b.namaKelas, "id");
    if (classCompare !== 0) return classCompare;

    const dateCompare = a.tanggalUjian.localeCompare(b.tanggalUjian);
    if (dateCompare !== 0) return dateCompare;

    return a.jamMulai.localeCompare(b.jamMulai);
  });

  const groups = new Map<string, UjianExportRow[]>();

  sortedRows.forEach((row) => {
    const existing = groups.get(row.namaKelas);
    if (existing) {
      existing.push(row);
      return;
    }
    groups.set(row.namaKelas, [row]);
  });

  return groups;
}

async function doExportExcel(filter: UjianFilter | undefined, includePastExams: boolean, today: string) {
  const rows = await loadRows(filter, includePastExams, today);
  if (rows.length === 0) {
    toast.info("Tidak ada data untuk diekspor.");
    return;
  }

  const XLSX = await import("xlsx");
  const wsData = [
    ["No", "Hari", "Tanggal", "Waktu", "Mata Pelajaran", "Kelas", "Program", "Tipe", "Mode", "Pengawas", "Admin Jaga", "Catatan"],
    ...rows.map((r, i) => [
      i + 1,
      formatHari(r.tanggalUjian),
      formatTanggal(r.tanggalUjian),
      formatWaktu(r.jamMulai, r.jamSelesai),
      r.mataPelajaran.join(" & "),
      r.namaKelas,
      r.program,
      r.tipe,
      r.mode,
      r.pengawas,
      r.adminJaga,
      r.catatan ?? "",
    ]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws["!cols"] = [
    { wch: 4 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 28 },
    { wch: 24 },
    { wch: 12 },
    { wch: 14 },
    { wch: 10 },
    { wch: 36 },
    { wch: 28 },
    { wch: 28 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Jadwal Ujian");

  const tanggal = format(new Date(), "yyyyMMdd");
  XLSX.writeFile(wb, `jadwal-ujian-${tanggal}.xlsx`);
  toast.success(`${rows.length} data berhasil diekspor ke Excel.`);
}

async function buildLogoDataUrl(logoUrl: string) {
  const response = await fetch(logoUrl);
  if (!response.ok) {
    throw new Error("Logo tidak dapat dimuat.");
  }

  const blob = await response.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Logo tidak dapat dibaca."));
    };
    reader.onerror = () => reject(new Error("Logo tidak dapat dibaca."));
    reader.readAsDataURL(blob);
  });
}

async function buildLogoImage(logoUrl: string) {
  const dataUrl = await buildLogoDataUrl(logoUrl);
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Logo tidak dapat diproses."));
    img.src = dataUrl;
  });

  return { dataUrl, image };
}

async function doExportPDF(
  filter: UjianFilter | undefined,
  includePastExams: boolean,
  today: string,
  systemIdentity: UjianExportButtonProps["systemIdentity"],
) {
  const rows = await loadRows(filter, includePastExams, today);
  if (rows.length === 0) {
    toast.info("Tidak ada data untuk diekspor.");
    return;
  }

  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const groupedRows = groupRowsByClass(rows);
  const printDate = format(new Date(), "dd MMMM yyyy, HH:mm", { locale: localeId });

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 12;
  const headerTop = 10;
  let currentY = headerTop;

  if (systemIdentity.logoUrl) {
    try {
      const { dataUrl, image } = await buildLogoImage(systemIdentity.logoUrl);
      const maxWidth = 34;
      const maxHeight = 28;
      const ratio = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
      const width = image.width * ratio;
      const height = image.height * ratio;
      doc.addImage(dataUrl, "PNG", (pageWidth - width) / 2, currentY, width, height);
      currentY += height + 5;
    } catch {
      // Logo opsional, lanjutkan export tanpa logo jika gagal diproses.
    }
  }

  doc.setFontSize(17);
  doc.setTextColor(29, 78, 216);
  doc.text("JADWAL MENGAWAS UJIAN", pageWidth / 2, currentY, { align: "center" });
  currentY += 7;

  doc.setDrawColor(29, 78, 216);
  doc.setLineWidth(0.5);
  doc.line(marginX, currentY, pageWidth - marginX, currentY);
  currentY += 6;

  const body: Array<Array<string | { content: string; colSpan: number; styles: Record<string, unknown> }>> = [];
  let rowNumber = 1;
  groupedRows.forEach((group, kelasName) => {
    body.push([
      {
        content: kelasName,
        colSpan: 6,
        styles: {
          fillColor: [219, 234, 254],
          textColor: [29, 78, 216],
          fontStyle: "bold",
          halign: "left",
        },
      },
    ]);
    group.forEach((row, index) => {
      body.push([
        String(rowNumber++),
        formatTanggal(row.tanggalUjian),
        formatWaktu(row.jamMulai, row.jamSelesai),
        row.namaKelas,
        row.mataPelajaran.join(" & "),
        row.pengawas || "-",
      ]);
    });
  });

  autoTable(doc, {
    startY: currentY,
    head: [["No", "Tanggal", "Jam", "Kelas", "Mata Ujian", "Pengawas"]],
    body,
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 8.5,
      textColor: [15, 23, 42],
      cellPadding: { top: 2.5, right: 2, bottom: 2.5, left: 2 },
      lineColor: [203, 213, 225],
      lineWidth: 0.1,
      valign: "middle",
    },
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
      valign: "middle",
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 24 },
      2: { cellWidth: 22, halign: "center" },
      3: { cellWidth: 24 },
      4: { cellWidth: 70 },
      5: { cellWidth: "auto" },
    },
    margin: { top: currentY, right: marginX, bottom: 14, left: marginX },
    didDrawPage: (data) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text(printDate, marginX, 7);
      doc.text("Jadwal Mengawas Ujian", pageWidth - marginX, 7, { align: "right" });
      doc.text(`Di cetak dari modul jadwal ujian pada: ${printDate} WIB`, marginX, pageHeight - 6);
      doc.text(
        `Halaman ${data.pageNumber}`,
        pageWidth - marginX,
        pageHeight - 6,
        { align: "right" },
      );
    },
  });

  const finalY = (doc as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? currentY;
  const summaryText = `Total: ${rows.length} jadwal ujian`;
  const summaryBoxHeight = 8;
  const summaryBoxWidth = 34;
  const summaryBoxX = marginX;
  let summaryBoxY = finalY + 4;

  if (summaryBoxY + summaryBoxHeight > pageHeight - 18) {
    doc.addPage();
    summaryBoxY = 18;
  }

  doc.setDrawColor(186, 230, 253);
  doc.setFillColor(239, 246, 255);
  doc.setLineWidth(0.4);
  doc.roundedRect(summaryBoxX, summaryBoxY, summaryBoxWidth, summaryBoxHeight, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text(summaryText, summaryBoxX + 2, summaryBoxY + 5.4);

  const tanggal = format(new Date(), "yyyyMMdd");
  doc.save(`jadwal-ujian-${tanggal}.pdf`);
  toast.success(`${rows.length} data berhasil diekspor ke PDF.`);
}

export function UjianExportButton({
  filter,
  includePastExams,
  today,
  systemIdentity,
}: UjianExportButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleExcel() {
    startTransition(async () => {
      try {
        await doExportExcel(filter, includePastExams, today);
      } catch {
        toast.error("Gagal mengekspor ke Excel.");
      }
    });
  }

  function handlePDF() {
    startTransition(async () => {
      try {
        await doExportPDF(filter, includePastExams, today, systemIdentity);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Gagal mengekspor ke PDF.");
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
