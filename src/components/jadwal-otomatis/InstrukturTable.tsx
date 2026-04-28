"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { deleteInstructor, type InstructorRow } from "@/server/actions/jadwal-otomatis/instructors";

interface InstrukturTableProps {
  initialData: any[];
  canManage: boolean;
}

export function InstrukturTable({ initialData, canManage }: InstrukturTableProps) {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  const columns = useMemo<ColumnDef<any>[]>(() => {
    const base: ColumnDef<any>[] = [
      { accessorKey: "name", header: "Nama", cell: ({ row }) => <span className="font-medium">{row.original.name}</span> },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => row.original.email ?? <span className="text-muted-foreground text-xs">—</span>,
      },
      {
        accessorKey: "phone",
        header: "Telepon",
        cell: ({ row }) => row.original.phone ?? <span className="text-muted-foreground text-xs">—</span>,
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? "default" : "secondary"}>
            {row.original.isActive ? "Aktif" : "Nonaktif"}
          </Badge>
        ),
      },
    ];

    base.push({
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/jadwal-otomatis/instruktur/${row.original.id}`)}>
                <Eye className="mr-2 h-4 w-4" />
                Detail
              </DropdownMenuItem>
              {canManage && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(row.original)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Hapus
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    });

    return base;
  }, [canManage, router]);

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    startDeleteTransition(async () => {
      const res = await deleteInstructor(deleteTarget.id);
      if (!res.ok) { toast.error("Gagal menghapus."); return; }
      toast.success(`Instruktur "${deleteTarget.name}" dihapus.`);
      setDeleteTarget(null);
      router.refresh();
    });
  }

  return (
    <>
      <Card className="rounded-[28px]">
        <CardHeader className="border-b border-border">
          <CardTitle>Daftar Instruktur</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <DataTable columns={columns} data={initialData} searchColumnId="name" searchPlaceholder="Cari instruktur..." emptyMessage="Belum ada instruktur." />
        </CardContent>
      </Card>

      <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o && !isDeleting) setDeleteTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Instruktur?</DialogTitle>
            <DialogDescription>Instruktur <span className="font-medium">{deleteTarget?.name}</span> akan dihapus permanen.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>Batal</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isDeleting}>{isDeleting ? "Menghapus..." : "Hapus"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
