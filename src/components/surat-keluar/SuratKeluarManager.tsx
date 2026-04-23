"use client";

import { useMemo, useState, useTransition } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Plus, Pencil, Trash2, Eye, Hash } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { SuratKeluarForm } from "./SuratKeluarForm";
import {
  SuratKeluarStepper,
  STATUS_CONFIG,
  JENIS_SURAT_LABEL,
} from "./SuratKeluarStepper";
import { deleteSuratKeluar } from "@/server/actions/suratKeluar";
import type {
  SuratKeluarRow,
  PejabatOption,
  DivisiOption,
} from "@/server/actions/suratKeluar";
import { cn, formatTanggalPendek } from "@/lib/utils";

interface SuratKeluarManagerProps {
  initialData: SuratKeluarRow[];
  pejabatList: PejabatOption[];
  divisiList: DivisiOption[];
  role: string | null;
}

type FormState =
  | { open: false }
  | { open: true; mode: "create" }
  | { open: true; mode: "edit"; row: SuratKeluarRow };

type DetailState = { open: false } | { open: true; row: SuratKeluarRow };

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status,
    className: "bg-secondary text-secondary-foreground",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        cfg.className,
      )}
    >
      {cfg.label}
    </span>
  );
}

function NomorSuratCell({
  row,
  canGenerate,
  onOpenDetail,
}: {
  row: SuratKeluarRow;
  canGenerate: boolean;
  onOpenDetail: () => void;
}) {
  if (row.nomorSurat) {
    return (
      <span className="font-mono text-xs font-semibold text-primary">
        {row.nomorSurat}
      </span>
    );
  }

  if (canGenerate && row.status === "pengarsipan") {
    return (
      <Button
        variant="outline"
        size="sm"
        className="h-6 gap-1 px-2 text-xs"
        onClick={onOpenDetail}
      >
        <Hash className="h-3 w-3" />
        Generate No.
      </Button>
    );
  }

  return <span className="text-muted-foreground text-xs">-</span>;
}

function OptionalText({ value }: { value: string | null | undefined }) {
  return value ? (
    <span className="text-sm text-foreground">{value}</span>
  ) : (
    <span className="text-muted-foreground text-xs">-</span>
  );
}

