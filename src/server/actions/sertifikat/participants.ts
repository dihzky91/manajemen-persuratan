"use server";

import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { z } from "zod";
import { db } from "@/server/db";
import { auditLog, events, participants } from "@/server/db/schema";
import { requireRole, requireSession } from "../auth";

const participantInputSchema = z.object({
  eventId: z.coerce.number().int().positive(),
  noSertifikat: z.string().trim().min(1, "Nomor sertifikat wajib diisi.").max(100),
  nama: z.string().trim().min(1, "Nama peserta wajib diisi.").max(255),
  role: z.string().trim().max(50).default("Peserta"),
});

const participantUpdateSchema = participantInputSchema.omit({ eventId: true });
const idSchema = z.coerce.number().int().positive();

type ImportRecord = Record<string, unknown>;

function isUniqueViolation(err: unknown) {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { code?: string }).code === "23505"
  );
}

export type ParticipantRow = {
  id: number;
  eventId: number;
  noSertifikat: string;
  nama: string;
  role: string;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export type BulkImportResult = {
  totalRows: number;
  successCount: number;
  errors: string[];
};

function normalizeOptionalRole(role?: string) {
  return role && role.trim().length > 0 ? role.trim() : "Peserta";
}

function pickCell(row: ImportRecord, candidates: string[]) {
  const entries = Object.entries(row).map(([key, value]) => [
    key.trim().toLowerCase().replace(/\s+/g, "_"),
    value,
  ] as const);

  for (const candidate of candidates) {
    const normalizedCandidate = candidate.trim().toLowerCase().replace(/\s+/g, "_");
    const found = entries.find(([key]) => key === normalizedCandidate);
    if (found) return found[1];
  }

  return undefined;
}

function stringifyCell(value: unknown) {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).trim();
}

async function parseImportFile(file: File): Promise<ImportRecord[]> {
  const extension = file.name.split(".").pop()?.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  if (extension === "csv") {
    const parsed = Papa.parse<ImportRecord>(buffer.toString("utf-8"), {
      header: true,
      skipEmptyLines: true,
    });
    if (parsed.errors.length > 0) {
      throw new Error(parsed.errors[0]?.message ?? "Gagal membaca file CSV.");
    }
    return parsed.data;
  }

  if (extension === "xlsx" || extension === "xls") {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return [];
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) return [];
    return XLSX.utils.sheet_to_json<ImportRecord>(worksheet, { defval: "" });
  }

  throw new Error("Format file tidak didukung. Gunakan CSV, XLSX, atau XLS.");
}

export async function listByEvent(eventId: number): Promise<ParticipantRow[]> {
  await requireSession();
  const parsedEventId = idSchema.parse(eventId);

  return db
    .select()
    .from(participants)
    .where(eq(participants.eventId, parsedEventId))
    .orderBy(desc(participants.id));
}

export async function createParticipant(data: unknown) {
  const parsed = participantInputSchema.parse(data);
  const session = await requireRole(["admin", "staff"]);

  try {
    const [row] = await db
      .insert(participants)
      .values({
        eventId: parsed.eventId,
        noSertifikat: parsed.noSertifikat,
        nama: parsed.nama,
        role: normalizeOptionalRole(parsed.role),
        updatedAt: new Date(),
      })
      .returning();

    if (!row) throw new Error("Gagal menambah peserta.");

    await db.insert(auditLog).values({
      userId: session.user.id,
      aksi: "CREATE_SERTIFIKAT_PARTICIPANT",
      entitasType: "sertifikat_participant",
      entitasId: String(row.id),
      detail: {
        eventId: parsed.eventId,
        noSertifikat: parsed.noSertifikat,
        nama: parsed.nama,
      },
    });

    revalidatePath(`/sertifikat/kegiatan/${parsed.eventId}`);
    revalidatePath(`/verifikasi/${parsed.noSertifikat}`);
    return { ok: true as const, data: row };
  } catch (err) {
    if (isUniqueViolation(err)) {
      return { ok: false as const, error: "Nomor sertifikat sudah digunakan." };
    }
    throw err;
  }
}

