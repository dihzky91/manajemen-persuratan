"use client";

import { useEffect, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { optionalFileUrlSchema } from "@/lib/validators/fileUrl";
import {
  createPejabat,
  type PejabatRow,
  updatePejabat,
} from "@/server/actions/pejabat";

const formSchema = z.object({
  userId: z.string(),
  namaJabatan: z.string().min(1, "Nama jabatan wajib diisi."),
  wilayah: z.string().optional(),
  ttdUrl: optionalFileUrlSchema,
  isActive: z.enum(["true", "false"]),
});

type FormValues = z.infer<typeof formSchema>;

export function PejabatForm({
  open,
  onOpenChange,
  mode,
  initialData,
  userOptions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initialData?: PejabatRow | null;
  userOptions: Array<{ id: string; label: string }>;
}) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: "__none__",
      namaJabatan: "",
      wilayah: "",
      ttdUrl: "",
      isActive: "true",
    },
  });

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && initialData) {
      form.reset({
        userId: initialData.userId ?? "__none__",
        namaJabatan: initialData.namaJabatan,
        wilayah: initialData.wilayah ?? "",
        ttdUrl: initialData.ttdUrl ?? "",
        isActive: initialData.isActive === false ? "false" : "true",
      });
      return;
    }

    form.reset({
      userId: "__none__",
      namaJabatan: "",
      wilayah: "",
      ttdUrl: "",
      isActive: "true",
    });
  }, [form, initialData, mode, open]);

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const payload = {
        userId: values.userId !== "__none__" ? values.userId : undefined,
        namaJabatan: values.namaJabatan,
        wilayah: values.wilayah || undefined,
        ttdUrl: values.ttdUrl || undefined,
        isActive: values.isActive === "true",
      };

      const result =
        mode === "edit" && initialData
          ? await updatePejabat({ ...payload, id: initialData.id })
          : await createPejabat(payload);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(
        mode === "edit"
          ? "Data pejabat berhasil diperbarui."
          : "Pejabat penandatangan berhasil ditambahkan.",
      );
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit"
              ? "Ubah Pejabat Penandatangan"
              : "Tambah Pejabat Penandatangan"}
          </DialogTitle>
          <DialogDescription>
            Data pejabat ini akan menjadi referensi pada modul surat keluar dan
            dokumen lanjutan.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            id="pejabat-form"
            className="space-y-4"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name="namaJabatan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Jabatan</FormLabel>
                  <FormControl>
                    <Input
                      autoFocus
                      placeholder="Mis. Direktur Eksekutif IAI Wilayah Jakarta"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pegawai Terkait</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih pegawai" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="__none__">
                        Tidak dihubungkan
                      </SelectItem>
                      {userOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="wilayah"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wilayah</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Mis. DKI Jakarta"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="true">Aktif</SelectItem>
                        <SelectItem value="false">Nonaktif</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="ttdUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL Tanda Tangan</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Opsional, bisa berupa URL atau path lokal /uploads/..."
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Field ini disiapkan untuk integrasi dokumen lanjutan. Boleh
                    dikosongkan untuk sekarang.
                  </p>
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
          <Button type="submit" form="pejabat-form" disabled={isPending}>
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
