"use client";

import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  pengawasCreateSchema,
  type PengawasCreateInput,
} from "@/lib/validators/jadwalUjian.schema";
import { createPengawas, updatePengawas, type PengawasRow } from "@/server/actions/jadwal-ujian/pengawas";

interface PengawasFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initialData?: PengawasRow | null;
}

export function PengawasForm({ open, onOpenChange, mode, initialData }: PengawasFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<PengawasCreateInput>({
    resolver: zodResolver(pengawasCreateSchema),
    defaultValues: { nama: "", catatan: "" },
  });

  useEffect(() => {
    if (open) {
      form.reset(
        mode === "edit" && initialData
          ? { nama: initialData.nama, catatan: initialData.catatan ?? "" }
          : { nama: "", catatan: "" },
      );
    }
  }, [open, mode, initialData, form]);

  function onSubmit(values: PengawasCreateInput) {
    startTransition(async () => {
      const res =
        mode === "edit" && initialData
          ? await updatePengawas({ ...values, id: initialData.id })
          : await createPengawas(values);

      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(mode === "edit" ? "Pengawas diperbarui." : "Pengawas berhasil ditambahkan.");
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Ubah Pengawas" : "Tambah Pengawas"}</DialogTitle>
          <DialogDescription>
            {mode === "edit" ? "Perbarui data pengawas." : "Isi data pengawas baru."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} id="pengawas-form" className="space-y-4">
            <FormField
              control={form.control}
              name="nama"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Pengawas</FormLabel>
                  <FormControl>
                    <Input placeholder="mis. Budi Santoso" autoFocus {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="catatan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Catatan{" "}
                    <span className="text-muted-foreground font-normal">(opsional)</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Informasi tambahan tentang pengawas..."
                      rows={3}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Batal
          </Button>
          <Button type="submit" form="pengawas-form" disabled={isPending}>
            {isPending ? "Menyimpan..." : mode === "edit" ? "Simpan Perubahan" : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