export async function updateParticipant(id: number, data: unknown) {
  const parsedId = idSchema.parse(id);
  const parsed = participantUpdateSchema.parse(data);
  const session = await requireRole(["admin", "staff"]);

  try {
    const [row] = await db
      .update(participants)
      .set({
        noSertifikat: parsed.noSertifikat,
        nama: parsed.nama,
        role: normalizeOptionalRole(parsed.role),
        updatedAt: new Date(),
      })
      .where(eq(participants.id, parsedId))
      .returning();

    if (!row) return { ok: false as const, error: "Peserta tidak ditemukan." };

    await db.insert(auditLog).values({
      userId: session.user.id,
      aksi: "UPDATE_SERTIFIKAT_PARTICIPANT",
      entitasType: "sertifikat_participant",
      entitasId: String(parsedId),
      detail: { noSertifikat: parsed.noSertifikat, nama: parsed.nama },
    });

    revalidatePath(`/sertifikat/kegiatan/${row.eventId}`);
    revalidatePath(`/verifikasi/${row.noSertifikat}`);
    return { ok: true as const, data: row };
  } catch (err) {
    if (isUniqueViolation(err)) {
      return { ok: false as const, error: "Nomor sertifikat sudah digunakan." };
    }
    throw err;
  }
}

export async function deleteParticipant(id: number) {
  const parsedId = idSchema.parse(id);
  const session = await requireRole(["admin", "staff"]);

  const [existing] = await db
    .select()
    .from(participants)
    .where(eq(participants.id, parsedId))
    .limit(1);

  if (!existing) return { ok: false as const, error: "Peserta tidak ditemukan." };

  await db.delete(participants).where(eq(participants.id, parsedId));

  await db.insert(auditLog).values({
    userId: session.user.id,
    aksi: "DELETE_SERTIFIKAT_PARTICIPANT",
    entitasType: "sertifikat_participant",
    entitasId: String(parsedId),
    detail: { noSertifikat: existing.noSertifikat, nama: existing.nama },
  });

  revalidatePath(`/sertifikat/kegiatan/${existing.eventId}`);
  revalidatePath(`/verifikasi/${existing.noSertifikat}`);
  return { ok: true as const };
}

export async function bulkImportParticipants(
  eventId: number,
  formData: FormData,
): Promise<{ ok: true; data: BulkImportResult } | { ok: false; error: string }> {
  const parsedEventId = idSchema.parse(eventId);
  const session = await requireRole(["admin", "staff"]);
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false as const, error: "File import wajib diunggah." };
  }

  const [event] = await db
    .select({ id: events.id, namaKegiatan: events.namaKegiatan })
    .from(events)
    .where(eq(events.id, parsedEventId))
    .limit(1);

  if (!event) return { ok: false as const, error: "Kegiatan tidak ditemukan." };

  const rows = await parseImportFile(file);
  const result: BulkImportResult = {
    totalRows: rows.length,
    successCount: 0,
    errors: [],
  };

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index]!;
    const noSertifikat = stringifyCell(
      pickCell(row, ["no_sertifikat", "No Sertifikat", "NO SERTIFIKAT"]),
    );
    const nama = stringifyCell(pickCell(row, ["nama", "Nama", "NAMA"]));
    const role = stringifyCell(pickCell(row, ["role", "Role", "ROLE"]));

    if (!noSertifikat || !nama) {
      result.errors.push(`Baris ${index + 2}: nomor sertifikat dan nama wajib diisi.`);
      continue;
    }

    try {
      await db.insert(participants).values({
        eventId: parsedEventId,
        noSertifikat,
        nama,
        role: normalizeOptionalRole(role),
        updatedAt: new Date(),
      });
      result.successCount += 1;
    } catch (err) {
      const message = isUniqueViolation(err)
        ? "Nomor sertifikat sudah digunakan."
        : err instanceof Error
          ? err.message
          : "Gagal menyimpan baris.";
      result.errors.push(`Baris ${index + 2} (${nama}): ${message}`);
    }
  }

  await db.insert(auditLog).values({
    userId: session.user.id,
    aksi: "IMPORT_SERTIFIKAT_PARTICIPANTS",
    entitasType: "sertifikat_event",
    entitasId: String(parsedEventId),
    detail: {
      namaKegiatan: event.namaKegiatan,
      fileName: file.name,
      totalRows: result.totalRows,
      successCount: result.successCount,
      errorCount: result.errors.length,
    },
  });

  revalidatePath(`/sertifikat/kegiatan/${parsedEventId}`);
  return { ok: true as const, data: result };
}
