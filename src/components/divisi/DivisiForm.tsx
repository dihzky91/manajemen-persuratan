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
import { Button } from "@/components/ui/button";
import {
  divisiCreateSchema,
  type DivisiCreateInput,
} from "@/lib/validators/divisi.schema";
import { createDivisi, updateDivisi } from "@/server/actions/divisi";
import type { DivisiRow } from "@/server/actions/divisi";

interface DivisiFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initialData?: DivisiRow | null;
}

export function DivisiForm({
  open,
  onOpenChange,
  mode,
  initialData,
}: DivisiFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<DivisiCreateInput>({
    resolver: zodResolver(divisiCreateSchema),
    defaultValues: { nama: "", kode: "" },
  });

  useEffect(() => {
    if (open) {
      if (mode === "edit" && initialData) {
        form.reset({ nama: initialData.nama, kode: initialData.kode ?? "" });
      } else {
        form.reset({ nama: "", kode: "" });
      }
    }
  }, [open, mode, initialData, form]);

  function onSubmit(values: DivisiCreateInput) {
    startTransition(async () => {
      const res =
        mode === "edit" && initialData
          ? await updateDivisi({ ...values, id: initialData.id })
          : await createDivisi(values);

      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(
        mode === "edit" ? "Divisi diperbarui." : "Divisi berhasil dibuat.",
      );
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Ubah Divisi" : "Tambah Divisi"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Perbarui nama atau kode divisi."
              : "Isi data divisi baru untuk organisasi."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            id="divisi-form"
          >
            <FormField
              control={form.control}
              name="nama"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Divisi</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="mis. HRD dan Umum"
                      autoFocus
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="kode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Kode{" "}
                    <span className="text-muted-foreground font-normal">
                      (opsional)
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="mis. HRD"
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
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Batal
          </Button>
          <Button type="submit" form="divisi-form" disabled={isPending}>
            {isPending
              ? "Menyimpan..."
              : mode === "edit"
                ? "Simpan Perubahan"
                : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
