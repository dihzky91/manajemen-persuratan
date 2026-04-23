"use client";

import { useState, useTransition, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Send,
  Eye,
  Archive,
  CheckCircle2,
  XCircle,
  Hash,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatTanggal } from "@/lib/utils";
import {
  ajukanPersetujuan,
  mulaiReviu,
  setujuiSurat,
  tolakSurat,
  selesaikanSurat,
  batalkanSurat,
  assignNomorSuratKeluar,
  uploadSuratKeluarFinal,
} from "@/server/actions/suratKeluar";
import type { SuratKeluarRow } from "@/server/actions/suratKeluar";

const STEPS = [
  { key: "draft", label: "Draft Surat", icon: FileText },
  {
    key: "permohonan_persetujuan",
    label: "Permohonan Persetujuan",
    icon: Send,
  },
  { key: "reviu", label: "Proses Reviu", icon: Eye },
  { key: "pengarsipan", label: "Pengarsipan", icon: Archive },
  { key: "selesai", label: "Selesai", icon: CheckCircle2 },
] as const;

function stepIndex(status: string): number {
  return STEPS.findIndex((s) => s.key === status);
}

export const JENIS_SURAT_LABEL: Record<string, string> = {
  undangan: "Undangan",
  pemberitahuan: "Pemberitahuan",
  permohonan: "Permohonan",
  keputusan: "Keputusan",
  mou: "MOU",
  balasan: "Balasan",
  edaran: "Edaran",
  keterangan: "Keterangan",
  tugas: "Tugas",
  lainnya: "Lainnya",
};

export const STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  draft: {
    label: "Draft",
    className: "bg-secondary text-secondary-foreground border-border",
  },
  permohonan_persetujuan: {
    label: "Menunggu Persetujuan",
    className:
      "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  },
  reviu: {
    label: "Proses Reviu",
    className:
      "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  },
  pengarsipan: {
    label: "Pengarsipan",
    className:
      "bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800",
  },
  selesai: {
    label: "Selesai",
    className:
      "bg-green-50 text-green-700 border border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
  },
  dibatalkan: {
    label: "Dibatalkan",
    className:
      "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
  },
};

interface SuratKeluarStepperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: SuratKeluarRow;
  role: string | null;
  onEditClick: () => void;
}

