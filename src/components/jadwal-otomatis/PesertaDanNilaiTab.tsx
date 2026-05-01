"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, ClipboardPaste, Download, FileDown, Loader2, Plus, Search, Trash2, Upload, UserRoundX, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  bulkDeletePesertaIfClean,
  bulkImportPeserta,
  bulkMovePesertaToKelas,
  bulkUpdateStatusEnrollment,
  enrollPeserta,
  getPesertaByKelas,
  updateStatusEnrollment,
} from "@/server/actions/jadwal-otomatis/peserta/enrollment";
import { listKelasOtomatis } from "@/server/actions/jadwal-otomatis/kelasOtomatis";
import { inputAbsensiPelatihan, getAbsensiByKelas } from "@/server/actions/jadwal-otomatis/peserta/absensi-pelatihan";
import { getAbsensiUjianByKelas } from "@/server/actions/jadwal-otomatis/peserta/absensi-ujian";
import { inputNilaiUjian, inputNilaiPerbaikan, getNilaiByKelas } from "@/server/actions/jadwal-otomatis/peserta/nilai-ujian";
import { ajukanUjianSusulan } from "@/server/actions/jadwal-otomatis/peserta/ujian-susulan";
import { exportRekapKelas } from "@/server/actions/jadwal-otomatis/peserta/export-rekap";

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface Peserta {
  id: string; nama: string; nomorPeserta: string | null;
  email: string | null; telepon: string | null; catatan: string | null;
  statusEnrollment: string; statusAkhir: string | null;
  alasanStatus: string | null;
}

interface SesiPelatihan {
  id: string; sessionNumber: number | null; scheduledDate: string;
  materiName: string | null; status: string;
}

interface SesiUjian {
  id: string; mataPelajaran: string[] | null; tanggalUjian: string;
  jamMulai: string; jamSelesai: string;
}

interface AbsensiRow {
  pesertaId: string; sessionId: string; hadir: boolean;
}

interface AbsensiUjianRow {
  pesertaId: string; jadwalUjianId: string; status: string;
}

interface NilaiRow {
  id: string; pesertaId: string; jadwalUjianId: string;
  mataPelajaran: string; nilai: string; isPerbaikan: boolean;
  perbaikanDariId: string | null;
}

// â”€â”€â”€ Props â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface PesertaDanNilaiTabProps {
  kelasId: string;
  canManage: boolean;
}

type DuplicateStrategy = "skip" | "update" | "allow";

interface ImportPesertaRow {
  nama: string;
  nomorPeserta?: string;
  email?: string;
  telepon?: string;
  catatan?: string;
}

interface ImportPreviewRow extends ImportPesertaRow {
  rowNumber: number;
  status: "valid" | "update" | "duplicate" | "error";
  issues: string[];
}

interface KelasOption {
  id: string;
  namaKelas: string;
  programName: string;
  status: string;
}

interface DeactivateDialogState {
  pesertaIds: string[];
  title: string;
  description: string;
}

const MONTH_LABELS_ID = [
  "JANUARI",
  "FEBRUARI",
  "MARET",
  "APRIL",
  "MEI",
  "JUNI",
  "JULI",
  "AGUSTUS",
  "SEPTEMBER",
  "OKTOBER",
  "NOVEMBER",
  "DESEMBER",
];

const PESERTA_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

function normalizeImportKey(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function cleanImportCell(value: unknown) {
  return String(value ?? "").trim();
}

function mapImportRecord(record: Record<string, unknown>): ImportPesertaRow {
  const normalizedEntries = Object.entries(record).map(([key, value]) => [
    key.trim().toLowerCase().replace(/\s+/g, "_"),
    value,
  ]);
  const normalized = Object.fromEntries(normalizedEntries);

  return {
    nama: cleanImportCell(normalized.nama ?? normalized.nama_peserta ?? normalized.name),
    nomorPeserta: cleanImportCell(
      normalized.nomor_peserta ?? normalized.no_peserta ?? normalized.nomor ?? normalized.no,
    ),
    email: cleanImportCell(normalized.email),
    telepon: cleanImportCell(normalized.telepon ?? normalized.phone ?? normalized.hp),
    catatan: cleanImportCell(normalized.catatan ?? normalized.keterangan),
  };
}

function parsePastedRows(text: string): ImportPesertaRow[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separator = line.includes("\t") ? "\t" : ",";
      const [nama, nomorPeserta, email, telepon, catatan] = line.split(separator).map((cell) => cell.trim());
      return { nama: nama ?? "", nomorPeserta, email, telepon, catatan };
    });
}

function buildImportPreview(
  rows: ImportPesertaRow[],
  existingPeserta: Peserta[],
  duplicateStrategy: DuplicateStrategy,
): ImportPreviewRow[] {
  const existingByNomor = new Set(
    existingPeserta.map((p) => normalizeImportKey(p.nomorPeserta)).filter(Boolean),
  );
  const existingByNama = new Set(existingPeserta.map((p) => normalizeImportKey(p.nama)).filter(Boolean));
  const seen = new Set<string>();

  return rows.map((row, index) => {
    const nama = row.nama.trim();
    const nomorPeserta = row.nomorPeserta?.trim() || undefined;
    const email = row.email?.trim() || undefined;
    const telepon = row.telepon?.trim() || undefined;
    const catatan = row.catatan?.trim() || undefined;
    const issues: string[] = [];
    const nomorKey = normalizeImportKey(nomorPeserta);
    const namaKey = normalizeImportKey(nama);
    const duplicateKey = nomorKey ? `nomor:${nomorKey}` : `nama:${namaKey}`;

    if (!nama) issues.push("Nama wajib diisi.");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) issues.push("Format email tidak valid.");

    const duplicateInFile = duplicateKey !== "nama:" && seen.has(duplicateKey);
    if (duplicateKey !== "nama:") seen.add(duplicateKey);

    const duplicateInClass = (nomorKey && existingByNomor.has(nomorKey)) || existingByNama.has(namaKey);

    let status: ImportPreviewRow["status"] = "valid";
    if (issues.length > 0) {
      status = "error";
    } else if (duplicateInFile || duplicateInClass) {
      if (duplicateStrategy === "update" && duplicateInClass && !duplicateInFile) {
        status = "update";
      } else if (duplicateStrategy === "allow") {
        status = "valid";
      } else {
        status = "duplicate";
        if (duplicateInFile) issues.push("Duplikat di file/paste.");
        if (duplicateInClass) issues.push("Sudah ada di kelas.");
      }
    }

    return { rowNumber: index + 1, nama, nomorPeserta, email, telepon, catatan, status, issues };
  });
}

function getIsoDateParts(date: string) {
  const [yearText, monthText, dayText] = date.split("-");
  const year = Number.parseInt(yearText ?? "", 10);
  const month = Number.parseInt(monthText ?? "", 10);
  const day = Number.parseInt(dayText ?? "", 10);

  return {
    year,
    month,
    day,
    isValid: Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day),
  };
}

function formatSessionDate(date: string) {
  const { year, month, day, isValid } = getIsoDateParts(date);
  if (!isValid) return date;
  return `${day} ${MONTH_LABELS_ID[month - 1] ?? ""} ${year}`;
}

