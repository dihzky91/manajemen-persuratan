"use client";

import { useEffect, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { kelengkapanSchema, type KelengkapanInput } from "@/lib/validators/pegawai.schema";
import { getKelengkapan, upsertKelengkapan } from "@/server/actions/pegawai";

const FIELDS: { name: keyof Omit<KelengkapanInput, "userId">; label: string }[] = [
  { name: "fotoUrl", label: "URL Foto" },
  { name: "ktpUrl", label: "URL KTP" },
  { name: "npwpUrl", label: "URL NPWP" },
  { name: "bpjsUrl", label: "URL BPJS" },
  { name: "ijazahUrl", label: "URL Ijazah" },
  { name: "dokumenLainUrl", label: "URL Dokumen Lain" },
];

export function KelengkapanTab({
  userId,
  canEdit,
}: {
  userId: string;
  canEdit: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<KelengkapanInput>({
    resolver: zodResolver(kelengkapanSchema),
    defaultValues: {
      userId,
      fotoUrl: "",
      ktpUrl: "",
      npwpUrl: "",
      bpjsUrl: "",
      ijazahUrl: "",
      dokumenLainUrl: "",
    },
  });

  useEffect(() => {
    getKelengkapan(userId).then((data) => {
      if (data) {
        form.reset({
          userId,
          fotoUrl: data.fotoUrl ?? "",
          ktpUrl: data.ktpUrl ?? "",
          npwpUrl: data.npwpUrl ?? "",
          bpjsUrl: data.bpjsUrl ?? "",
          ijazahUrl: data.ijazahUrl ?? "",
          dokumenLainUrl: data.dokumenLainUrl ?? "",
        });
      }
    });
  }, [userId, form]);

  function onSubmit(values: KelengkapanInput) {
    startTransition(async () => {
      try {
        await upsertKelengkapan({
          ...values,
          fotoUrl: values.fotoUrl || undefined,
          ktpUrl: values.ktpUrl || undefined,
          npwpUrl: values.npwpUrl || undefined,
          bpjsUrl: values.bpjsUrl || undefined,
          ijazahUrl: values.ijazahUrl || undefined,
          dokumenLainUrl: values.dokumenLainUrl || undefined,
        });
        toast.success("Data kelengkapan diperbarui.");
      } catch {
        toast.error("Gagal menyimpan data kelengkapan.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-muted/30 px-4 py-4 text-sm text-muted-foreground">
        Input URL dokumen untuk sementara. Fitur upload langsung akan diaktifkan setelah integrasi storage siap.
      </div>

      <Form {...form}>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
          {FIELDS.map(({ name, label }) => (
            <FormField
              key={name}
              control={form.control}
              name={name}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{label}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="https://..."
                      disabled={!canEdit || isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}

          {canEdit ? (
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" disabled={isPending}>
                {isPending ? "Menyimpan..." : "Simpan Kelengkapan"}
              </Button>
            </div>
          ) : null}
        </form>
      </Form>
    </div>
  );
}
