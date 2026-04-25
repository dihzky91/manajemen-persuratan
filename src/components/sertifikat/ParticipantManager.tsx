"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Download, FileUp, Loader2, Pencil, Plus, QrCode, Trash2 } from "lucide-react";
import QRCode from "qrcode";
import { useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatTanggal } from "@/lib/utils";
import type { EventRow } from "@/server/actions/sertifikat/events";
import {
  bulkImportParticipants,
  createParticipant,
  deleteParticipant,
  updateParticipant,
  type ParticipantRow,
} from "@/server/actions/sertifikat/participants";

const participantSchema = z.object({
  noSertifikat: z.string().trim().min(1, "Nomor sertifikat wajib diisi."),
  nama: z.string().trim().min(1, "Nama peserta wajib diisi."),
  role: z.string().trim().min(1, "Role wajib diisi."),
});

type ParticipantFormValues = z.infer<typeof participantSchema>;

function toFormValues(participant?: ParticipantRow): ParticipantFormValues {
  return {
    noSertifikat: participant?.noSertifikat ?? "",
    nama: participant?.nama ?? "",
    role: participant?.role ?? "Peserta",
  };
}

function buildVerificationUrl(noSertifikat: string) {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");
  return `${baseUrl}/verifikasi/${encodeURIComponent(noSertifikat)}`;
}

async function downloadDataUrl(dataUrl: string, fileName: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function crc32(bytes: Uint8Array) {
  let crc = -1;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ -1) >>> 0;
}

function writeUint16(buffer: number[], value: number) {
  buffer.push(value & 0xff, (value >>> 8) & 0xff);
}

function writeUint32(buffer: number[], value: number) {
  buffer.push(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff);
}

function textBytes(value: string) {
  return new TextEncoder().encode(value);
}

function asBlobPart(bytes: Uint8Array) {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

function createZip(files: { name: string; bytes: Uint8Array }[]) {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = textBytes(file.name);
    const crc = crc32(file.bytes);
    const local: number[] = [];
    writeUint32(local, 0x04034b50);
    writeUint16(local, 20);
    writeUint16(local, 0);
    writeUint16(local, 0);
    writeUint16(local, 0);
    writeUint16(local, 0);
    writeUint32(local, crc);
    writeUint32(local, file.bytes.length);
    writeUint32(local, file.bytes.length);
    writeUint16(local, nameBytes.length);
    writeUint16(local, 0);
    const localHeader = new Uint8Array([...local, ...nameBytes, ...file.bytes]);
    localParts.push(localHeader);

    const central: number[] = [];
    writeUint32(central, 0x02014b50);
    writeUint16(central, 20);
    writeUint16(central, 20);
    writeUint16(central, 0);
    writeUint16(central, 0);
    writeUint16(central, 0);
    writeUint16(central, 0);
    writeUint32(central, crc);
    writeUint32(central, file.bytes.length);
    writeUint32(central, file.bytes.length);
    writeUint16(central, nameBytes.length);
    writeUint16(central, 0);
    writeUint16(central, 0);
    writeUint16(central, 0);
    writeUint16(central, 0);
    writeUint32(central, 0);
    writeUint32(central, offset);
    centralParts.push(new Uint8Array([...central, ...nameBytes]));
    offset += localHeader.length;
  }

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end: number[] = [];
  writeUint32(end, 0x06054b50);
  writeUint16(end, 0);
  writeUint16(end, 0);
  writeUint16(end, files.length);
  writeUint16(end, files.length);
  writeUint32(end, centralSize);
  writeUint32(end, offset);
  writeUint16(end, 0);

  return new Blob(
    [...localParts, ...centralParts, new Uint8Array(end)].map(asBlobPart),
    {
    type: "application/zip",
    },
  );
}

async function dataUrlToBytes(dataUrl: string) {
  const response = await fetch(dataUrl);
  return new Uint8Array(await response.arrayBuffer());
}

