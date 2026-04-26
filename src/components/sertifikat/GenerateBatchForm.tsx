"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Hash } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { generateBatch } from "@/server/actions/sertifikat/nomor/batches";
import type { CertificateProgramRow } from "@/server/actions/sertifikat/nomor/programs";
import type { CertificateClassTypeRow } from "@/server/actions/sertifikat/nomor/classTypes";

// ─── Schema & Types ───────────────────────────────────────────────────────────

const formSchema = z.object({
  programId:   z.string().min(1, "Program wajib dipilih."),
  classTypeId: z.string().min(1, "Jenis kelas wajib dipilih."),
  angkatan:    z.coerce.number().int().min(100, "Angkatan minimal 3 digit (contoh: 223).").max(999),
  quantity:    z.coerce.number().int().min(1, "Minimal 1 sertifikat.").max(1000, "Maksimal 1000 per batch."),
  notes:       z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

function FormError({ message }: { message?: string }) {
  return message ? <p className="text-xs text-destructive mt-1">{message}</p> : null;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface GenerateBatchFormProps {
  programs:   CertificateProgramRow[];
  classTypes: CertificateClassTypeRow[];
  lastSerial: number;
}

// ─── Preview Nomor ────────────────────────────────────────────────────────────

function previewNumbers(
  angkatan: number | undefined,
  classTypeCode: string | undefined,
  quantity: number | undefined,
  lastSerial: number,
) {
  if (!angkatan || !classTypeCode || !quantity) return null;
  const ang  = String(angkatan).padStart(3, "0");
  const start = lastSerial + 1;
  const end   = lastSerial + quantity;
  return {
    first: `${ang}${classTypeCode}.${start}`,
    last:  `${ang}${classTypeCode}.${end}`,
    start,
    end,
  };
}

// ─── Komponen ─────────────────────────────────────────────────────────────────

export function GenerateBatchForm({ programs, classTypes, lastSerial }: GenerateBatchFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedClassType, setSelectedClassType] = useState<CertificateClassTypeRow | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      programId:   "",
      classTypeId: "",
      angkatan:    undefined,
      quantity:    undefined,
      notes:       "",
    },
  });

  const watchAngkatan  = form.watch("angkatan");
  const watchQuantity  = form.watch("quantity");
  const preview = previewNumbers(watchAngkatan, selectedClassType?.code, watchQuantity, lastSerial);

  function handleSubmit(values: FormValues) {
    if (!selectedClassType) {
      toast.error("Jenis kelas tidak valid.");
      return;
    }

    startTransition(async () => {
      const result = await generateBatch({
        programId:     values.programId,
        classTypeId:   values.classTypeId,
        classTypeCode: selectedClassType.code,
        angkatan:      values.angkatan,
        quantity:      values.quantity,
      });

      if (result.ok) {
        toast.success(
          `Batch berhasil digenerate! Nomor ${result.data.firstNumber} s/d ${result.data.lastNumber}.`,
        );
        router.push(`/sertifikat/nomor/${result.data.batch.id}`);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-primary" />
            Generate Batch Nomor Sertifikat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
            {/* Program */}
            <div className="space-y-1.5">
              <Label>Program Pelatihan</Label>
              <Select
                value={form.watch("programId")}
                onValueChange={(v) => form.setValue("programId", v, { shouldValidate: true })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih program…" />
                </SelectTrigger>
                <SelectContent>
                  {programs.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormError message={form.formState.errors.programId?.message} />
            </div>

            {/* Angkatan */}
            <div className="space-y-1.5">
              <Label>Angkatan</Label>
              <Input
                type="number"
                placeholder="Contoh: 223"
                min={100}
                max={999}
                {...form.register("angkatan")}
              />
              <p className="text-xs text-muted-foreground">
                3 digit angka — contoh 223 = angkatan ke-223
              </p>
              <FormError message={form.formState.errors.angkatan?.message} />
            </div>

            {/* Jenis Kelas */}
            <div className="space-y-1.5">
              <Label>Jenis Kelas</Label>
              <Select
                value={form.watch("classTypeId")}
                onValueChange={(v) => {
                  form.setValue("classTypeId", v, { shouldValidate: true });
                  setSelectedClassType(classTypes.find((ct) => ct.id === v) ?? null);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih jenis kelas…" />
                </SelectTrigger>
                <SelectContent>
                  {classTypes.map((ct) => (
                    <SelectItem key={ct.id} value={ct.id}>
                      {ct.name}{" "}
                      <span className="font-mono text-xs text-muted-foreground">
                        (kode: {ct.code})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormError message={form.formState.errors.classTypeId?.message} />
            </div>

            {/* Jumlah */}
            <div className="space-y-1.5">
              <Label>Jumlah Sertifikat</Label>
              <Input
                type="number"
                placeholder="Contoh: 30"
                min={1}
                max={1000}
                {...form.register("quantity")}
              />
              <FormError message={form.formState.errors.quantity?.message} />
            </div>

            {/* Catatan */}
            <div className="space-y-1.5">
              <Label>
                Catatan{" "}
                <span className="text-muted-foreground font-normal">(opsional)</span>
              </Label>
              <Textarea
                placeholder="Keterangan tambahan untuk batch ini…"
                {...form.register("notes")}
              />
            </div>

            {/* Preview nomor */}
            {preview ? (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                <p className="text-sm font-semibold text-primary">Preview Nomor Sertifikat</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg border bg-card p-3">
                    <p className="text-xs text-muted-foreground mb-1">Nomor Pertama</p>
                    <p className="font-mono font-semibold text-base">{preview.first}</p>
                    <p className="text-xs text-muted-foreground mt-1">Serial #{preview.start}</p>
                  </div>
                  <div className="rounded-lg border bg-card p-3">
                    <p className="text-xs text-muted-foreground mb-1">Nomor Terakhir</p>
                    <p className="font-mono font-semibold text-base">{preview.last}</p>
                    <p className="text-xs text-muted-foreground mt-1">Serial #{preview.end}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Serial global saat ini: <span className="font-mono">{lastSerial}</span>.
                  Batch baru akan menggunakan serial{" "}
                  <span className="font-mono">{preview.start}</span> s/d{" "}
                  <span className="font-mono">{preview.end}</span>.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
                Lengkapi Angkatan, Jenis Kelas, dan Jumlah untuk melihat preview nomor.
              </div>
            )}

            <div className="flex gap-3 justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/sertifikat/nomor")}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Generate Batch
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
