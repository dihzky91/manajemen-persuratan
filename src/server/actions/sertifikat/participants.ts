"use server";

import { desc, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { z } from "zod";
import { db } from "@/server/db";
import { auditLog, events, participants } from "@/server/db/schema";
import { requireRole, requireSession } from "../auth";

const participantInputSchema = z.object({
  eventId: z.coerce.number().int().positive(),
  noSertifikat: z.string().trim().max(100).optional().nullable(),
  nama: z.string().trim().min(1, "Nama peserta wajib diisi.").max(255),
  role: z.string().trim().max(50).default("Peserta"),
  email: z.string().trim().email("Format email tidak valid.").max(150).optional().nullable().or(z.literal("")),
  autoGenerate: z.boolean().default(true),
});

const participantUpdateSchema = participantInputSchema
  .omit({ eventId: true, autoGenerate: true })
  .extend({
    noSertifikat: z.string().trim().min(1, "Nomor sertifikat wajib diisi.").max(100),
  });
const idSchema = z.coerce.number().int().positive();

type ImportRecord = Record<string, unknown>;
type CertificateNumberExecutor = Pick<typeof db, "select" | "execute">;

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
  email: string | null;
  emailSentAt: Date | null;
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

function normalizeOptionalEmail(email?: string | null) {
  return email && email.trim().length > 0 ? email.trim().toLowerCase() : null;
}

function hasFormulaInjection(value: string) {
  return /^[=+\-@]/.test(value);
}

function rejectFormulaCells(lineNumber: number, values: string[], errors: string[]) {
  if (values.some((value) => value.length > 0 && hasFormulaInjection(value))) {
    errors.push(`Baris ${lineNumber}: nilai mengandung karakter formula yang tidak diizinkan.`);
    return true;
  }
  return false;
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

async function generateNoSertifikat(
  eventId: number,
  tx: CertificateNumberExecutor,
): Promise<string> {
  const [event] = await tx
    .select({
      kodeEvent: events.kodeEvent,
      tanggalMulai: events.tanggalMulai,
    })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  if (!event) throw new Error("Kegiatan tidak ditemukan.");

  const existingCounter = await tx.execute(sql`
    SELECT COALESCE(MAX(CAST(SUBSTRING(no_sertifikat FROM '-([0-9]+)/') AS INTEGER)), 0) AS last_counter
    FROM participants
    WHERE event_id = ${eventId}
  `);
  const seedCounter = Number(existingCounter.rows[0]?.last_counter ?? 0);

  await tx.execute(sql`
    INSERT INTO event_certificate_counters (event_id, last_counter, updated_at)
    VALUES (${eventId}, ${seedCounter}, now())
    ON CONFLICT (event_id) DO NOTHING
  `);

  const incremented = await tx.execute(sql`
    INSERT INTO event_certificate_counters (event_id, last_counter, updated_at)
    VALUES (${eventId}, 1, now())
    ON CONFLICT (event_id) DO UPDATE
      SET last_counter = event_certificate_counters.last_counter + 1,
          updated_at = now()
    RETURNING last_counter
  `);

  const nextCounter = Number(incremented.rows[0]?.last_counter ?? 1);
  const year = Number(String(event.tanggalMulai).slice(0, 4));
  return `${event.kodeEvent}-${String(nextCounter).padStart(3, "0")}/${year}`;
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
    const [row] = await db.transaction(async (tx) => {
      const noSertifikat = parsed.noSertifikat?.trim()
        ? parsed.noSertifikat.trim()
        : parsed.autoGenerate
          ? await generateNoSertifikat(parsed.eventId, tx)
          : "";

      if (!noSertifikat) throw new Error("Nomor sertifikat wajib diisi atau gunakan auto-generate.");

      return tx
        .insert(participants)
        .values({
          eventId: parsed.eventId,
          noSertifikat,
          nama: parsed.nama,
          role: normalizeOptionalRole(parsed.role),
          email: normalizeOptionalEmail(parsed.email),
          updatedAt: new Date(),
        })
        .returning();
    });

    if (!row) throw new Error("Gagal menambah peserta.");

    await db.insert(auditLog).values({
      userId: session.user.id,
      aksi: "CREATE_SERTIFIKAT_PARTICIPANT",
      entitasType: "sertifikat_participant",
      entitasId: String(row.id),
      detail: {
        eventId: parsed.eventId,
        noSertifikat: row.noSertifikat,
        nama: parsed.nama,
      },
    });

    revalidatePath(`/sertifikat/kegiatan/${parsed.eventId}`);
    revalidatePath(`/verifikasi/${row.noSertifikat}`);
    return { ok: true as const, data: row };
  } catch (err) {
    if (isUniqueViolation(err)) {
      return { ok: false as const, error: "Nomor sertifikat sudah digunakan." };
    }
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Gagal menambah peserta.",
    };
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
        email: normalizeOptionalEmail(parsed.email),
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
  const errors: string[] = [];
  const validRows: {
    lineNumber: number;
    noSertifikat: string | null;
    nama: string;
    role: string;
    email: string | null;
  }[] = [];
  const seenNos = new Map<string, number>();

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index]!;
    const lineNumber = index + 2;
    const noSertifikat = stringifyCell(
      pickCell(row, ["no_sertifikat", "No Sertifikat", "NO SERTIFIKAT"]),
    );
    const nama = stringifyCell(pickCell(row, ["nama", "Nama", "NAMA"]));
    const role = stringifyCell(pickCell(row, ["role", "Role", "ROLE"]));
    const email = stringifyCell(pickCell(row, ["email", "Email", "EMAIL"]));

    if (rejectFormulaCells(lineNumber, [noSertifikat, nama, role, email], errors)) {
      continue;
    }

    if (!nama) {
      errors.push(`Baris ${lineNumber}: nama wajib diisi.`);
      continue;
    }

    if (email && !z.string().email().safeParse(email).success) {
      errors.push(`Baris ${lineNumber} (${nama}): format email tidak valid.`);
      continue;
    }

    if (noSertifikat) {
      const previousLine = seenNos.get(noSertifikat);
      if (previousLine !== undefined) {
        errors.push(
          `Baris ${lineNumber} (${nama}): nomor sertifikat duplikat dengan baris ${previousLine}.`,
        );
        continue;
      }
      seenNos.set(noSertifikat, lineNumber);
    }

    validRows.push({
      lineNumber,
      noSertifikat: noSertifikat || null,
      nama,
      role: normalizeOptionalRole(role),
      email: normalizeOptionalEmail(email),
    });
  }

  if (validRows.length > 0) {
    const candidateNos = validRows
      .map((row) => row.noSertifikat)
      .filter((no): no is string => Boolean(no));
    if (candidateNos.length > 0) {
      const existing = await db
        .select({ noSertifikat: participants.noSertifikat })
        .from(participants)
        .where(inArray(participants.noSertifikat, candidateNos));

      if (existing.length > 0) {
        const existingSet = new Set(existing.map((row) => row.noSertifikat));
        for (let index = validRows.length - 1; index >= 0; index -= 1) {
          const row = validRows[index]!;
          if (row.noSertifikat && existingSet.has(row.noSertifikat)) {
            errors.push(
              `Baris ${row.lineNumber} (${row.nama}): nomor sertifikat ${row.noSertifikat} sudah digunakan di sistem.`,
            );
            validRows.splice(index, 1);
          }
        }
      }
    }
  }

  let successCount = 0;
  if (errors.length === 0 && validRows.length > 0) {
    try {
      await db.transaction(async (tx) => {
        const rowsToInsert = [];
        for (const row of validRows) {
          const noSertifikat =
            row.noSertifikat ?? (await generateNoSertifikat(parsedEventId, tx));
          rowsToInsert.push({
            eventId: parsedEventId,
            noSertifikat,
            nama: row.nama,
            role: row.role,
            email: row.email,
            updatedAt: new Date(),
          });
        }
        await tx.insert(participants).values(rowsToInsert);
      });
      successCount = validRows.length;
    } catch (err) {
      const message = isUniqueViolation(err)
        ? "Nomor sertifikat duplikat terdeteksi saat insert; impor dibatalkan."
        : err instanceof Error
          ? err.message
          : "Gagal menyimpan data peserta.";
      return { ok: false as const, error: message };
    }
  }

  const result: BulkImportResult = {
    totalRows: rows.length,
    successCount,
    errors,
  };

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
      committed: result.successCount > 0,
    },
  });

  revalidatePath(`/sertifikat/kegiatan/${parsedEventId}`);
  return { ok: true as const, data: result };
}
