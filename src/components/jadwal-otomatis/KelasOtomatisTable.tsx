"use client";

import { useMemo, useState, useTransition } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, CalendarDays, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import {
  deleteKelasOtomatis,
  updateKelasOtomatisStartDate,
  type KelasOtomatisRow,
} from "@/server/actions/jadwal-otomatis/kelasOtomatis";

const STATUS_COLORS: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  active: "default",
  completed: "secondary",
  cancelled: "destructive",
};

interface KelasOtomatisTableProps {
  initialData: KelasOtomatisRow[];
  canManage: boolean;
}

export function KelasOtomatisTable({ initialData, canManage }: KelasOtomatisTableProps) {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<KelasOtomatisRow | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();
  const [editTarget, setEditTarget] = useState<KelasOtomatisRow | null>(null);
  const [editStartDate, setEditStartDate] = useState("");
  const [editExclusionStrategy, setEditExclusionStrategy] = useState<"keep" | "shift" | "clear">("keep");
  const [isSavingEdit, startEditTransition] = useTransition();

  const columns = useMemo<ColumnDef<KelasOtomatisRow>[]>(() => {
    const base: ColumnDef<KelasOtomatisRow>[] = [
      {
        accessorKey: "namaKelas",
        header: "Nama Kelas",
        cell: ({ row }) => (
          <button
            onClick={() => router.push(`/jadwal-otomatis/${row.original.id}`)}
            className="font-medium text-left hover:underline cursor-pointer"
          >
            {row.original.namaKelas}
          </button>
        ),
      },
      {
        accessorKey: "programName",
        header: "Program",
        cell: ({ row }) => <Badge variant="secondary">{row.original.programName}</Badge>,
      },
      {
        accessorKey: "classTypeName",
        header: "Tipe Kelas",
      },
      {
        accessorKey: "mode",
        header: "Metode",
        cell: ({ row }) => (
          <Badge variant={row.original.mode === "online" ? "secondary" : "default"}>
            {row.original.mode === "online" ? "Online" : "Offline"}
          </Badge>
        ),
      },
      {
        accessorKey: "startDate",
        header: "Tanggal Mulai",
      },
      {
        accessorKey: "endDate",
        header: "Tanggal Selesai",
        cell: ({ row }) => row.original.endDate ?? <span className="text-muted-foreground text-xs">—</span>,
      },
      {
        accessorKey: "totalSessions",
        header: "Total Sesi",
        cell: ({ row }) => <span className="tabular-nums">{row.original.totalSessions}</span>,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={STATUS_COLORS[row.original.status] ?? "outline"}>
            {row.original.status}
          </Badge>
        ),
      },
    ];

    if (canManage) {
      base.push({
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
                  <DropdownMenuItem onClick={() => router.push(`/jadwal-otomatis/${row.original.id}`)}>
                    <CalendarDays className="mr-2 h-4 w-4" />
                    Lihat Jadwal
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setEditTarget(row.original);
                      setEditStartDate(row.original.startDate);
                      setEditExclusionStrategy("keep");
                    }}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Tanggal Mulai
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => setDeleteTarget(row.original)}
                  >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      });
    }

    return base;
  }, [canManage, router]);

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    startDeleteTransition(async () => {
      const res = await deleteKelasOtomatis(deleteTarget.id);
      if (!res.ok) {
        toast.error("Gagal menghapus kelas.");
        return;
      }
      toast.success(`Kelas "${deleteTarget.namaKelas}" dihapus.`);
      setDeleteTarget(null);
      router.refresh();
    });
  }

  function handleEditConfirm() {
    if (!editTarget) return;
    if (!editStartDate) {
      toast.error("Tanggal mulai wajib diisi.");
      return;
    }

    startEditTransition(async () => {
      const result = await updateKelasOtomatisStartDate({
        id: editTarget.id,
        startDate: editStartDate,
        exclusionStrategy: editExclusionStrategy,
      });

      if (!result.ok) {
        toast.error(result.error ?? "Gagal memperbarui tanggal mulai.");
        return;
      }

      if ("unchanged" in result && result.unchanged) {
        toast.info("Tanggal mulai tidak berubah.");
      } else {
        const strategyLabel =
          editExclusionStrategy === "shift"
            ? "Eksklusi digeser mengikuti tanggal mulai baru."
            : editExclusionStrategy === "clear"
              ? "Eksklusi manual dikosongkan."
              : "Eksklusi tetap pada tanggal aslinya.";
        toast.success(`Tanggal mulai diperbarui. ${strategyLabel}`);
      }

      setEditTarget(null);
      setEditStartDate("");
      setEditExclusionStrategy("keep");
      router.refresh();
    });
  }

  return (
    <>
      <Card className="rounded-[28px]">
        <CardHeader className="border-b border-border">
          <div>
            <CardTitle>Daftar Kelas Pelatihan</CardTitle>
            <CardDescription className="mt-1">
              Kelas yang sudah dijadwalkan secara otomatis berdasarkan kurikulum.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <DataTable
            columns={columns}
            data={initialData}
            searchColumnId="namaKelas"
            searchPlaceholder="Cari kelas..."
            emptyMessage="Belum ada kelas. Klik 'Buat Kelas Baru' untuk memulai."
          />
        </CardContent>
      </Card>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open && !isDeleting) setDeleteTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Kelas?</DialogTitle>
            <DialogDescription>
              Kelas <span className="font-medium text-foreground">{deleteTarget?.namaKelas}</span>{" "}
              akan dihapus permanen beserta seluruh jadwalnya. Aksi ini tidak dapat dibatalkan.
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

      <Dialog
        open={!!editTarget}
        onOpenChange={(open) => {
          if (!open && !isSavingEdit) {
            setEditTarget(null);
            setEditStartDate("");
            setEditExclusionStrategy("keep");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tanggal Mulai</DialogTitle>
            <DialogDescription>
              Ubah tanggal mulai untuk kelas{" "}
              <span className="font-medium text-foreground">{editTarget?.namaKelas}</span>.
              Jadwal sesi akan diregenerasi ulang dari tanggal baru.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="edit-start-date">
              Tanggal Mulai Baru
            </label>
            <Input
              id="edit-start-date"
              type="date"
              value={editStartDate}
              onChange={(event) => setEditStartDate(event.target.value)}
              disabled={isSavingEdit}
            />
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="edit-exclusion-strategy">
                Perlakuan Tanggal Eksklusi
              </label>
              <Select
                value={editExclusionStrategy}
                onValueChange={(value) => setEditExclusionStrategy(value as "keep" | "shift" | "clear")}
                disabled={isSavingEdit}
              >
                <SelectTrigger id="edit-exclusion-strategy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="keep">Tetap (absolut)</SelectItem>
                  <SelectItem value="shift">Geser mengikuti selisih tanggal mulai</SelectItem>
                  <SelectItem value="clear">Kosongkan eksklusi manual</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {editExclusionStrategy === "keep"
                  ? "Cocok jika eksklusi berupa tanggal tetap (misalnya event/agenda di tanggal tertentu)."
                  : editExclusionStrategy === "shift"
                    ? "Cocok jika eksklusi bersifat relatif terhadap timeline kelas."
                    : "Semua eksklusi manual dihapus, lalu jadwal disusun ulang dari tanggal mulai baru."}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Catatan: jadwal lama dan assignment instruktur akan disusun ulang sesuai tanggal baru.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditTarget(null);
                setEditStartDate("");
                setEditExclusionStrategy("keep");
              }}
              disabled={isSavingEdit}
            >
              Batal
            </Button>
            <Button onClick={handleEditConfirm} disabled={isSavingEdit}>
              {isSavingEdit ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
