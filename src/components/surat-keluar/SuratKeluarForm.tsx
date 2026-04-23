"use client";

import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { createSuratKeluar, updateSuratKeluar } from "@/server/actions/suratKeluar";
import type { SuratKeluarRow, PejabatOption, DivisiOption } from "@/server/actions/suratKeluar";

// ─── Constants ────────────────────────────────────────────────────────────────

const JENIS_SURAT = [
  { value: "undangan", label: "Undangan" },
  { value: "pemberitahuan", label: "Pemberitahuan" },
  { value: "permohonan", label: "Permohonan" },
  { value: "keputusan", label: "Keputusan" },
  { value: "mou", label: "MOU" },
  { value: "balasan", label: "Balasan" },
  { value: "edaran", label: "Edaran" },
  { value: "keterangan", label: "Keterangan" },
  { value: "tugas", label: "Tugas" },
  { value: "lainnya", label: "Lainnya" },
] as const;

const JENIS_SURAT_VALUES = JENIS_SURAT.map((j) => j.value) as [
  string,
  ...string[],
];

// ─── Form schema (string IDs, transformed before submitting) ──────────────────

const formSchema = z.object({
  perihal: z.string().min(1, "Perihal wajib diisi"),
  tujuan: z.string().min(1, "Tujuan wajib diisi"),
  tujuanAlamat: z.string().optional(),
  tanggalSurat: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
  jenisSurat: z.enum(JENIS_SURAT_VALUES as [string, ...string[]]),
  isiSingkat: z.string().optional(),
  fileDraftUrl: z
    .string()
    .url("URL draft harus berupa URL yang valid")
    .or(z.literal(""))
    .optional(),
  pejabatId: z.string().optional(),
  divisiId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// ─── Component ────────────────────────────────────────────────────────────────

interface SuratKeluarFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initialData?: SuratKeluarRow | null;
  pejabatList: PejabatOption[];
  divisiList: DivisiOption[];
}

function todayISO() {
  return new Date().toISOString().split("T")[0]!;
}

export function SuratKeluarForm({
  open,
  onOpenChange,
  mode,
  initialData,
  pejabatList,
  divisiList,
}: SuratKeluarFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      perihal: "",
      tujuan: "",
      tujuanAlamat: "",
      tanggalSurat: todayISO(),
      jenisSurat: "undangan",
      isiSingkat: "",
      fileDraftUrl: "",
      pejabatId: "__none__",
      divisiId: "__none__",
    },
  });

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && initialData) {
      form.reset({
        perihal: initialData.perihal,
        tujuan: initialData.tujuan,
        tujuanAlamat: initialData.tujuanAlamat ?? "",
        tanggalSurat: initialData.tanggalSurat,
        jenisSurat: initialData.jenisSurat,
        isiSingkat: initialData.isiSingkat ?? "",
        fileDraftUrl: initialData.fileDraftUrl ?? "",
        pejabatId: initialData.pejabatId ? String(initialData.pejabatId) : "__none__",
        divisiId: initialData.divisiId ? String(initialData.divisiId) : "__none__",
      });
    } else {
      form.reset({
        perihal: "",
        tujuan: "",
        tujuanAlamat: "",
        tanggalSurat: todayISO(),
        jenisSurat: "undangan",
        isiSingkat: "",
        fileDraftUrl: "",
        pejabatId: "__none__",
        divisiId: "__none__",
      });
    }
  }, [open, mode, initialData, form]);

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const payload = {
        ...values,
        pejabatId:
          values.pejabatId && values.pejabatId !== "__none__"
            ? parseInt(values.pejabatId)
            : undefined,
        divisiId:
          values.divisiId && values.divisiId !== "__none__"
            ? parseInt(values.divisiId)
            : undefined,
        tujuanAlamat: values.tujuanAlamat || undefined,
        isiSingkat: values.isiSingkat || undefined,
        fileDraftUrl: values.fileDraftUrl || undefined,
      };

      const res =
        mode === "edit" && initialData
          ? await updateSuratKeluar({ ...payload, id: initialData.id })
          : await createSuratKeluar(payload);

      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(
        mode === "edit" ? "Surat keluar diperbarui." : "Surat keluar dibuat.",
      );
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Ubah Surat Keluar" : "Buat Surat Keluar"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Perbarui data surat. Hanya bisa diubah saat status Draft."
              : "Isi data surat keluar baru. Tanggal surat dapat diisi bebas (termasuk backdate)."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            id="surat-keluar-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            {/* Perihal */}
            <FormField
              control={form.control}
              name="perihal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Perihal</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="mis. Undangan Rapat Koordinasi"
                      autoFocus
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tujuan */}
            <FormField
              control={form.control}
              name="tujuan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tujuan</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="mis. Direktur Eksekutif IAI DKI Jakarta"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tujuan Alamat */}
            <FormField
              control={form.control}
              name="tujuanAlamat"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Alamat Tujuan{" "}
                    <span className="text-muted-foreground font-normal">
                      (opsional)
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Alamat lengkap penerima surat..."
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tanggal Surat + Jenis Surat */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="tanggalSurat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tanggal Surat</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="jenisSurat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jenis Surat</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Pilih jenis" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {JENIS_SURAT.map((j) => (
                          <SelectItem key={j.value} value={j.value}>
                            {j.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Isi Singkat */}
            <FormField
              control={form.control}
              name="isiSingkat"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Isi Singkat{" "}
                    <span className="text-muted-foreground font-normal">
                      (opsional)
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ringkasan isi surat..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fileDraftUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    URL Draft Surat{" "}
                    <span className="text-muted-foreground font-normal">
                      (opsional)
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://contoh.com/draft-surat.pdf"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Pejabat + Divisi */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="pejabatId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Pejabat{" "}
                      <span className="text-muted-foreground font-normal">
                        (opsional)
                      </span>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? "__none__"}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Pilih pejabat" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">— Tidak dipilih —</SelectItem>
                        {pejabatList.map((p) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.namaJabatan}
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
                name="divisiId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Divisi Pengirim{" "}
                      <span className="text-muted-foreground font-normal">
                        (opsional)
                      </span>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? "__none__"}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Pilih divisi" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">— Tidak dipilih —</SelectItem>
                        {divisiList.map((d) => (
                          <SelectItem key={d.id} value={String(d.id)}>
                            {d.nama}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
          <Button
            type="submit"
            form="surat-keluar-form"
            disabled={isPending}
          >
            {isPending
              ? "Menyimpan..."
              : mode === "edit"
                ? "Simpan Perubahan"
                : "Buat Surat"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
