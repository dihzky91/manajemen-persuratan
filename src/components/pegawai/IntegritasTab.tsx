"use client";

import { useEffect, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { integritasSchema, type IntegritasInput } from "@/lib/validators/pegawai.schema";
import { getIntegritas, upsertIntegritas } from "@/server/actions/pegawai";

export function IntegritasTab({
  userId,
  canEdit,
}: {
  userId: string;
  canEdit: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<IntegritasInput>({
    resolver: zodResolver(integritasSchema),
    defaultValues: {
      userId,
      tanggalPernyataan: "",
      statusTandaTangan: false,
      catatan: "",
    },
  });

  useEffect(() => {
    getIntegritas(userId).then((data) => {
      if (data) {
        form.reset({
          userId,
          tanggalPernyataan: data.tanggalPernyataan ?? "",
          statusTandaTangan: data.statusTandaTangan ?? false,
          catatan: data.catatan ?? "",
        });
      }
    });
  }, [userId, form]);

  function onSubmit(values: IntegritasInput) {
    startTransition(async () => {
      try {
        await upsertIntegritas({
          ...values,
          tanggalPernyataan: values.tanggalPernyataan || undefined,
          catatan: values.catatan || undefined,
        });
        toast.success("Data integritas diperbarui.");
      } catch {
        toast.error("Gagal menyimpan data integritas.");
      }
    });
  }

  const isSigned = form.watch("statusTandaTangan");

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-muted/30 px-4 py-4 text-sm text-muted-foreground">
        Pernyataan integritas pegawai dicatat di sini. Upload dokumen fisik akan tersedia setelah integrasi storage siap.
      </div>

      <Form {...form}>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField control={form.control} name="tanggalPernyataan" render={({ field }) => (
            <FormItem className="max-w-xs">
              <FormLabel>Tanggal Pernyataan</FormLabel>
              <FormControl>
                <Input type="date" {...field} value={field.value ?? ""} disabled={!canEdit || isPending} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="statusTandaTangan" render={({ field }) => (
            <FormItem>
              <FormLabel className="sr-only">Status Tanda Tangan</FormLabel>
              <FormControl>
                <label
                  className={`flex cursor-pointer items-center gap-4 rounded-2xl border px-4 py-4 transition-colors ${
                    isSigned
                      ? "border-primary/40 bg-primary/5"
                      : "border-border bg-background"
                  } ${(!canEdit || isPending) ? "cursor-default opacity-60" : ""}`}
                >
                  <Checkbox
                    checked={field.value ?? false}
                    onCheckedChange={field.onChange}
                    disabled={!canEdit || isPending}
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">Sudah Ditandatangani</p>
                    <p className="text-xs text-muted-foreground">Centang jika pegawai sudah menandatangani pernyataan integritas</p>
                  </div>
                </label>
              </FormControl>
            </FormItem>
          )} />

          <FormField control={form.control} name="catatan" render={({ field }) => (
            <FormItem>
              <FormLabel>Catatan</FormLabel>
              <FormControl>
                <Textarea {...field} value={field.value ?? ""} rows={4} disabled={!canEdit || isPending} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          {canEdit ? (
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isPending}>
                {isPending ? "Menyimpan..." : "Simpan Data Integritas"}
              </Button>
            </div>
          ) : null}
        </form>
      </Form>
    </div>
  );
}
