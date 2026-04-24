"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createSuratKeputusan,
  updateSuratKeputusan,
  uploadSuratKeputusanFile,
  type SuratKeputusanRow,
} from "@/server/actions/suratKeputusan";
import { optionalFileUrlSchema } from "@/lib/validators/fileUrl";
import { getTodayIsoInJakarta } from "@/lib/utils";

const formSchema = z.object({
  nomorSK: z.string().min(1, "Nomor SK wajib diisi"),
  perihal: z.string().min(1, "Perihal wajib diisi"),
  tentang: z.string().min(1, "Tentang wajib diisi"),
  tanggalSK: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
  tanggalBerlaku: z.string().optional(),
  tanggalBerakhir: z.string().optional(),
  pejabatId: z.string().optional(),
  fileUrl: optionalFileUrlSchema,
});

type FormValues = z.infer<typeof formSchema>;

function todayISO() {
  return getTodayIsoInJakarta();
}

export function SuratKeputusanForm({
  open,
  onOpenChange,
  mode,
  initialData,
  pejabatList,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initialData?: SuratKeputusanRow | null;
  pejabatList: Array<{ id: number; namaJabatan: string }>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nomorSK: "",
      perihal: "",
      tentang: "",
      tanggalSK: todayISO(),
      tanggalBerlaku: "",
      tanggalBerakhir: "",
      pejabatId: "__none__",
      fileUrl: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && initialData) {
      setSelectedFile(null);
      form.reset({
        nomorSK: initialData.nomorSK,
        perihal: initialData.perihal,
        tentang: initialData.tentang,
        tanggalSK: initialData.tanggalSK,
        tanggalBerlaku: initialData.tanggalBerlaku ?? "",
        tanggalBerakhir: initialData.tanggalBerakhir ?? "",
        pejabatId: initialData.pejabatId ? String(initialData.pejabatId) : "__none__",
        fileUrl: initialData.fileUrl ?? "",
      });
      return;
    }

    setSelectedFile(null);
    form.reset({
      nomorSK: "",
      perihal: "",
      tentang: "",
      tanggalSK: todayISO(),
      tanggalBerlaku: "",
      tanggalBerakhir: "",
      pejabatId: "__none__",
      fileUrl: "",
    });
  }, [form, initialData, mode, open]);

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      try {
        let uploadedFileUrl = values.fileUrl || undefined;

        if (selectedFile) {
          const dataUrl = await fileToDataUrl(selectedFile);
          const uploadResult = await uploadSuratKeputusanFile({
            fileName: selectedFile.name,
            contentType: selectedFile.type || "application/octet-stream",
            dataUrl,
          });

          if (!uploadResult.ok) {
            toast.error("Upload file Surat Keputusan gagal.");
            return;
          }

          uploadedFileUrl = uploadResult.data.url;
        }

        const payload = {
          nomorSK: values.nomorSK,
          perihal: values.perihal,
          tentang: values.tentang,
          tanggalSK: values.tanggalSK,
          tanggalBerlaku: values.tanggalBerlaku || undefined,
          tanggalBerakhir: values.tanggalBerakhir || undefined,
          pejabatId:
            values.pejabatId && values.pejabatId !== "__none__"
              ? Number(values.pejabatId)
              : undefined,
          fileUrl: uploadedFileUrl,
        };

        const result =
          mode === "edit" && initialData
            ? await updateSuratKeputusan({ ...payload, id: initialData.id })
            : await createSuratKeputusan(payload);

        if (!result.ok) {
          toast.error(result.error);
          return;
        }

        toast.success(
          mode === "edit"
            ? "Surat Keputusan diperbarui."
            : "Surat Keputusan berhasil dibuat.",
        );
        router.refresh();
        onOpenChange(false);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Gagal menyimpan Surat Keputusan.",
        );
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Ubah Surat Keputusan" : "Tambah Surat Keputusan"}
          </DialogTitle>
          <DialogDescription>
            Tanggal SK tetap bersifat manual dan mendukung backdate sesuai kebutuhan administrasi.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form id="surat-keputusan-form" className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="nomorSK"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nomor SK</FormLabel>
                    <FormControl>
                      <Input autoFocus placeholder="Mis. 001/SK/IAI-DKIJKT/IV/2026" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tanggalSK"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tanggal SK</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="perihal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Perihal</FormLabel>
                  <FormControl>
                    <Input placeholder="Perihal surat keputusan" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tentang"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tentang</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Pokok keputusan yang ditetapkan" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="tanggalBerlaku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tanggal Berlaku</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tanggalBerakhir"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tanggal Berakhir</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="pejabatId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pejabat Penandatangan</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? "__none__"}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih pejabat" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="__none__">Tidak dipilih</SelectItem>
                      {pejabatList.map((item) => (
                        <SelectItem key={item.id} value={String(item.id)}>
                          {item.namaJabatan}
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
              name="fileUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>File Dokumen</FormLabel>
                  <FormControl>
                    <div className="space-y-3">
                      <Input
                        type="file"
                        accept=".pdf,.doc,.docx,image/jpeg,image/png,image/webp"
                        onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                      />
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        placeholder="Atau isi URL file manual"
                      />
                    </div>
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Upload PDF, DOC, DOCX, atau gambar langsung, atau isi URL manual bila dokumen sudah tersedia.
                  </p>
                  {selectedFile ? (
                    <p className="text-xs text-foreground">File dipilih: {selectedFile.name}</p>
                  ) : null}
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Batal
          </Button>
          <Button type="submit" form="surat-keputusan-form" disabled={isPending}>
            {isPending ? "Menyimpan..." : mode === "edit" ? "Simpan Perubahan" : "Simpan SK"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Gagal membaca file."));
    };
    reader.onerror = () => reject(reader.error ?? new Error("Gagal membaca file."));
    reader.readAsDataURL(file);
  });
}