export function ParticipantManager({
  event,
  participants,
}: {
  event: EventRow;
  participants: ParticipantRow[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [qrParticipant, setQrParticipant] = useState<ParticipantRow | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [editingParticipant, setEditingParticipant] = useState<ParticipantRow | null>(null);
  const [isPending, startTransition] = useTransition();
  const [file, setFile] = useState<File | null>(null);

  const form = useForm<ParticipantFormValues>({
    resolver: zodResolver(participantSchema),
    defaultValues: toFormValues(),
  });

  const filteredParticipants = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return participants;
    return participants.filter(
      (participant) =>
        participant.nama.toLowerCase().includes(term) ||
        participant.noSertifikat.toLowerCase().includes(term),
    );
  }, [participants, search]);

  function openCreateDialog() {
    setEditingParticipant(null);
    form.reset(toFormValues());
    setDialogOpen(true);
  }

  function openEditDialog(participant: ParticipantRow) {
    setEditingParticipant(participant);
    form.reset(toFormValues(participant));
    setDialogOpen(true);
  }

  function submitParticipant(values: ParticipantFormValues) {
    startTransition(async () => {
      const result = editingParticipant
        ? await updateParticipant(editingParticipant.id, values)
        : await createParticipant({ ...values, eventId: event.id });

      if (result.ok) {
        toast.success(editingParticipant ? "Peserta berhasil diperbarui." : "Peserta berhasil ditambahkan.");
        setDialogOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function removeParticipant(participant: ParticipantRow) {
    if (!window.confirm(`Hapus peserta "${participant.nama}"?`)) return;
    startTransition(async () => {
      const result = await deleteParticipant(participant.id);
      if (result.ok) {
        toast.success("Peserta berhasil dihapus.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  async function openQr(participant: ParticipantRow) {
    setQrParticipant(participant);
    const dataUrl = await QRCode.toDataURL(buildVerificationUrl(participant.noSertifikat), {
      width: 320,
      margin: 2,
    });
    setQrDataUrl(dataUrl);
  }

  async function downloadQr(participant: ParticipantRow) {
    const dataUrl = await QRCode.toDataURL(buildVerificationUrl(participant.noSertifikat), {
      width: 512,
      margin: 2,
    });
    await downloadDataUrl(dataUrl, `QR-${participant.noSertifikat}.png`);
  }

  async function exportAllQr() {
    if (participants.length === 0) return;
    toast.info("Menyiapkan file QR.");
    const files = await Promise.all(
      participants.map(async (participant) => {
        const dataUrl = await QRCode.toDataURL(buildVerificationUrl(participant.noSertifikat), {
          width: 512,
          margin: 2,
        });
        return {
          name: `QR-${participant.noSertifikat.replace(/[\\/:*?"<>|]/g, "-")}.png`,
          bytes: await dataUrlToBytes(dataUrl),
        };
      }),
    );
    const zip = createZip(files);
    const url = URL.createObjectURL(zip);
    await downloadDataUrl(url, `QR-${event.id}-${event.namaKegiatan}.zip`);
    URL.revokeObjectURL(url);
  }

  function submitImport() {
    if (!file) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.append("file", file);
      const result = await bulkImportParticipants(event.id, formData);
      if (result.ok) {
        toast.success(
          `Import selesai: ${result.data.successCount}/${result.data.totalRows} berhasil.`,
        );
        if (result.data.errors.length > 0) {
          toast.warning(`${result.data.errors.length} baris gagal diproses.`);
          console.error("Import peserta gagal:", result.data.errors);
        }
        setImportOpen(false);
        setFile(null);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-xl">
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle className="text-xl">{event.namaKegiatan}</CardTitle>
              <p className="mt-2 text-sm text-muted-foreground">
                {formatTanggal(event.tanggalMulai)} - {formatTanggal(event.tanggalSelesai)}
              </p>
            </div>
            <Badge variant="secondary">{event.kategori}</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm md:grid-cols-4">
          <Info label="Lokasi" value={event.lokasi ?? "-"} />
          <Info label="SKP" value={event.skp ?? "-"} />
          <Info label="Peserta" value={String(participants.length)} />
          <Info label="Penandatangan" value={String(event.signatories.length)} />
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Peserta</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Daftar peserta dan QR verifikasi sertifikat.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={openCreateDialog}>
                <Plus className="h-4 w-4" />
                Tambah Peserta
              </Button>
              <Button type="button" variant="outline" onClick={() => setImportOpen(true)}>
                <FileUp className="h-4 w-4" />
                Import Excel/CSV
              </Button>
              <Button type="button" variant="outline" onClick={exportAllQr} disabled={participants.length === 0}>
                <Download className="h-4 w-4" />
                Export QR All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Cari nama atau nomor sertifikat"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="max-w-md"
          />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Sertifikat</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredParticipants.map((participant) => (
                <TableRow key={participant.id}>
                  <TableCell className="font-mono">{participant.noSertifikat}</TableCell>
                  <TableCell className="font-medium">{participant.nama}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{participant.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="icon-sm" onClick={() => openQr(participant)}>
                        <QrCode className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon-sm" onClick={() => openEditDialog(participant)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon-sm" onClick={() => removeParticipant(participant)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredParticipants.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Belum ada peserta.
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingParticipant ? "Edit Peserta" : "Tambah Peserta"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(submitParticipant)} className="space-y-4">
            <div className="space-y-2">
              <Label>Nomor Sertifikat</Label>
              <Input {...form.register("noSertifikat")} />
              <FormError message={form.formState.errors.noSertifikat?.message} />
            </div>
            <div className="space-y-2">
              <Label>Nama</Label>
              <Input {...form.register("nama")} />
              <FormError message={form.formState.errors.nama?.message} />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={form.watch("role")} onValueChange={(value) => form.setValue("role", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Peserta">Peserta</SelectItem>
                  <SelectItem value="Pembicara">Pembicara</SelectItem>
                  <SelectItem value="Panitia">Panitia</SelectItem>
                  <SelectItem value="Moderator">Moderator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Peserta</DialogTitle>
            <DialogDescription>
              Kolom wajib: No Sertifikat dan Nama. Kolom Role bersifat opsional.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setImportOpen(false)}>
                Batal
              </Button>
              <Button type="button" onClick={submitImport} disabled={!file || isPending}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Import
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!qrParticipant} onOpenChange={(open) => !open && setQrParticipant(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>QR Verifikasi</DialogTitle>
            <DialogDescription>{qrParticipant?.noSertifikat}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrDataUrl} alt="QR verifikasi" className="h-64 w-64" />
            ) : null}
            {qrParticipant ? (
              <Button type="button" onClick={() => downloadQr(qrParticipant)}>
                <Download className="h-4 w-4" />
                Download PNG
              </Button>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/25 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 truncate font-medium">{value}</p>
    </div>
  );
}

function FormError({ message }: { message?: string }) {
  return message ? <p className="text-xs text-destructive">{message}</p> : null;
}
