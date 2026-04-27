"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";
import { Archive, Eye, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ConflictBadge } from "./ConflictBadge";
import { UjianForm } from "./UjianForm";
import { UjianExportButton } from "./UjianExportButton";
import { deleteUjian, type UjianRow } from "@/server/actions/jadwal-ujian/ujian";
import type { KelasRow } from "@/server/actions/jadwal-ujian/kelas";
import type { PengawasRow } from "@/server/actions/jadwal-ujian/pengawas";
import type { MateriRow } from "@/server/actions/jadwal-ujian/materi";

interface UjianTableProps {
  initialData: UjianRow[];
  kelasList: Pick<KelasRow, "id" | "namaKelas" | "program">[];
  pengawasList: Pick<PengawasRow, "id" | "nama">[];
  materiList: Pick<MateriRow, "id" | "nama" | "program">[];
  canManage: boolean;
  programOptions: string[];
}

type FormState =
  | { open: false }
  | { open: true; mode: "create" }
  | { open: true; mode: "edit"; row: UjianRow };

export function UjianTable({ initialData, kelasList, pengawasList, materiList, canManage, programOptions }: UjianTableProps) {
  const router = useRouter();
  const [formState, setFormState] = useState<FormState>({ open: false });
  const [deleteTarget, setDeleteTarget] = useState<UjianRow | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();
  const [filterProgram, setFilterProgram] = useState("__all__");
  const [filterTanggalMulai, setFilterTanggalMulai] = useState("");
  const [filterTanggalSelesai, setFilterTanggalSelesai] = useState("");
  const [showPastExams, setShowPastExams] = useState(false);

  const today = useMemo(() => new Date().toISOString().split("T")[0]!, []);

  const archivedCount = useMemo(
    () => initialData.filter((u) => u.tanggalUjian < today).length,
    [initialData, today],
  );

  const filteredData = useMemo(() => {
    return initialData.filter((u) => {
      if (!showPastExams && u.tanggalUjian < today) return false;
      if (filterProgram !== "__all__" && u.program !== filterProgram) return false;
      if (filterTanggalMulai && u.tanggalUjian < filterTanggalMulai) return false;
      if (filterTanggalSelesai && u.tanggalUjian > filterTanggalSelesai) return false;
      return true;
    });
  }, [initialData, showPastExams, today, filterProgram, filterTanggalMulai, filterTanggalSelesai]);

  const columns = useMemo<ColumnDef<UjianRow>[]>(() => {
    const base: ColumnDef<UjianRow>[] = [
      {
        accessorKey: "tanggalUjian",
        header: "Tanggal",
        cell: ({ row }) => {
          const d = new Date(row.original.tanggalUjian + "T00:00:00");
          return (
            <span className="tabular-nums text-sm whitespace-nowrap">
              {d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
            </span>
          );
        },
      },
      {
        id: "jam",
        header: "Waktu",
        cell: ({ row }) => (
          <span className="tabular-nums text-sm text-muted-foreground whitespace-nowrap">
            {row.original.jamMulai} – {row.original.jamSelesai}
          </span>
        ),
      },
      {
        accessorKey: "mataPelajaran",
        header: "Mata Ujian",
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            {row.original.mataPelajaran.map((m, i) => (
              <span key={i} className="font-medium text-sm">{m}</span>
            ))}
          </div>
        ),
      },
      {
        accessorKey: "namaKelas",
        header: "Kelas",
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <span className="text-sm">{row.original.namaKelas}</span>
            <span className="text-xs text-muted-foreground">{row.original.program} · {row.original.mode}</span>
          </div>
        ),
      },
      {
        id: "pengawas",
        header: "Pengawas",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="tabular-nums text-sm">{row.original.jumlahPengawas} orang</span>
            {row.original.adaKonflik && <ConflictBadge />}
          </div>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Aksi</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push(`/jadwal-ujian/${row.original.id}`)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Lihat Detail
                </DropdownMenuItem>
                {canManage && (
                  <>
                    <DropdownMenuItem
                      onClick={() => setFormState({ open: true, mode: "edit", row: row.original })}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Ubah
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => setDeleteTarget(row.original)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Hapus
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ];
    return base;
  }, [canManage, router]);

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    startDeleteTransition(async () => {
      const res = await deleteUjian(deleteTarget.id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Jadwal ujian dihapus.");
      setDeleteTarget(null);
    });
  }

  const exportFilter: import("@/lib/validators/jadwalUjian.schema").UjianFilter = {
    program: filterProgram !== "__all__" ? filterProgram : undefined,
    tanggalMulai: filterTanggalMulai || undefined,
    tanggalSelesai: filterTanggalSelesai || undefined,
  };

  return (
    <>
      <Card className="rounded-[28px]">
        <CardHeader className="border-b border-border">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Jadwal Ujian</CardTitle>
              <CardDescription className="mt-1">
                Daftar seluruh jadwal ujian, pengawas, dan status konflik penugasan.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={showPastExams ? "secondary" : "outline"}
                onClick={() => setShowPastExams((v) => !v)}
              >
                <Archive className="h-4 w-4" />
                {showPastExams ? "Sembunyikan Arsip" : `Lihat Arsip (${archivedCount})`}
              </Button>
              <UjianExportButton filter={exportFilter} />
              {canManage && (
                <Button onClick={() => setFormState({ open: true, mode: "create" })}>
                  <Plus className="h-4 w-4" />
                  Tambah Ujian
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={filterProgram} onValueChange={setFilterProgram}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Semua Program</SelectItem>
                {programOptions.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                className="w-37.5"
                value={filterTanggalMulai}
                onChange={(e) => setFilterTanggalMulai(e.target.value)}
                placeholder="Dari tanggal"
              />
              <span className="text-muted-foreground text-sm">s/d</span>
              <Input
                type="date"
                className="w-37.5"
                value={filterTanggalSelesai}
                onChange={(e) => setFilterTanggalSelesai(e.target.value)}
                placeholder="Sampai tanggal"
              />
              {(filterTanggalMulai || filterTanggalSelesai) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setFilterTanggalMulai(""); setFilterTanggalSelesai(""); }}
                >
                  Reset
                </Button>
              )}
            </div>
          </div>

          <DataTable
            columns={columns}
            data={filteredData}
            searchColumnId="mataPelajaran"
            searchPlaceholder="Cari mata pelajaran..."
            emptyMessage="Belum ada jadwal ujian. Klik 'Tambah Ujian' untuk memulai."
          />
        </CardContent>
      </Card>

      <UjianForm
        open={formState.open}
        onOpenChange={(open) => (open ? null : setFormState({ open: false }))}
        mode={formState.open ? formState.mode : "create"}
        initialData={formState.open && formState.mode === "edit" ? formState.row : null}
        kelasList={kelasList}
        pengawasList={pengawasList}
        materiList={materiList}
      />

      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open && !isDeleting) setDeleteTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Jadwal Ujian?</DialogTitle>
            <DialogDescription>
              Ujian{" "}
              <span className="font-medium text-foreground">{deleteTarget?.mataPelajaran.join(" & ")}</span>{" "}
              pada{" "}
              <span className="font-medium text-foreground">{deleteTarget?.tanggalUjian}</span>{" "}
              beserta semua penugasan pengawasnya akan dihapus permanen.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isDeleting}>
              {isDeleting ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