function buildSessionMonthGroups(sesiList: SesiPelatihan[]) {
  const groups: { key: string; label: string; sessions: SesiPelatihan[] }[] = [];

  for (const sesi of sesiList) {
    const { year, month, isValid } = getIsoDateParts(sesi.scheduledDate);
    const key = isValid ? `${year}-${String(month).padStart(2, "0")}` : sesi.scheduledDate;
    const label = isValid ? `${MONTH_LABELS_ID[month - 1] ?? "BULAN"} ${year}` : sesi.scheduledDate;
    const existing = groups.find((group) => group.key === key);

    if (existing) {
      existing.sessions.push(sesi);
    } else {
      groups.push({ key, label, sessions: [sesi] });
    }
  }

  return groups;
}

// â”€â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function PesertaDanNilaiTab({ kelasId, canManage }: PesertaDanNilaiTabProps) {
  const [isPending, start] = useTransition();
  const [exportPending, startExport] = useTransition();

  // Daftar Peserta state
  const [pesertaList, setPesertaList] = useState<Peserta[]>([]);
  const [newPesertaRows, setNewPesertaRows] = useState<{ nama: string; nomorPeserta?: string }[]>([
    { nama: "", nomorPeserta: "" },
  ]);
  const [showTambah, setShowTambah] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [importRows, setImportRows] = useState<ImportPesertaRow[]>([]);
  const [duplicateStrategy, setDuplicateStrategy] = useState<DuplicateStrategy>("skip");
  const [searchTerm, setSearchTerm] = useState("");
  const [pesertaPage, setPesertaPage] = useState(1);
  const [pesertaPageSize, setPesertaPageSize] = useState(25);
  const [selectedPesertaIds, setSelectedPesertaIds] = useState<string[]>([]);
  const [kelasOptions, setKelasOptions] = useState<KelasOption[]>([]);
  const [moveTargetKelasId, setMoveTargetKelasId] = useState("");
  const [deactivateDialog, setDeactivateDialog] = useState<DeactivateDialogState | null>(null);

  // Absensi Pelatihan state
  const [absensiData, setAbsensiData] = useState<{
    pesertaList: Peserta[]; sesiList: SesiPelatihan[]; absensiList: AbsensiRow[];
  } | null>(null);
  const [quickAbsensiScope, setQuickAbsensiScope] = useState<"all" | "session" | "peserta">("session");
  const [quickAbsensiSessionId, setQuickAbsensiSessionId] = useState("");
  const [quickAbsensiPesertaId, setQuickAbsensiPesertaId] = useState("");
  const [quickAbsensiStatus, setQuickAbsensiStatus] = useState<"hadir" | "tidak_hadir">("hadir");

  // Absensi & Nilai Ujian state
  const [nilaiData, setNilaiData] = useState<{
    pesertaList: Peserta[]; ujianList: SesiUjian[]; nilaiList: NilaiRow[];
  } | null>(null);
  const [absensiUjianData, setAbsensiUjianData] = useState<{
    pesertaList: Peserta[]; ujianList: SesiUjian[]; absensiList: AbsensiUjianRow[];
  } | null>(null);

  // Inline form states
  const [perbaikanEdit, setPerbaikanEdit] = useState<{
    pesertaId: string; jadwalUjianId: string; mapel: string; perbaikanDariId: string; nilai: "A" | "B" | "C";
  } | null>(null);
  const [susulanEdit, setSusulanEdit] = useState<{
    pesertaId: string; jadwalUjianId: string; tanggal: string;
  } | null>(null);

  // â”€â”€â”€ Handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const loadPeserta = useCallback(() => {
    start(async () => {
      const data = await getPesertaByKelas(kelasId);
      setPesertaList(data as unknown as Peserta[]);
      setSelectedPesertaIds([]);
    });
  }, [kelasId]);

  useEffect(() => {
    loadPeserta();
  }, [loadPeserta]);

  useEffect(() => {
    if (!canManage) return;
    start(async () => {
      const rows = await listKelasOtomatis();
      setKelasOptions(rows
        .filter((row) => row.id !== kelasId && row.status === "active")
        .map((row) => ({
          id: row.id,
          namaKelas: row.namaKelas,
          programName: row.programName,
          status: row.status,
        })));
    });
  }, [canManage, kelasId]);

  const handleEnroll = useCallback(() => {
    const valid = newPesertaRows.filter((r) => r.nama.trim());
    if (valid.length === 0) { toast.error("Isi minimal satu nama peserta."); return; }
    start(async () => {
      const result = await enrollPeserta(kelasId, valid);
      if (result.ok) {
        toast.success(`${result.data.length} peserta ditambahkan.`);
        setNewPesertaRows([{ nama: "", nomorPeserta: "" }]);
        setShowTambah(false);
        loadPeserta();
      } else {
        toast.error(result.error);
      }
    });
  }, [kelasId, newPesertaRows, loadPeserta]);

  const openDeactivatePesertaDialog = useCallback((peserta: Peserta) => {
    setDeactivateDialog({
      pesertaIds: [peserta.id],
      title: "Nonaktifkan peserta?",
      description: `Peserta "${peserta.nama}" akan dinonaktifkan dari kelas ini. Data historis seperti absensi dan nilai tetap disimpan.`,
    });
  }, []);

  const confirmDeactivatePeserta = useCallback(() => {
    if (!deactivateDialog) return;

    start(async () => {
      const result = deactivateDialog.pesertaIds.length === 1
        ? await updateStatusEnrollment(deactivateDialog.pesertaIds[0]!, "mengundurkan_diri")
        : await bulkUpdateStatusEnrollment(deactivateDialog.pesertaIds, "mengundurkan_diri");
      if (result.ok) {
        toast.success(
          deactivateDialog.pesertaIds.length === 1
            ? "Peserta dinonaktifkan."
            : `${deactivateDialog.pesertaIds.length} peserta dinonaktifkan.`,
        );
        setDeactivateDialog(null);
        loadPeserta();
      } else {
        toast.error(result.error);
      }
    });
  }, [deactivateDialog, loadPeserta]);

  const handleDownloadPesertaTemplate = useCallback(() => {
    startExport(async () => {
      const XLSX = await import("xlsx");
      const rows = [
        { nama: "Contoh Peserta", nomor_peserta: "AB-001", email: "peserta@example.com", telepon: "08123456789", catatan: "" },
      ];
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, "Template Peserta");
      XLSX.writeFile(wb, "template-import-peserta.xlsx");
    });
  }, [startExport]);

  const handlePesertaFileImport = useCallback((file: File | null) => {
    if (!file) return;
    start(async () => {
      try {
        const XLSX = await import("xlsx");
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer, { type: "array" });
        const firstSheet = wb.SheetNames[0];
        if (!firstSheet) {
          toast.error("File tidak memiliki sheet.");
          return;
        }

        const records = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[firstSheet]!, {
          defval: "",
        });
        const rows = records.map(mapImportRecord).filter((row) =>
          [row.nama, row.nomorPeserta, row.email, row.telepon, row.catatan].some(Boolean),
        );
        setImportRows(rows);
        setShowImport(true);
        toast.success(`${rows.length} baris dimuat untuk preview.`);
      } catch {
        toast.error("Gagal membaca file import.");
      }
    });
  }, []);

  const handlePastePreview = useCallback(() => {
    const rows = parsePastedRows(pasteText);
    setImportRows(rows);
    setShowImport(true);
    toast.success(`${rows.length} baris paste dimuat untuk preview.`);
  }, [pasteText]);

  const handleBulkImportPeserta = useCallback(() => {
    const rowsToImport = buildImportPreview(importRows, pesertaList, duplicateStrategy)
      .filter((row) => row.status === "valid" || row.status === "update")
      .map(({ rowNumber, status, issues, ...row }) => row);

    if (rowsToImport.length === 0) {
      toast.error("Tidak ada baris valid untuk diimport.");
      return;
    }

    start(async () => {
      const result = await bulkImportPeserta(kelasId, rowsToImport, duplicateStrategy);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      const { inserted, updated, skipped } = result.data;
      toast.success(`${inserted.length} ditambahkan, ${updated.length} diperbarui, ${skipped.length} dilewati.`);
      setImportRows([]);
      setPasteText("");
      setShowImport(false);
      loadPeserta();
    });
  }, [duplicateStrategy, importRows, kelasId, loadPeserta, pesertaList]);

  const handleBulkDeactivatePeserta = useCallback(() => {
    if (selectedPesertaIds.length === 0) {
      toast.error("Pilih peserta terlebih dahulu.");
      return;
    }

    setDeactivateDialog({
      pesertaIds: selectedPesertaIds,
      title: "Nonaktifkan peserta terpilih?",
      description: `${selectedPesertaIds.length} peserta akan dinonaktifkan dari kelas ini. Data historis seperti absensi dan nilai tetap disimpan.`,
    });
  }, [selectedPesertaIds]);

  const handleBulkMovePeserta = useCallback(() => {
    if (selectedPesertaIds.length === 0) {
      toast.error("Pilih peserta terlebih dahulu.");
      return;
    }
    if (!moveTargetKelasId) {
      toast.error("Pilih kelas tujuan.");
      return;
    }

    start(async () => {
      const result = await bulkMovePesertaToKelas(selectedPesertaIds, moveTargetKelasId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(`${result.data.length} peserta dipindahkan.`);
      setSelectedPesertaIds([]);
      setMoveTargetKelasId("");
      loadPeserta();
    });
  }, [loadPeserta, moveTargetKelasId, selectedPesertaIds]);

  const handleBulkDeleteCleanPeserta = useCallback(() => {
    if (selectedPesertaIds.length === 0) {
      toast.error("Pilih peserta terlebih dahulu.");
      return;
    }
    if (!window.confirm("Hapus permanen peserta terpilih yang belum punya absensi/nilai?")) {
      return;
    }

    start(async () => {
      const result = await bulkDeletePesertaIfClean(selectedPesertaIds);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(`${result.data.length} peserta dihapus.`);
      setSelectedPesertaIds([]);
      loadPeserta();
    });
  }, [loadPeserta, selectedPesertaIds]);

  const handleExportPeserta = useCallback(() => {
    startExport(async () => {
      const term = searchTerm.trim().toLowerCase();
      const rowsFromFilter = term
        ? pesertaList.filter((p) =>
            [p.nama, p.nomorPeserta, p.email, p.telepon, p.catatan]
              .some((value) => value?.toLowerCase().includes(term)),
          )
        : pesertaList;
      const rowsToExport = selectedPesertaIds.length > 0
        ? pesertaList.filter((p) => selectedPesertaIds.includes(p.id))
        : rowsFromFilter;
      if (rowsToExport.length === 0) {
        toast.info("Tidak ada data peserta untuk diexport.");
        return;
      }

      const XLSX = await import("xlsx");
      const rows = rowsToExport.map((p, index) => ({
        No: index + 1,
        Nama: p.nama,
        "No Peserta": p.nomorPeserta ?? "",
        Email: p.email ?? "",
        Telepon: p.telepon ?? "",
        Catatan: p.catatan ?? "",
        Status: p.statusEnrollment,
      }));
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, "Peserta");
      XLSX.writeFile(wb, `peserta-kelas-${kelasId.slice(0, 8)}.xlsx`);
    });
  }, [kelasId, pesertaList, searchTerm, selectedPesertaIds, startExport]);

  const togglePesertaSelection = useCallback((pesertaId: string, checked: boolean) => {
    setSelectedPesertaIds((current) =>
      checked ? [...new Set([...current, pesertaId])] : current.filter((id) => id !== pesertaId),
    );
  }, []);

  const toggleCurrentPageSelection = useCallback((checked: boolean) => {
    const term = searchTerm.trim().toLowerCase();
    const filtered = term
      ? pesertaList.filter((p) =>
          [p.nama, p.nomorPeserta, p.email, p.telepon, p.catatan]
            .some((value) => value?.toLowerCase().includes(term)),
        )
      : pesertaList;
    const startIndex = (pesertaPage - 1) * pesertaPageSize;
    const pageIds = filtered.slice(startIndex, startIndex + pesertaPageSize).map((p) => p.id);
    setSelectedPesertaIds((current) =>
      checked
        ? [...new Set([...current, ...pageIds])]
        : current.filter((id) => !pageIds.includes(id)),
    );
  }, [pesertaList, pesertaPage, pesertaPageSize, searchTerm]);

  const loadAbsensiPelatihan = useCallback(() => {
    start(async () => {
      const data = await getAbsensiByKelas(kelasId);
      setAbsensiData(data as unknown as typeof absensiData);
    });
  }, [kelasId]);

  const handleAbsensiToggle = useCallback(
    (pesertaId: string, sessionId: string, currentHadir: boolean | undefined) => {
      if (!canManage) return;
      const newHadir = !currentHadir;
      start(async () => {
        const result = await inputAbsensiPelatihan(
          sessionId,
          [{ pesertaId, hadir: newHadir }],
        );
        if (result.ok) {
          loadAbsensiPelatihan();
          toast.success("Absensi disimpan.");
        } else {
          toast.error(result.error);
        }
      });
    },
    [canManage, loadAbsensiPelatihan]
  );

  const handleBulkAbsensiBySession = useCallback(
    (sessionId: string, hadir: boolean) => {
      if (!canManage || !absensiData) return;
      if (absensiData.pesertaList.length === 0) {
        toast.info("Belum ada peserta untuk diubah.");
        return;
      }

      start(async () => {
        const result = await inputAbsensiPelatihan(
          sessionId,
          absensiData.pesertaList.map((p) => ({ pesertaId: p.id, hadir })),
        );
        if (result.ok) {
          loadAbsensiPelatihan();
          toast.success(`Sesi diisi ${hadir ? "hadir" : "tidak hadir"} untuk semua peserta.`);
        } else {
          toast.error(result.error);
        }
      });
    },
    [absensiData, canManage, loadAbsensiPelatihan],
  );

  const handleBulkAbsensiByPeserta = useCallback(
    (pesertaId: string, hadir: boolean) => {
      if (!canManage || !absensiData) return;
      if (absensiData.sesiList.length === 0) {
        toast.info("Belum ada sesi untuk diubah.");
        return;
      }

      start(async () => {
        const results = await Promise.all(
          absensiData.sesiList.map((s) =>
            inputAbsensiPelatihan(s.id, [{ pesertaId, hadir }]),
          ),
        );
        const failed = results.find((result) => !result.ok);
        if (failed && !failed.ok) {
          toast.error(failed.error);
          return;
        }

        loadAbsensiPelatihan();
        toast.success(`Peserta diisi ${hadir ? "hadir" : "tidak hadir"} untuk semua sesi.`);
      });
    },
    [absensiData, canManage, loadAbsensiPelatihan],
  );

  const handleBulkAbsensiAll = useCallback(
    (hadir: boolean) => {
      if (!canManage || !absensiData) return;
      if (absensiData.sesiList.length === 0 || absensiData.pesertaList.length === 0) {
        toast.info("Belum ada sesi atau peserta untuk diubah.");
        return;
      }

      start(async () => {
        const rows = absensiData.pesertaList.map((p) => ({ pesertaId: p.id, hadir }));
        const results = await Promise.all(
          absensiData.sesiList.map((s) => inputAbsensiPelatihan(s.id, rows)),
        );
        const failed = results.find((result) => !result.ok);
        if (failed && !failed.ok) {
          toast.error(failed.error);
          return;
        }

        loadAbsensiPelatihan();
        toast.success(`Semua absensi diisi ${hadir ? "hadir" : "tidak hadir"}.`);
      });
    },
    [absensiData, canManage, loadAbsensiPelatihan],
  );

  const handleApplyQuickAbsensi = useCallback(() => {
    if (!absensiData) return;

    const hadir = quickAbsensiStatus === "hadir";
    if (quickAbsensiScope === "all") {
      if (!window.confirm("Isi semua peserta dan semua sesi dengan status yang dipilih?")) {
        return;
      }
      handleBulkAbsensiAll(hadir);
      return;
    }

    if (quickAbsensiScope === "session") {
      const sessionId = quickAbsensiSessionId || absensiData.sesiList[0]?.id;
      if (!sessionId) {
        toast.error("Pilih sesi terlebih dahulu.");
        return;
      }
      handleBulkAbsensiBySession(sessionId, hadir);
      return;
    }

    const pesertaId = quickAbsensiPesertaId || absensiData.pesertaList[0]?.id;
    if (!pesertaId) {
      toast.error("Pilih peserta terlebih dahulu.");
      return;
    }
    handleBulkAbsensiByPeserta(pesertaId, hadir);
  }, [
    absensiData,
    handleBulkAbsensiAll,
    handleBulkAbsensiByPeserta,
    handleBulkAbsensiBySession,
    quickAbsensiPesertaId,
    quickAbsensiScope,
    quickAbsensiSessionId,
    quickAbsensiStatus,
  ]);

  const loadNilaiUjian = useCallback(() => {
    start(async () => {
      const [nData, aData] = await Promise.all([
        getNilaiByKelas(kelasId),
        getAbsensiUjianByKelas(kelasId),
      ]);
      setNilaiData(nData as unknown as typeof nilaiData);
      setAbsensiUjianData(aData as unknown as typeof absensiUjianData);
    });
  }, [kelasId]);

  const handleNilaiChange = useCallback(
    (pesertaId: string, jadwalUjianId: string, mapel: string, nilai: string) => {
      if (!canManage || nilai === "-") return;
      start(async () => {
        const result = await inputNilaiUjian(
          jadwalUjianId,
          [{ pesertaId, mataPelajaran: mapel, nilai: nilai as "A" | "B" | "C" | "D" }],
        );
        if (result.ok) {
          loadNilaiUjian();
          toast.success("Nilai disimpan.");
        }
      });
    },
    [canManage, loadNilaiUjian]
  );

  const handlePerbaikan = useCallback(() => {
    if (!perbaikanEdit) return;
    start(async () => {
      const r = await inputNilaiPerbaikan(
        perbaikanEdit.pesertaId,
        perbaikanEdit.jadwalUjianId,
        perbaikanEdit.mapel,
        perbaikanEdit.nilai,
        perbaikanEdit.perbaikanDariId,
      );
      if (r.ok) {
        toast.success("Nilai perbaikan disimpan.");
        setPerbaikanEdit(null);
        loadNilaiUjian();
      } else {
        toast.error("Gagal simpan nilai perbaikan.");
      }
    });
  }, [perbaikanEdit, loadNilaiUjian]);

  const handleSusulan = useCallback(() => {
    if (!susulanEdit) return;
    if (!susulanEdit.tanggal) { toast.error("Pilih tanggal susulan."); return; }
    start(async () => {
      const r = await ajukanUjianSusulan({
        pesertaId: susulanEdit.pesertaId,
        jadwalUjianOriginalId: susulanEdit.jadwalUjianId,
        tanggalUsulan: susulanEdit.tanggal,
      });
      if (r.ok) {
        toast.success("Permohonan susulan diajukan.");
        setSusulanEdit(null);
        loadNilaiUjian();
      } else {
        toast.error(r.error ?? "Gagal mengajukan susulan.");
      }
    });
  }, [susulanEdit, loadNilaiUjian]);

  const handleExportRekap = useCallback(() => {
    startExport(async () => {
      const result = await exportRekapKelas(kelasId);
      if (!result.ok) { toast.error(result.error); return; }
      const data = result.data;
      if (data.length === 0) { toast.info("Belum ada data untuk diekspor."); return; }
      try {
        const XLSX = await import("xlsx");
        const rows = data.map((r, i) => ({
          No: i + 1,
          Nama: r.nama,
          "No Peserta": r.nomorPeserta ?? "",
          "% Hadir": `${r.persentaseHadir}%`,
          ...Object.fromEntries(r.nilaiPerMapel.map((n) => [n.mapel, n.nilai])),
          Status: r.statusAkhir === "lulus" ? "Lulus" : r.statusAkhir === "telah_mengikuti" ? "Telah Mengikuti" : "Dalam Proses",
          Keterangan: r.alasanStatus === "kehadiran" ? "Kehadiran < 60%" : r.alasanStatus === "nilai" ? "Nilai D" : "",
        }));
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, "Rekap");
        XLSX.writeFile(wb, `rekap-kelas-${kelasId.slice(0, 8)}.xlsx`);
        toast.success("Rekap berhasil diexport.");
      } catch {
        toast.error("Gagal mengexport Excel.");
      }
    });
  }, [kelasId]);

  // Rekap summary
  const rekapSummary = useMemo(() => {
    const total = pesertaList.length;
    const lulus = pesertaList.filter((p) => p.statusAkhir === "lulus").length;
    const tm = pesertaList.filter((p) => p.statusAkhir === "telah_mengikuti");
    return { total, lulus, telahMengikuti: tm.length, belumFinal: total - lulus - tm.length, tm };
  }, [pesertaList]);

  const absensiMonthGroups = useMemo(
    () => buildSessionMonthGroups(absensiData?.sesiList ?? []),
    [absensiData?.sesiList],
  );

  const importPreview = useMemo(
    () => buildImportPreview(importRows, pesertaList, duplicateStrategy),
    [duplicateStrategy, importRows, pesertaList],
  );
  const importSummary = useMemo(() => ({
    total: importPreview.length,
    valid: importPreview.filter((row) => row.status === "valid").length,
    update: importPreview.filter((row) => row.status === "update").length,
    duplicate: importPreview.filter((row) => row.status === "duplicate").length,
    error: importPreview.filter((row) => row.status === "error").length,
  }), [importPreview]);
  const importableRows = useMemo(
    () => importPreview
      .filter((row) => row.status === "valid" || row.status === "update")
      .map(({ rowNumber, status, issues, ...row }) => row),
    [importPreview],
  );

  const filteredPesertaList = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return pesertaList;
    return pesertaList.filter((p) =>
      [p.nama, p.nomorPeserta, p.email, p.telepon, p.catatan]
        .some((value) => value?.toLowerCase().includes(term)),
    );
  }, [pesertaList, searchTerm]);
  const pesertaTotalPages = Math.max(1, Math.ceil(filteredPesertaList.length / pesertaPageSize));
  const paginatedPesertaList = useMemo(() => {
    const safePage = Math.min(pesertaPage, pesertaTotalPages);
    const startIndex = (safePage - 1) * pesertaPageSize;
    return filteredPesertaList.slice(startIndex, startIndex + pesertaPageSize);
  }, [filteredPesertaList, pesertaPage, pesertaPageSize, pesertaTotalPages]);
  const selectedOnPage = paginatedPesertaList.filter((p) => selectedPesertaIds.includes(p.id));
  const allOnPageSelected = paginatedPesertaList.length > 0 && selectedOnPage.length === paginatedPesertaList.length;

  useEffect(() => {
    setPesertaPage(1);
  }, [searchTerm, pesertaPageSize]);

  useEffect(() => {
    if (pesertaPage > pesertaTotalPages) {
      setPesertaPage(pesertaTotalPages);
    }
  }, [pesertaPage, pesertaTotalPages]);

  return (
    <>
    <Tabs defaultValue="daftar-peserta" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="daftar-peserta">Daftar Peserta</TabsTrigger>
        <TabsTrigger value="absensi-pelatihan" onClick={loadAbsensiPelatihan}>Absensi Pelatihan</TabsTrigger>
        <TabsTrigger value="nilai-ujian" onClick={loadNilaiUjian}>Absensi &amp; Nilai Ujian</TabsTrigger>
        <TabsTrigger value="rekap" onClick={loadPeserta}>Status &amp; Rekap</TabsTrigger>
      </TabsList>

      {/* â”€â”€ Sub-tab: Daftar Peserta â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <TabsContent value="daftar-peserta">
        <Card>
          <CardHeader className="border-b flex-row flex-wrap items-center justify-between gap-2">
            <CardTitle>Peserta Kelas</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleDownloadPesertaTemplate} disabled={exportPending}>
                <FileDown className="h-4 w-4" /> Template
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportPeserta} disabled={exportPending}>
                <Download className="h-4 w-4" />
                {selectedPesertaIds.length > 0 ? `Export (${selectedPesertaIds.length})` : "Export"}
              </Button>
              {canManage && (
                <>
                  <Button variant="outline" size="sm" asChild>
                    <label>
                      <Upload className="h-4 w-4" /> Import
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        className="hidden"
                        onChange={(event) => {
                          handlePesertaFileImport(event.target.files?.[0] ?? null);
                          event.currentTarget.value = "";
                        }}
                      />
                    </label>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowImport(!showImport)}>
                    <ClipboardPaste className="h-4 w-4" /> Paste
                  </Button>
                  <Button size="sm" onClick={() => setShowTambah(!showTambah)}>
                    <Plus className="h-4 w-4" /> Tambah
                  </Button>
                </>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {showTambah && canManage && (
              <div className="p-4 border-b space-y-2">
                {newPesertaRows.map((row, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      className="flex-1 border rounded px-2 py-1 text-sm"
                      placeholder="Nama peserta"
                      value={row.nama}
                      onChange={(e) => {
                        const copy = [...newPesertaRows];
                        const r = copy[i]!;
                        copy[i] = { nama: e.target.value, nomorPeserta: r.nomorPeserta };
                        setNewPesertaRows(copy);
                      }}
                    />
                    <input
                      className="w-40 border rounded px-2 py-1 text-sm"
                      placeholder="No Peserta (opsional)"
                      value={row.nomorPeserta ?? ""}
                      onChange={(e) => {
                        const copy = [...newPesertaRows];
                        const r = copy[i]!;
                        copy[i] = { nama: r.nama, nomorPeserta: e.target.value };
                        setNewPesertaRows(copy);
                      }}
                    />
                    {newPesertaRows.length > 1 && (
                      <Button variant="ghost" size="icon-sm" onClick={() => setNewPesertaRows(newPesertaRows.filter((_, j) => j !== i))}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setNewPesertaRows([...newPesertaRows, { nama: "", nomorPeserta: "" }])}>
                    <Plus className="h-3 w-3 mr-1" /> Baris
                  </Button>
                  <Button size="sm" onClick={handleEnroll} disabled={isPending}>
                    {isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                    Simpan
                  </Button>
                </div>
              </div>
            )}
            {showImport && canManage && (
              <div className="space-y-4 border-b p-4">
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
                  <textarea
                    className="min-h-28 rounded-md border bg-background px-3 py-2 text-sm"
                    placeholder="Paste dari Excel: nama, nomor peserta, email, telepon, catatan"
                    value={pasteText}
                    onChange={(event) => setPasteText(event.target.value)}
                  />
                  <div className="space-y-2">
                    <Select value={duplicateStrategy} onValueChange={(value) => setDuplicateStrategy(value as DuplicateStrategy)}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="skip">Skip duplikat</SelectItem>
                        <SelectItem value="update">Update data lama</SelectItem>
                        <SelectItem value="allow">Tetap import</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" className="w-full" onClick={handlePastePreview}>
                      <ClipboardPaste className="h-4 w-4" /> Preview Paste
                    </Button>
                    <Button size="sm" className="w-full" onClick={handleBulkImportPeserta} disabled={isPending || importableRows.length === 0}>
                      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      Import Valid
                    </Button>
                  </div>
                </div>
                {importPreview.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Badge variant="secondary">Total {importSummary.total}</Badge>
                      <Badge variant="default" className="bg-green-600">Valid {importSummary.valid}</Badge>
                      <Badge variant="secondary">Update {importSummary.update}</Badge>
                      <Badge variant="outline">Duplikat {importSummary.duplicate}</Badge>
                      <Badge variant="destructive">Error {importSummary.error}</Badge>
                    </div>
                    <div className="max-h-72 overflow-auto rounded-md border">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/40">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Baris</th>
                            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Nama</th>
                            <th className="px-3 py-2 text-left font-medium text-muted-foreground">No Peserta</th>
                            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Kontak</th>
                            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importPreview.slice(0, 100).map((row) => (
                            <tr key={`${row.rowNumber}-${row.nama}`} className="border-t">
                              <td className="px-3 py-2 text-muted-foreground tabular-nums">{row.rowNumber}</td>
                              <td className="px-3 py-2 font-medium">{row.nama || "-"}</td>
                              <td className="px-3 py-2 text-muted-foreground">{row.nomorPeserta || "-"}</td>
                              <td className="px-3 py-2 text-muted-foreground">
                                {[row.email, row.telepon].filter(Boolean).join(" / ") || "-"}
                              </td>
                              <td className="px-3 py-2">
                                <Badge
                                  variant={row.status === "error" ? "destructive" : row.status === "duplicate" ? "outline" : "secondary"}
                                  className={row.status === "valid" ? "bg-green-100 text-green-700 hover:bg-green-100" : ""}
                                >
                                  {row.status === "valid" ? "Valid" : row.status === "update" ? "Update" : row.status === "duplicate" ? "Skip" : "Error"}
                                </Badge>
                                {row.issues.length > 0 && (
                                  <span className="ml-2 text-xs text-muted-foreground">{row.issues.join(" ")}</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
              <div className="relative min-w-64 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Cari nama, nomor, email, telepon, atau catatan"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {canManage && selectedPesertaIds.length > 0 && (
                  <>
                    <Select value={moveTargetKelasId} onValueChange={setMoveTargetKelasId}>
                      <SelectTrigger className="h-8 w-56">
                        <SelectValue placeholder="Kelas tujuan" />
                      </SelectTrigger>
                      <SelectContent>
                        {kelasOptions.map((kelas) => (
                          <SelectItem key={kelas.id} value={kelas.id}>
                            {kelas.namaKelas} - {kelas.programName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={handleBulkMovePeserta} disabled={isPending || !moveTargetKelasId}>
                      Pindah ({selectedPesertaIds.length})
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleBulkDeactivatePeserta} disabled={isPending}>
                      <UserRoundX className="h-4 w-4" /> Nonaktifkan
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleBulkDeleteCleanPeserta} disabled={isPending}>
                      <Trash2 className="h-4 w-4" /> Hapus bersih
                    </Button>
                  </>
                )}
                <Select value={String(pesertaPageSize)} onValueChange={(value) => setPesertaPageSize(Number(value))}>
                  <SelectTrigger className="h-8 w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PESERTA_PAGE_SIZE_OPTIONS.map((size) => (
                      <SelectItem key={size} value={String(size)}>{size} / page</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  {canManage && (
                    <th className="w-10 px-4 py-2">
                      <Checkbox
                        checked={allOnPageSelected}
                        onCheckedChange={(checked) => toggleCurrentPageSelection(checked === true)}
                        aria-label="Pilih semua peserta di halaman ini"
                      />
                    </th>
                  )}
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">No</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Nama Peserta</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">No Peserta</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Kontak</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Status Akhir</th>
                  {canManage && <th className="text-left px-4 py-2 font-medium text-muted-foreground">Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {filteredPesertaList.length === 0 ? (
                  <tr>
                    <td colSpan={canManage ? 7 : 5} className="px-4 py-8 text-center text-muted-foreground">
                      {isPending ? "Memuat..." : searchTerm ? "Tidak ada peserta yang cocok." : `Belum ada peserta.${canManage ? " Klik Tambah atau Import untuk menambahkan." : ""}`}
                    </td>
                  </tr>
                ) : (
                  paginatedPesertaList.map((p, i) => (
                    <tr key={p.id} className="border-b hover:bg-muted/50">
                      {canManage && (
                        <td className="px-4 py-2">
                          <Checkbox
                            checked={selectedPesertaIds.includes(p.id)}
                            onCheckedChange={(checked) => togglePesertaSelection(p.id, checked === true)}
                            aria-label={`Pilih ${p.nama}`}
                          />
                        </td>
                      )}
                      <td className="px-4 py-2 text-muted-foreground tabular-nums">{(pesertaPage - 1) * pesertaPageSize + i + 1}</td>
                      <td className="px-4 py-2 font-medium">{p.nama}</td>
                      <td className="px-4 py-2 text-muted-foreground">{p.nomorPeserta ?? "-"}</td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {[p.email, p.telepon].filter(Boolean).join(" / ") || "-"}
                      </td>
                      <td className="px-4 py-2">
                        <StatusBadge status={p.statusAkhir} alasan={p.alasanStatus} />
                      </td>
                      {canManage && (
                        <td className="px-4 py-2">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => openDeactivatePesertaDialog(p)}
                            disabled={isPending}
                            title="Nonaktifkan peserta"
                          >
                            <UserRoundX className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm text-muted-foreground">
              <span>
                Menampilkan {paginatedPesertaList.length} dari {filteredPesertaList.length} peserta
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPesertaPage((page) => Math.max(1, page - 1))}
                  disabled={pesertaPage <= 1}
                >
                  Sebelumnya
                </Button>
                <span className="tabular-nums">Halaman {pesertaPage} / {pesertaTotalPages}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPesertaPage((page) => Math.min(pesertaTotalPages, page + 1))}
                  disabled={pesertaPage >= pesertaTotalPages}
                >
                  Berikutnya
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* â”€â”€ Sub-tab: Absensi Pelatihan â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <TabsContent value="absensi-pelatihan">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Absensi Pelatihan</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!absensiData ? (
              <div className="p-4 text-center text-muted-foreground">
                {isPending ? "Memuat..." : "Klik tab untuk memuat data."}
              </div>
            ) : absensiData.sesiList.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                Belum ada jadwal sesi pelatihan.
              </div>
            ) : (
              <>
              {canManage && absensiData.pesertaList.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 border-b bg-muted/20 p-3">
                  <span className="text-sm font-medium">Isi Cepat</span>
                  <Select value={quickAbsensiScope} onValueChange={(value) => setQuickAbsensiScope(value as typeof quickAbsensiScope)}>
                    <SelectTrigger className="h-8 w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="session">Per sesi</SelectItem>
                      <SelectItem value="peserta">Per peserta</SelectItem>
                      <SelectItem value="all">Semua data</SelectItem>
                    </SelectContent>
                  </Select>
                  {quickAbsensiScope === "session" && (
                    <Select
                      value={quickAbsensiSessionId || absensiData.sesiList[0]?.id}
                      onValueChange={setQuickAbsensiSessionId}
                    >
                      <SelectTrigger className="h-8 w-56">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {absensiData.sesiList.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {formatSessionDate(s.scheduledDate)}{s.sessionNumber ? ` - Sesi ${s.sessionNumber}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {quickAbsensiScope === "peserta" && (
                    <Select
                      value={quickAbsensiPesertaId || absensiData.pesertaList[0]?.id}
                      onValueChange={setQuickAbsensiPesertaId}
                    >
                      <SelectTrigger className="h-8 w-56">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {absensiData.pesertaList.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.nama}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <Select value={quickAbsensiStatus} onValueChange={(value) => setQuickAbsensiStatus(value as typeof quickAbsensiStatus)}>
                    <SelectTrigger className="h-8 w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hadir">Hadir</SelectItem>
                      <SelectItem value="tidak_hadir">Tidak hadir</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" onClick={handleApplyQuickAbsensi} disabled={isPending}>
                    {quickAbsensiStatus === "hadir" ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    Terapkan
                  </Button>
                </div>
              )}
              <div className="overflow-x-auto">
              <table className="w-max min-w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b">
                    <th
                      rowSpan={2}
                      className="sticky left-0 z-20 min-w-48 bg-background px-3 py-2 text-left align-middle font-medium text-muted-foreground"
                    >
                      Nama Peserta
                    </th>
                    {absensiMonthGroups.map((group) => (
                      <th
                        key={group.key}
                        colSpan={group.sessions.length}
                        className="border-l bg-muted/30 px-2 py-2 text-center text-xs font-semibold text-foreground"
                      >
                        {group.label}
                      </th>
                    ))}
                    <th
                      rowSpan={2}
                      className="sticky right-0 z-20 min-w-24 bg-background px-3 py-2 text-center align-middle font-medium text-muted-foreground"
                    >
                      Kehadiran
                    </th>
                  </tr>
                  <tr className="border-b bg-muted/20">
                    {absensiMonthGroups.flatMap((group) =>
                      group.sessions.map((s) => {
                        const { day, isValid } = getIsoDateParts(s.scheduledDate);
                        const title = [
                          s.sessionNumber ? `Sesi ${s.sessionNumber}` : "Sesi",
                          formatSessionDate(s.scheduledDate),
                          s.materiName,
                        ].filter(Boolean).join(" - ");

                        return (
                          <th
                            key={s.id}
                            title={title}
                            className="min-w-10 border-l px-2 py-2 text-center text-xs font-semibold text-foreground"
                          >
                            {isValid ? day : s.scheduledDate}
                          </th>
                        );
                      })
                    )}
                  </tr>
                </thead>
                <tbody>
                  {absensiData.pesertaList.length === 0 ? (
                    <tr>
                      <td
                        colSpan={absensiData.sesiList.length + 2}
                        className="px-4 py-8 text-center text-muted-foreground"
                      >
                        Belum ada peserta aktif.
                      </td>
                    </tr>
                  ) : (
                    absensiData.pesertaList.map((p) => {
                      const hadirCount = absensiData.sesiList.filter((s) => {
                        const a = absensiData.absensiList.find(
                          (a) => a.pesertaId === p.id && a.sessionId === s.id
                        );
                        return a?.hadir;
                      }).length;
                      const pct = absensiData.sesiList.length > 0
                        ? Math.round((hadirCount / absensiData.sesiList.length) * 100)
                        : 0;
                      return (
                        <tr key={p.id} className="border-b hover:bg-muted/50">
                          <td className="sticky left-0 z-10 min-w-48 bg-background px-3 py-1.5 font-medium">{p.nama}</td>
                          {absensiData.sesiList.map((s) => {
                            const a = absensiData.absensiList.find(
                              (a) => a.pesertaId === p.id && a.sessionId === s.id
                            );
                            const present = a?.hadir === true;
                            return (
                              <td key={s.id} className="border-l px-2 py-1.5 text-center">
                                <button
                                  className={`inline-flex h-6 w-6 items-center justify-center rounded text-xs font-bold tabular-nums
                                    ${present ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}
                                    ${canManage ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}
                                  disabled={!canManage}
                                  onClick={() => handleAbsensiToggle(p.id, s.id, a?.hadir)}
                                  aria-label={`${present ? "Hadir" : "Tidak hadir"} ${p.nama} pada ${formatSessionDate(s.scheduledDate)}`}
                                  title={`${present ? "Hadir" : "Tidak hadir"} - ${formatSessionDate(s.scheduledDate)}${s.sessionNumber ? ` - Sesi ${s.sessionNumber}` : ""}`}
                                >
                                  {present ? "1" : "0"}
                                </button>
                              </td>
                            );
                          })}
                          <td className={`sticky right-0 z-10 bg-background px-3 py-1.5 text-center font-medium tabular-nums ${pct < 60 ? "text-destructive" : ""}`}>
                            {pct}%
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              </div>
              </>
            )}
          </CardContent>
        </Card>
      </TabsContent>


      {/* â”€â”€ Sub-tab: Absensi & Nilai Ujian â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <TabsContent value="nilai-ujian">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Absensi &amp; Nilai Ujian</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!nilaiData || !absensiUjianData ? (
              <div className="p-4 text-center text-muted-foreground">
                {isPending ? "Memuat..." : "Klik tab untuk memuat data."}
              </div>
            ) : (
              absensiUjianData.ujianList.map((ujian) => {
                const mapel = ujian.mataPelajaran ?? [];
                return (
                  <div key={ujian.id} className="border-b last:border-b-0">
                    <div className="px-4 py-2 bg-muted/20 font-medium text-sm">
                      Ujian â€” {ujian.tanggalUjian} ({mapel.join(", ")})
                    </div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left px-3 py-2 font-medium text-muted-foreground">Peserta</th>
                          <th className="text-center px-3 py-2 font-medium text-muted-foreground">Hadir</th>
                          {mapel.map((m) => (
                            <th key={m} className="text-center px-3 py-2 font-medium text-muted-foreground">{m}</th>
                          ))}
                          <th className="text-center px-3 py-2 font-medium text-muted-foreground">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {absensiUjianData.pesertaList.map((p) => {
                          const absen = absensiUjianData.absensiList.find(
                            (a) => a.pesertaId === p.id && a.jadwalUjianId === ujian.id
                          );
                          return (
                            <tr key={p.id} className="border-b hover:bg-muted/50">
                              <td className="px-3 py-1.5 font-medium">{p.nama}</td>
                              <td className="text-center px-3 py-1.5">
                                <Badge variant={absen?.status === "hadir" ? "default" : "secondary"}>
                                  {absen?.status === "hadir" ? "Hadir" : absen?.status === "susulan" ? "Susulan" : absen?.status === "tidak_hadir" ? "Tidak" : "-"}
                                </Badge>
                              </td>
                              {mapel.map((m) => {
                                const n = nilaiData.nilaiList.find(
                                  (nv) =>
                                    nv.pesertaId === p.id &&
                                    nv.jadwalUjianId === ujian.id &&
                                    nv.mataPelajaran === m &&
                                    !nv.isPerbaikan
                                );
                                const perbaikan = nilaiData.nilaiList.find(
                                  (nv) =>
                                    nv.pesertaId === p.id &&
                                    nv.mataPelajaran === m &&
                                    nv.isPerbaikan &&
                                    nv.perbaikanDariId === n?.id
                                );
                                const displayNilai = perbaikan ? perbaikan.nilai : n?.nilai;
                                const isEditingPerbaikan =
                                  perbaikanEdit?.pesertaId === p.id &&
                                  perbaikanEdit?.mapel === m &&
                                  perbaikanEdit?.jadwalUjianId === ujian.id;
                                return (
                                  <td key={m} className="text-center px-3 py-1.5">
                                    {canManage && absen?.status === "hadir" ? (
                                      <Select
                                        value={displayNilai ?? "-"}
                                        onValueChange={(v) => handleNilaiChange(p.id, ujian.id, m, v)}
                                      >
                                        <SelectTrigger className={`h-7 w-14 text-xs ${displayNilai === "D" ? "border-red-300 text-red-600" : ""}`}>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="-">-</SelectItem>
                                          <SelectItem value="A">A</SelectItem>
                                          <SelectItem value="B">B</SelectItem>
                                          <SelectItem value="C">C</SelectItem>
                                          <SelectItem value="D">D</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    ) : (
                                      <span className={`text-sm font-medium ${displayNilai === "D" ? "text-destructive" : displayNilai ? "" : "text-muted-foreground"}`}>
                                        {displayNilai ?? "-"}
                                      </span>
                                    )}
                                    {n?.nilai === "D" && !perbaikan && canManage && (
                                      isEditingPerbaikan ? (
                                        <span className="inline-flex items-center gap-1 ml-1">
                                          <select
                                            className="border rounded text-xs px-1 py-0.5"
                                            value={perbaikanEdit.nilai}
                                            onChange={(e) =>
                                              setPerbaikanEdit({ ...perbaikanEdit, nilai: e.target.value as "A" | "B" | "C" })
                                            }
                                          >
                                            <option value="A">A</option>
                                            <option value="B">B</option>
                                            <option value="C">C</option>
                                          </select>
                                          <button
                                            className="text-xs text-green-600 hover:underline"
                                            onClick={handlePerbaikan}
                                            disabled={isPending}
                                          >âœ“</button>
                                          <button
                                            className="text-xs text-muted-foreground hover:underline"
                                            onClick={() => setPerbaikanEdit(null)}
                                          >âœ—</button>
                                        </span>
                                      ) : (
                                        <button
                                          className="ml-1 text-xs text-blue-600 hover:underline"
                                          onClick={() =>
                                            setPerbaikanEdit({
                                              pesertaId: p.id,
                                              jadwalUjianId: ujian.id,
                                              mapel: m,
                                              perbaikanDariId: n.id,
                                              nilai: "A",
                                            })
                                          }
                                        >
                                          [Perbaikan]
                                        </button>
                                      )
                                    )}
                                  </td>
                                );
                              })}
                              <td className="text-center px-3 py-1.5">
                                {absen?.status !== "hadir" && canManage && (
                                  susulanEdit?.pesertaId === p.id && susulanEdit?.jadwalUjianId === ujian.id ? (
                                    <span className="inline-flex items-center gap-1">
                                      <input
                                        type="date"
                                        className="border rounded text-xs px-1 py-0.5"
                                        value={susulanEdit.tanggal}
                                        onChange={(e) =>
                                          setSusulanEdit({ ...susulanEdit, tanggal: e.target.value })
                                        }
                                      />
                                      <button
                                        className="text-xs text-green-600 hover:underline"
                                        onClick={handleSusulan}
                                        disabled={isPending}
                                      >âœ“</button>
                                      <button
                                        className="text-xs text-muted-foreground hover:underline"
                                        onClick={() => setSusulanEdit(null)}
                                      >âœ—</button>
                                    </span>
                                  ) : (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-xs"
                                      onClick={() =>
                                        setSusulanEdit({ pesertaId: p.id, jadwalUjianId: ujian.id, tanggal: "" })
                                      }
                                    >
                                      Susulan
                                    </Button>
                                  )
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* â”€â”€ Sub-tab: Status & Rekap â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <TabsContent value="rekap">
        <Card>
          <CardHeader className="border-b flex-row items-center justify-between">
            <CardTitle>Status &amp; Rekap Kelas</CardTitle>
            <Button variant="outline" size="sm" onClick={handleExportRekap} disabled={exportPending}>
              {exportPending ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-1" />
              )}
              Export Excel
            </Button>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="rounded-xl border p-4 text-center">
                <p className="text-2xl font-bold">{rekapSummary.total}</p>
                <p className="text-xs text-muted-foreground">Total Peserta</p>
              </div>
              <div className="rounded-xl border p-4 text-center border-green-200 bg-green-50">
                <p className="text-2xl font-bold text-green-700">{rekapSummary.lulus}</p>
                <p className="text-xs text-muted-foreground">Lulus</p>
              </div>
              <div className="rounded-xl border p-4 text-center border-red-200 bg-red-50">
                <p className="text-2xl font-bold text-red-600">{rekapSummary.telahMengikuti}</p>
                <p className="text-xs text-muted-foreground">Telah Mengikuti</p>
              </div>
              <div className="rounded-xl border p-4 text-center border-amber-200 bg-amber-50">
                <p className="text-2xl font-bold text-amber-600">{rekapSummary.belumFinal}</p>
                <p className="text-xs text-muted-foreground">Dalam Proses</p>
              </div>
            </div>

            {rekapSummary.tm.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium mb-2">Detail Telah Mengikuti:</p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">Peserta</th>
                      <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">Alasan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rekapSummary.tm.map((p) => (
                      <tr key={p.id} className="border-b">
                        <td className="px-3 py-1.5">{p.nama}</td>
                        <td className="px-3 py-1.5">
                          {p.alasanStatus === "kehadiran" ? "Kehadiran < 60%" : p.alasanStatus === "nilai" ? "Nilai D" : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">No</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Nama</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">No Peserta</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {pesertaList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-4 text-center text-muted-foreground">Belum ada peserta.</td>
                    </tr>
                  ) : (
                    pesertaList.map((p, i) => (
                      <tr key={p.id} className="border-b hover:bg-muted/50">
                        <td className="px-3 py-1.5 text-muted-foreground tabular-nums">{i + 1}</td>
                        <td className="px-3 py-1.5 font-medium">{p.nama}</td>
                        <td className="px-3 py-1.5 text-muted-foreground">{p.nomorPeserta ?? "-"}</td>
                        <td className="px-3 py-1.5"><StatusBadge status={p.statusAkhir} alasan={p.alasanStatus} /></td>
                        <td className="px-3 py-1.5 text-sm text-muted-foreground">
                          {p.alasanStatus === "kehadiran" ? "Kehadiran < 60%" : p.alasanStatus === "nilai" ? "Nilai D" : ""}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
    <Dialog open={deactivateDialog !== null} onOpenChange={(open) => !open && setDeactivateDialog(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{deactivateDialog?.title ?? "Nonaktifkan peserta?"}</DialogTitle>
          <DialogDescription>
            {deactivateDialog?.description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isPending}>Batal</Button>
          </DialogClose>
          <Button variant="destructive" onClick={confirmDeactivatePeserta} disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserRoundX className="h-4 w-4" />}
            Nonaktifkan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}

// â”€â”€â”€ Helper: StatusBadge â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function StatusBadge({ status, alasan }: { status: string | null; alasan: string | null }) {
  if (status === "lulus") return <Badge variant="default" className="bg-green-600">Lulus</Badge>;
  if (status === "telah_mengikuti") {
    const label = alasan === "kehadiran" ? "Telah Mengikuti (hadir)" : "Telah Mengikuti (nilai)";
    return <Badge variant="destructive">{label}</Badge>;
  }
  return <Badge variant="secondary">Dalam Proses</Badge>;
}
