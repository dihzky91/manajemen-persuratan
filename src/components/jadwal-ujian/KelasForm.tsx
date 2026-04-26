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
import { kelasCreateSchema, type KelasCreateInput } from "@/lib/validators/jadwalUjian.schema";
import { createKelas, updateKelas, type KelasRow } from "@/server/actions/jadwal-ujian/kelas";

interface KelasFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initialData?: KelasRow | null;
  programOptions: string[];
  tipeOptions: string[];
  modeOptions: string[];
}

export function KelasForm({ open, onOpenChange, mode, initialData, programOptions, tipeOptions, modeOptions }: KelasFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<KelasCreateInput>({
    resolver: zodResolver(kelasCreateSchema),
    defaultValues: { namaKelas: "", program: programOptions[0] ?? "", tipe: tipeOptions[0] ?? "", mode: modeOptions[0] ?? "", lokasi: "", catatan: "" },
  });

  useEffect(() => {
    if (open) {
      form.reset(
        mode === "edit" && initialData
          ? {
              namaKelas: initialData.namaKelas,
              program: initialData.program,
              tipe: initialData.tipe,
              mode: initialData.mode,
              lokasi: initialData.lokasi ?? "",
              catatan: initialData.catatan ?? "",
            }
          : { namaKelas: "", program: programOptions[0] ?? "", tipe: tipeOptions[0] ?? "", mode: modeOptions[0] ?? "", lokasi: "", catatan: "" },
      );
    }
  }, [open, mode, initialData, form, programOptions, tipeOptions, modeOptions]);

  function onSubmit(values: KelasCreateInput) {
    startTransition(async () => {
      const res =
        mode === "edit" && initialData
          ? await updateKelas({ ...values, id: initialData.id })
          : await createKelas(values);

      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(mode === "edit" ? "Kelas diperbarui." : "Kelas berhasil ditambahkan.");
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Ubah Kelas" : "Tambah Kelas"}</DialogTitle>
          <DialogDescription>
            {mode === "edit" ? "Perbarui data kelas ujian." : "Isi data kelas baru."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} id="kelas-form" className="space-y-4">
            <FormField
              control={form.control}
              name="namaKelas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Kelas</FormLabel>
                  <FormControl>
                    <Input placeholder="mis. Brevet AB Reguler 2024-A" autoFocus {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-3">
              <FormField
                control={form.control}
                name="program"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Program</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
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
                name="tipe"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipe</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tipeOptions.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mode</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {modeOptions.map((m) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="lokasi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Lokasi <span className="text-muted-foreground font-normal">(opsional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="mis. Ruang 301, Gedung A" {...field} value={field.value ?? ""} />
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
          <Button type="submit" form="kelas-form" disabled={isPending}>
            {isPending ? "Menyimpan..." : mode === "edit" ? "Simpan Perubahan" : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