export function SuratKeluarManager({
  initialData,
  pejabatList,
  divisiList,
  role,
}: SuratKeluarManagerProps) {
  const [formState, setFormState] = useState<FormState>({ open: false });
  const [detailState, setDetailState] = useState<DetailState>({ open: false });
  const [deleteTarget, setDeleteTarget] = useState<SuratKeluarRow | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  const canCreate = role === "admin" || role === "pejabat" || role === "staff";
  const canDelete = role === "admin";
  const canGenerate = role === "admin" || role === "pejabat";

  const columns = useMemo<ColumnDef<SuratKeluarRow>[]>(() => {
    return [
      {
        id: "index",
        header: "No.",
        cell: ({ row }) => (
          <span className="text-muted-foreground tabular-nums">
            {row.index + 1}
          </span>
        ),
        size: 48,
      },
      {
        id: "perihal",
        header: "Perihal / Tujuan",
        accessorKey: "perihal",
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <p className="font-medium leading-tight">{row.original.perihal}</p>
            <p className="text-xs leading-tight text-muted-foreground">
              {row.original.tujuan}
            </p>
          </div>
        ),
      },
      {
        id: "tujuanAlamat",
        header: "Alamat Tujuan",
        accessorKey: "tujuanAlamat",
        cell: ({ row }) => (
          <div className="max-w-[220px]">
            <OptionalText value={row.original.tujuanAlamat} />
          </div>
        ),
      },
      {
        id: "isiSingkat",
        header: "Isi Singkat",
        accessorKey: "isiSingkat",
        cell: ({ row }) => (
          <div className="max-w-[240px]">
            <OptionalText value={row.original.isiSingkat} />
          </div>
        ),
      },
      {
        id: "nomorSurat",
        header: "No. Surat",
        cell: ({ row }) => (
          <NomorSuratCell
            row={row.original}
            canGenerate={canGenerate}
            onOpenDetail={() =>
              setDetailState({ open: true, row: row.original })
            }
          />
        ),
      },
      {
        id: "tanggalSurat",
        header: "Tanggal",
        accessorKey: "tanggalSurat",
        cell: ({ row }) => (
          <span className="text-sm tabular-nums">
            {formatTanggalPendek(row.original.tanggalSurat)}
          </span>
        ),
      },
      {
        id: "jenisSurat",
        header: "Jenis",
        accessorKey: "jenisSurat",
        cell: ({ row }) => (
          <Badge variant="secondary" className="whitespace-nowrap text-xs">
            {JENIS_SURAT_LABEL[row.original.jenisSurat] ??
              row.original.jenisSurat}
          </Badge>
        ),
      },
      {
        id: "divisi",
        header: "Divisi",
        accessorKey: "divisiNama",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.divisiNama ?? "-"}
          </span>
        ),
      },
      {
        id: "pembuat",
        header: "Pembuat",
        accessorKey: "dibuatOlehNama",
        cell: ({ row }) => <OptionalText value={row.original.dibuatOlehNama} />,
      },
      {
        id: "draft",
        header: "Draft",
        accessorKey: "fileDraftUrl",
        cell: ({ row }) =>
          row.original.fileDraftUrl ? (
            <a
              href={row.original.fileDraftUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-primary underline underline-offset-2"
            >
              Buka Draft
            </a>
          ) : (
            <span className="text-muted-foreground text-xs">Belum ada</span>
          ),
      },
      {
        id: "status",
        header: "Status",
        accessorKey: "status",
        cell: ({ row }) => (
          <StatusBadge status={row.original.status ?? "draft"} />
        ),
      },
      {
        id: "catatanReviu",
        header: "Catatan Reviu",
        accessorKey: "catatanReviu",
        cell: ({ row }) => (
          <div className="max-w-[220px]">
            <OptionalText value={row.original.catatanReviu} />
          </div>
        ),
      },
      {
        id: "timestamps",
        header: "Dibuat / Diubah",
        cell: ({ row }) => (
          <div className="space-y-0.5 text-xs">
            <p className="text-foreground">
              {row.original.createdAt
                ? formatTanggalPendek(row.original.createdAt)
                : "-"}
            </p>
            <p className="text-muted-foreground">
              Update:{" "}
              {row.original.updatedAt
                ? formatTanggalPendek(row.original.updatedAt)
                : "-"}
            </p>
          </div>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const r = row.original;
          const isDraft = r.status === "draft";
          const isDraftOrCancelled =
            r.status === "draft" || r.status === "dibatalkan";

          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Aksi</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => setDetailState({ open: true, row: r })}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Lihat Detail
                  </DropdownMenuItem>

                  {isDraft ? (
                    <DropdownMenuItem
                      onClick={() =>
                        setFormState({ open: true, mode: "edit", row: r })
                      }
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                  ) : null}

                  {canDelete && isDraftOrCancelled ? (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setDeleteTarget(r)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Hapus
                      </DropdownMenuItem>
                    </>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ];
  }, [canDelete, canGenerate]);

  function handleDeleteConfirm() {
    if (!deleteTarget) return;

    startDeleteTransition(async () => {
      const res = await deleteSuratKeluar({ id: deleteTarget.id });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }

      toast.success("Surat keluar dihapus.");
      setDeleteTarget(null);
    });
  }

  return (
    <>
      <Card className="rounded-[28px]">
        <CardHeader className="border-b border-border">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Arsip Surat Keluar</CardTitle>
              <CardDescription className="mt-1">
                Kelola pembuatan surat keluar dan pantau workflow 5 tahap
                hingga pengarsipan selesai.
              </CardDescription>
            </div>
            {canCreate ? (
              <Button
                onClick={() => setFormState({ open: true, mode: "create" })}
              >
                <Plus className="h-4 w-4" />
                Buat Surat Keluar
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <DataTable
            columns={columns}
            data={initialData}
            searchColumnId="perihal"
            searchPlaceholder="Cari perihal surat..."
            emptyMessage="Belum ada surat keluar. Klik 'Buat Surat Keluar' untuk memulai."
          />
        </CardContent>
      </Card>

      <SuratKeluarForm
        open={formState.open}
        onOpenChange={(open) => {
          if (!open) setFormState({ open: false });
        }}
        mode={formState.open ? formState.mode : "create"}
        initialData={
          formState.open && formState.mode === "edit" ? formState.row : null
        }
        pejabatList={pejabatList}
        divisiList={divisiList}
      />

      {detailState.open ? (
        <SuratKeluarStepper
          open={detailState.open}
          onOpenChange={(open) => {
            if (!open) setDetailState({ open: false });
          }}
          row={detailState.row}
          role={role}
          onEditClick={() => {
            if (detailState.open) {
              setFormState({
                open: true,
                mode: "edit",
                row: detailState.row,
              });
            }
          }}
        />
      ) : null}

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeleteTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Surat Keluar?</DialogTitle>
            <DialogDescription>
              Surat{" "}
              <span className="font-medium text-foreground">
                &ldquo;{deleteTarget?.perihal}&rdquo;
              </span>{" "}
              akan dihapus permanen. Aksi ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