export function SuratKeluarStepper({
  open,
  onOpenChange,
  row,
  role,
  onEditClick,
}: SuratKeluarStepperProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showTolakForm, setShowTolakForm] = useState(false);
  const [catatanReviu, setCatatanReviu] = useState("");
  const [finalFile, setFinalFile] = useState<File | null>(null);

  const status = row.status ?? "draft";
  const isAdmin = role === "admin";
  const isPejabat = role === "pejabat" || role === "admin";
  const currentStep = stepIndex(status);
  const isCancelled = status === "dibatalkan";

  function runAction(action: () => Promise<{ ok: boolean; error?: string }>) {
    startTransition(async () => {
      try {
        const res = await action();
        if (!res.ok) {
          toast.error(res.error ?? "Terjadi kesalahan.");
          return;
        }

        toast.success("Status surat berhasil diperbarui.");
        router.refresh();
        onOpenChange(false);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Terjadi kesalahan.");
      }
    });
  }

  function handleTolak() {
    if (!catatanReviu.trim()) {
      toast.error("Catatan reviu wajib diisi sebelum menolak.");
      return;
    }

    runAction(() => tolakSurat({ id: row.id, catatanReviu }));
    setShowTolakForm(false);
    setCatatanReviu("");
  }

  function handleGenerateNomor() {
    runAction(() => assignNomorSuratKeluar({ id: row.id }));
  }

  function handleUploadFinal() {
    if (!finalFile) {
      toast.error("Pilih file final terlebih dahulu.");
      return;
    }

    startTransition(async () => {
      try {
        const dataUrl = await fileToDataUrl(finalFile);
        const res = await uploadSuratKeluarFinal({
          id: row.id,
          fileName: finalFile.name,
          contentType: finalFile.type || "application/octet-stream",
          dataUrl,
        });

        if (!res.ok) {
          toast.error(res.error ?? "Upload file final gagal.");
          return;
        }

        toast.success("File final surat berhasil diunggah.");
        setFinalFile(null);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Upload file final gagal.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detail Surat Keluar</DialogTitle>
          <DialogDescription>{row.perihal}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg border bg-muted/30 p-4 text-sm">
          <div>
            <span className="text-muted-foreground">Tujuan</span>
            <p className="font-medium">{row.tujuan}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Tanggal Surat</span>
            <p className="font-medium">{formatTanggal(row.tanggalSurat)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Jenis Surat</span>
            <p className="font-medium">
              {JENIS_SURAT_LABEL[row.jenisSurat] ?? row.jenisSurat}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Divisi</span>
            <p className="font-medium">{row.divisiNama ?? "-"}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Pembuat</span>
            <p className="font-medium">{row.dibuatOlehNama ?? "-"}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Draft Surat</span>
            {row.fileDraftUrl ? (
              <a
                href={row.fileDraftUrl}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-primary underline underline-offset-2"
              >
                Buka draft
              </a>
            ) : (
              <p className="font-medium">Belum dilampirkan</p>
            )}
          </div>
          <div>
            <span className="text-muted-foreground">Lampiran</span>
            {row.lampiranUrl ? (
              <a
                href={row.lampiranUrl}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-primary underline underline-offset-2"
              >
                Buka lampiran
              </a>
            ) : (
              <p className="font-medium">Belum dilampirkan</p>
            )}
          </div>
          <div>
            <span className="text-muted-foreground">File Final</span>
            {row.fileFinalUrl ? (
              <a
                href={row.fileFinalUrl}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-primary underline underline-offset-2"
              >
                Buka file final
              </a>
            ) : (
              <p className="font-medium">Belum diunggah</p>
            )}
          </div>
          {row.tujuanAlamat ? (
            <div className="col-span-2">
              <span className="text-muted-foreground">Alamat Tujuan</span>
              <p className="font-medium">{row.tujuanAlamat}</p>
            </div>
          ) : null}
          {row.isiSingkat ? (
            <div className="col-span-2">
              <span className="text-muted-foreground">Isi Singkat</span>
              <p className="font-medium">{row.isiSingkat}</p>
            </div>
          ) : null}
          {row.nomorSurat ? (
            <div className="col-span-2">
              <span className="text-muted-foreground">Nomor Surat</span>
              <p className="font-mono font-semibold text-primary">
                {row.nomorSurat}
              </p>
            </div>
          ) : null}
        </div>

        {row.catatanReviu && status === "draft" ? (
          <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">Catatan Reviu</p>
              <p className="mt-0.5">{row.catatanReviu}</p>
            </div>
          </div>
        ) : null}

        {!isCancelled ? (
          <div className="relative flex items-start justify-between gap-2">
            {STEPS.map((step, idx) => {
              const isDone = currentStep > idx;
              const isCurrent = currentStep === idx;
              const Icon = step.icon;

              return (
                <div
                  key={step.key}
                  className="relative flex flex-1 flex-col items-center gap-1"
                >
                  {idx < STEPS.length - 1 ? (
                    <div
                      className={cn(
                        "absolute left-1/2 top-4 h-0.5 w-full",
                        isDone ? "bg-primary" : "bg-border",
                      )}
                    />
                  ) : null}

                  <div
                    className={cn(
                      "relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 bg-background",
                      isDone
                        ? "border-primary bg-primary text-primary-foreground"
                        : isCurrent
                          ? "border-primary text-primary"
                          : "border-border text-muted-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  <span
                    className={cn(
                      "text-center text-[11px] leading-tight",
                      isCurrent
                        ? "font-semibold text-primary"
                        : isDone
                          ? "text-muted-foreground"
                          : "text-muted-foreground/60",
                    )}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            <XCircle className="h-4 w-4 shrink-0" />
            <span className="font-medium">Surat ini telah dibatalkan.</span>
          </div>
        )}

        <div className="space-y-3 rounded-lg border bg-card p-4">
          <p className="text-sm font-medium text-muted-foreground">
            Aksi tersedia
          </p>

          {status === "draft" && (
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  onEditClick();
                }}
              >
                Edit Surat
              </Button>
              {!row.fileDraftUrl ? (
                <p className="basis-full text-xs text-amber-700 dark:text-amber-300">
                  Draft surat belum dilampirkan. Tambahkan URL draft bila
                  dokumen sudah tersedia sebelum diajukan.
                </p>
              ) : null}
              <Button
                size="sm"
                onClick={() => runAction(() => ajukanPersetujuan({ id: row.id }))}
                disabled={isPending}
              >
                <Send className="mr-1.5 h-3.5 w-3.5" />
                Ajukan Persetujuan
              </Button>
              {isAdmin ? (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => runAction(() => batalkanSurat({ id: row.id }))}
                  disabled={isPending}
                >
                  Batalkan Surat
                </Button>
              ) : null}
            </div>
          )}

          {status === "permohonan_persetujuan" && (
            <div className="flex flex-wrap gap-2">
              {isPejabat ? (
                <Button
                  size="sm"
                  onClick={() => runAction(() => mulaiReviu({ id: row.id }))}
                  disabled={isPending}
                >
                  <Eye className="mr-1.5 h-3.5 w-3.5" />
                  Mulai Reviu
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Menunggu pejabat memulai proses reviu.
                </p>
              )}
              {isAdmin ? (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => runAction(() => batalkanSurat({ id: row.id }))}
                  disabled={isPending}
                >
                  Batalkan Surat
                </Button>
              ) : null}
            </div>
          )}

          {status === "reviu" && (
            <div className="space-y-3">
              {isPejabat ? (
                <>
                  {!showTolakForm ? (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        onClick={() => runAction(() => setujuiSurat({ id: row.id }))}
                        disabled={isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                        Setujui
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setShowTolakForm(true)}
                        disabled={isPending}
                      >
                        Tolak / Minta Revisi
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Tuliskan catatan revisi yang diperlukan..."
                        rows={3}
                        value={catatanReviu}
                        onChange={(e) => setCatatanReviu(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={handleTolak}
                          disabled={isPending}
                        >
                          Kirim Penolakan
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setShowTolakForm(false);
                            setCatatanReviu("");
                          }}
                        >
                          Batal
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Pejabat sedang meninjau surat ini.
                </p>
              )}
            </div>
          )}

          {status === "pengarsipan" && (
            <div className="space-y-3">
              {isPejabat ? (
                <div className="space-y-2">
                  {row.nomorSurat ? (
                    <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
                      <Hash className="h-4 w-4 text-primary" />
                      <span className="font-mono text-sm font-semibold">
                        {row.nomorSurat}
                      </span>
                      <Badge
                        variant="outline"
                        className="ml-auto text-xs text-green-600"
                      >
                        Nomor Tergenerate
                      </Badge>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleGenerateNomor}
                      disabled={isPending}
                    >
                      <Hash className="mr-1.5 h-3.5 w-3.5" />
                      Generate Nomor Surat
                    </Button>
                  )}

                  <div className="space-y-2 rounded-md border bg-muted/30 p-3">
                    <p className="text-xs font-medium text-muted-foreground">
                      Upload File Final
                    </p>
                    <Input
                      type="file"
                      accept=".pdf,.doc,.docx,image/jpeg,image/png,image/webp"
                      onChange={(event: ChangeEvent<HTMLInputElement>) =>
                        setFinalFile(event.target.files?.[0] ?? null)
                      }
                    />
                    {finalFile ? (
                      <p className="text-xs text-foreground">
                        File dipilih: {finalFile.name}
                      </p>
                    ) : null}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleUploadFinal}
                      disabled={isPending || !finalFile}
                    >
                      Upload File Final
                    </Button>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => runAction(() => selesaikanSurat({ id: row.id }))}
                    disabled={isPending || !row.nomorSurat}
                    className="bg-green-600 hover:bg-green-700"
                    title={
                      !row.nomorSurat
                        ? "Generate nomor surat terlebih dahulu"
                        : undefined
                    }
                  >
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                    Selesaikan Pengarsipan
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Proses pengarsipan sedang berlangsung.
                </p>
              )}
            </div>
          )}

          {status === "selesai" && (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              <span className="font-medium">
                Surat telah selesai diarsipkan.
              </span>
            </div>
          )}

          {status === "dibatalkan" && (
            <p className="text-sm text-muted-foreground">
              Surat ini telah dibatalkan dan tidak dapat diproses lebih lanjut.
            </p>
          )}
        </div>
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
