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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ujianCreateSchema, type UjianCreateInput } from "@/lib/validators/jadwalUjian.schema";
import { createUjian, updateUjian, type UjianRow } from "@/server/actions/jadwal-ujian/ujian";
import type { KelasRow } from "@/server/actions/jadwal-ujian/kelas";

interface UjianFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initialData?: UjianRow | null;
  kelasList: Pick<KelasRow, "id" | "namaKelas" | "program">[];
}

export function UjianForm({ open, onOpenChange, mode, initialData, kelasList }: UjianFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<UjianCreateInput>({
    resolver: zodResolver(ujianCreateSchema),
    defaultValues: { kelasId: "", mataPelajaran: "", tanggalUjian: "", jamMulai: "", jamSelesai: "", catatan: "" },
  });

  useEffect(() => {
    if (open) {
      form.reset(
        mode === "edit" && initialData
          ? {
              kelasId: initialData.kelasId,
              mataPelajaran: initialData.mataPelajaran,
              tanggalUjian: initialData.tanggalUjian,
              jamMulai: initialData.jamMulai,
              jamSelesai: initialData.jamSelesai,
              catatan: initialData.catatan ?? "",
            }
          : { kelasId: "", mataPelajaran: "", tanggalUjian: "", jamMulai: "", jamSelesai: "", catatan: "" },
      );
    }
  }, [open, mode, initialData, form]);

  function onSubmit(values: UjianCreateInput) {
    startTransition(async () => {
      const res =
        mode === "edit" && initialData
          ? await updateUjian({ ...values, id: initialData.id })
          : await createUjian(values);

      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(mode === "edit" ? "Jadwal ujian diperbarui." : "Jadwal ujian berhasil dibuat.");
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Ubah Jadwal Ujian" : "Tambah Jadwal Ujian"}</DialogTitle>
          <DialogDescription>
            {mode === "edit" ? "Perbarui data jadwal ujian." : "Isi detail jadwal ujian baru."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} id="ujian-form" className="space-y-4">
            <FormField
              control={form.control}
              name="kelasId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kelas</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kelas..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {kelasList.map((k) => (
                        <SelectItem key={k.id} value={k.id}>
                          {k.namaKelas}
                          <span className="ml-2 text-muted-foreground text-xs">({k.program})</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mataPelajaran"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mata Pelajaran / Materi</FormLabel>
                  <FormControl>
                    <Input placeholder="mis. Akuntansi Keuangan" autoFocus {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tanggalUjian"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tanggal Ujian</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="jamMulai"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jam Mulai</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="jamSelesai"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jam Selesai</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="catatan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Catatan <span className="text-muted-foreground font-normal">(opsional)</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Informasi tambahan..." {...field} value={field.value ?? ""} />
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
          <Button type="submit" form="ujian-form" disabled={isPending}>
            {isPending ? "Menyimpan..." : mode === "edit" ? "Simpan Perubahan" : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
