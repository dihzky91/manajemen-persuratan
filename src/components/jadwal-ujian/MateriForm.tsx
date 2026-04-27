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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { materiCreateSchema, type MateriCreateInput } from "@/lib/validators/jadwalUjian.schema";
import { createMateri, updateMateri, type MateriRow } from "@/server/actions/jadwal-ujian/materi";

interface MateriFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initialData?: MateriRow | null;
  programOptions: string[];
}

export function MateriForm({ open, onOpenChange, mode, initialData, programOptions }: MateriFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<MateriCreateInput>({
    resolver: zodResolver(materiCreateSchema),
    defaultValues: { nama: "", program: "", urutan: 0 },
  });

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && initialData) {
      form.reset({ nama: initialData.nama, program: initialData.program, urutan: initialData.urutan });
    } else {
      form.reset({ nama: "", program: "", urutan: 0 });
    }
  }, [open, mode, initialData, form]);

  function onSubmit(values: MateriCreateInput) {
    startTransition(async () => {
      const res =
        mode === "edit" && initialData
          ? await updateMateri({ ...values, id: initialData.id })
          : await createMateri(values);

      if (!res.ok) {
        toast.error(res.error);
        return;
      }

      toast.success(mode === "edit" ? "Materi diperbarui." : "Materi berhasil ditambahkan.");
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Ubah Materi Ujian" : "Tambah Materi Ujian"}</DialogTitle>
          <DialogDescription>
            {mode === "edit" ? "Perbarui data materi ujian." : "Tambahkan mata ujian ke daftar master."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} id="materi-form" className="space-y-4">
            <FormField
              control={form.control}
              name="program"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Program</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih program..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {programOptions.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nama"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Materi</FormLabel>
                  <FormControl>
                    <Input placeholder="mis. Akuntansi Keuangan" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="urutan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Urutan <span className="text-muted-foreground font-normal">(opsional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
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
          <Button type="submit" form="materi-form" disabled={isPending}>
            {isPending ? "Menyimpan..." : mode === "edit" ? "Simpan Perubahan" : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
