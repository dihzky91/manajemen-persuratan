"use client";

import { useMemo, useState, useTransition } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, CalendarDays, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { deleteKelasOtomatis, type KelasOtomatisRow } from "@/server/actions/jadwal-otomatis/kelasOtomatis";

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
    </>
  );
}
