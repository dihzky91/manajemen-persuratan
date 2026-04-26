"use server";

import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  sql,
} from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/server/db";
import {
  auditLog,
  eventSignatories,
  events,
  participants,
  signatories,
} from "@/server/db/schema";
import { requireRole, requireSession } from "../auth";

const kategoriValues = ["Workshop", "Brevet AB", "Brevet C", "BFA", "Lainnya"] as const;

const orderedSignatorySchema = z.object({
  signatoryId: z.coerce.number().int().positive(),
  urutan: z.coerce.number().int().positive().default(1),
});

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD.")
  .refine((value) => {
    const [year, month, day] = value.split("-").map(Number);
    if (!year || !month || !day) return false;
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    const parsed = new Date(Date.UTC(year, month - 1, day));
    return (
      parsed.getUTCFullYear() === year &&
      parsed.getUTCMonth() === month - 1 &&
      parsed.getUTCDate() === day
    );
  }, "Tanggal tidak valid.");

const eventInputSchema = z.object({
  namaKegiatan: z.string().trim().min(1, "Nama kegiatan wajib diisi.").max(255),
  kategori: z.enum(kategoriValues).default("Workshop"),
  tanggalMulai: isoDateSchema,
  tanggalSelesai: isoDateSchema,
  lokasi: z.string().trim().max(255).optional().nullable(),
  skp: z.string().trim().max(50).optional().nullable(),
  keterangan: z.string().trim().optional().nullable(),
  signatories: z.array(orderedSignatorySchema).optional(),
  signatoryIds: z.array(z.coerce.number().int().positive()).optional(),
}).refine((data) => data.tanggalSelesai >= data.tanggalMulai, {
  message: "Tanggal selesai tidak boleh sebelum tanggal mulai.",
  path: ["tanggalSelesai"],
});

const eventIdSchema = z.coerce.number().int().positive();

export type KategoriKegiatan = (typeof kategoriValues)[number];

export type EventFilters = {
  search?: string;
  kategori?: KategoriKegiatan | "all";
  status?: "active" | "inactive" | "all";
  location?: string;
  skpMin?: string | number;
  skpMax?: string | number;
  dateFrom?: string;
  dateTo?: string;
};

export type EventRow = {
  id: number;
  namaKegiatan: string;
  kategori: KategoriKegiatan;
  tanggalMulai: string;
  tanggalSelesai: string;
  lokasi: string | null;
  skp: string | null;
  keterangan: string | null;
  createdBy: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  participantCount: number;
  signatories: EventSignatoryRow[];
};

export type EventSignatoryRow = {
  id: number;
  nama: string;
  jabatan: string | null;
  pejabatId: number | null;
  urutan: number;
};

type EventInput = z.infer<typeof eventInputSchema>;

function todayJakarta() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function normalizeOptional(value?: string | null) {
  return value && value.trim().length > 0 ? value.trim() : null;
}

function normalizeSignatories(input: EventInput) {
  const ordered = input.signatories?.length
    ? input.signatories
    : input.signatoryIds?.map((signatoryId, index) => ({
        signatoryId,
        urutan: index + 1,
      })) ?? [];

  return ordered
    .filter(
      (item, index, array) =>
        array.findIndex((candidate) => candidate.signatoryId === item.signatoryId) === index,
    )
    .map((item, index) => ({
      signatoryId: item.signatoryId,
      urutan: item.urutan || index + 1,
    }));
}

async function attachSignatories(
  eventId: number,
  selectedSignatories: { signatoryId: number; urutan: number }[],
) {
  if (selectedSignatories.length === 0) return;

  await db.insert(eventSignatories).values(
    selectedSignatories.map((item) => ({
      eventId,
      signatoryId: item.signatoryId,
      urutan: item.urutan,
    })),
  );
}

async function hydrateSignatories(rows: Omit<EventRow, "signatories">[]): Promise<EventRow[]> {
  if (rows.length === 0) return [];

  const ids = rows.map((row) => row.id);
  const signatureRows = await db
    .select({
      eventId: eventSignatories.eventId,
      id: signatories.id,
      nama: signatories.nama,
      jabatan: signatories.jabatan,
      pejabatId: signatories.pejabatId,
      urutan: eventSignatories.urutan,
    })
    .from(eventSignatories)
    .innerJoin(signatories, eq(eventSignatories.signatoryId, signatories.id))
    .where(inArray(eventSignatories.eventId, ids))
    .orderBy(asc(eventSignatories.urutan), asc(signatories.nama));

  return rows.map((row) => ({
    ...row,
    signatories: signatureRows
      .filter((signature) => signature.eventId === row.id)
      .map(({ eventId: _eventId, ...signature }) => signature),
  }));
}

export async function listEvents(filters: EventFilters = {}): Promise<EventRow[]> {
  await requireSession();

  const conditions = [];
  const today = todayJakarta();

  if (filters.search?.trim()) {
    conditions.push(ilike(events.namaKegiatan, `%${filters.search.trim()}%`));
  }

  if (filters.kategori && filters.kategori !== "all") {
    conditions.push(eq(events.kategori, filters.kategori));
  }

  if (filters.status === "active") {
    conditions.push(gte(events.tanggalSelesai, today));
  } else if (filters.status === "inactive") {
    conditions.push(sql`${events.tanggalSelesai} < ${today}`);
  }

  if (filters.location?.trim()) {
    conditions.push(ilike(events.lokasi, `%${filters.location.trim()}%`));
  }

  if (filters.dateFrom) {
    conditions.push(gte(events.tanggalMulai, filters.dateFrom));
  }

  if (filters.dateTo) {
    conditions.push(lte(events.tanggalSelesai, filters.dateTo));
  }

  const skpNumber = sql<number>`nullif(regexp_replace(${events.skp}, '[^0-9]', '', 'g'), '')::int`;
  if (filters.skpMin !== undefined && filters.skpMin !== "") {
    conditions.push(sql`${skpNumber} >= ${Number(filters.skpMin)}`);
  }
  if (filters.skpMax !== undefined && filters.skpMax !== "") {
    conditions.push(sql`${skpNumber} <= ${Number(filters.skpMax)}`);
  }

  const where = conditions.length ? and(...conditions) : undefined;

  const rows = await db
    .select({
      id: events.id,
      namaKegiatan: events.namaKegiatan,
      kategori: events.kategori,
      tanggalMulai: events.tanggalMulai,
      tanggalSelesai: events.tanggalSelesai,
      lokasi: events.lokasi,
      skp: events.skp,
      keterangan: events.keterangan,
      createdBy: events.createdBy,
      createdAt: events.createdAt,
      updatedAt: events.updatedAt,
      participantCount: sql<number>`count(${participants.id})::int`,
    })
    .from(events)
    .leftJoin(participants, eq(participants.eventId, events.id))
    .where(where)
    .groupBy(events.id)
    .orderBy(desc(events.tanggalMulai), desc(events.id));

  return hydrateSignatories(rows);
}

export async function getEvent(id: number): Promise<EventRow | null> {
  await requireSession();
  const parsedId = eventIdSchema.parse(id);

  const rows = await db
    .select({
      id: events.id,
      namaKegiatan: events.namaKegiatan,
      kategori: events.kategori,
      tanggalMulai: events.tanggalMulai,
      tanggalSelesai: events.tanggalSelesai,
      lokasi: events.lokasi,
      skp: events.skp,
      keterangan: events.keterangan,
      createdBy: events.createdBy,
      createdAt: events.createdAt,
      updatedAt: events.updatedAt,
      participantCount: sql<number>`count(${participants.id})::int`,
    })
    .from(events)
    .leftJoin(participants, eq(participants.eventId, events.id))
    .where(eq(events.id, parsedId))
    .groupBy(events.id)
    .limit(1);

  const [row] = await hydrateSignatories(rows);
  return row ?? null;
}

export async function createEvent(data: unknown) {
  const result = eventInputSchema.safeParse(data);
  if (!result.success) return { ok: false as const, error: result.error.issues[0]?.message ?? "Data tidak valid." };
  const parsed = result.data;
  const session = await requireRole(["admin", "staff"]);
  const selectedSignatories = normalizeSignatories(parsed);

  const [row] = await db
    .insert(events)
    .values({
      namaKegiatan: parsed.namaKegiatan,
      kategori: parsed.kategori,
      tanggalMulai: parsed.tanggalMulai,
      tanggalSelesai: parsed.tanggalSelesai,
      lokasi: normalizeOptional(parsed.lokasi),
      skp: normalizeOptional(parsed.skp),
      keterangan: normalizeOptional(parsed.keterangan),
      createdBy: session.user.id,
      updatedAt: new Date(),
    })
    .returning();

  if (!row) throw new Error("Gagal membuat kegiatan.");
  await attachSignatories(row.id, selectedSignatories);

  await db.insert(auditLog).values({
    userId: session.user.id,
    aksi: "CREATE_SERTIFIKAT_EVENT",
    entitasType: "sertifikat_event",
    entitasId: String(row.id),
    detail: { namaKegiatan: row.namaKegiatan, kategori: row.kategori },
  });

  revalidatePath("/sertifikat/kegiatan");
  return { ok: true as const, data: row };
}

export async function updateEvent(id: number, data: unknown) {
  const parsedId = eventIdSchema.parse(id);
  const result = eventInputSchema.safeParse(data);
  if (!result.success) return { ok: false as const, error: result.error.issues[0]?.message ?? "Data tidak valid." };
  const parsed = result.data;
  const session = await requireRole(["admin", "staff"]);
  const selectedSignatories = normalizeSignatories(parsed);

  const [row] = await db
    .update(events)
    .set({
      namaKegiatan: parsed.namaKegiatan,
      kategori: parsed.kategori,
      tanggalMulai: parsed.tanggalMulai,
      tanggalSelesai: parsed.tanggalSelesai,
      lokasi: normalizeOptional(parsed.lokasi),
      skp: normalizeOptional(parsed.skp),
      keterangan: normalizeOptional(parsed.keterangan),
      updatedAt: new Date(),
    })
    .where(eq(events.id, parsedId))
    .returning();

  if (!row) return { ok: false as const, error: "Kegiatan tidak ditemukan." };

  await db.delete(eventSignatories).where(eq(eventSignatories.eventId, parsedId));
  await attachSignatories(parsedId, selectedSignatories);

  await db.insert(auditLog).values({
    userId: session.user.id,
    aksi: "UPDATE_SERTIFIKAT_EVENT",
    entitasType: "sertifikat_event",
    entitasId: String(parsedId),
    detail: { namaKegiatan: row.namaKegiatan, kategori: row.kategori },
  });

  revalidatePath("/sertifikat/kegiatan");
  revalidatePath(`/sertifikat/kegiatan/${parsedId}`);
  revalidatePath("/verifikasi", "layout");
  return { ok: true as const, data: row };
}

export async function deleteEvent(id: number) {
  const parsedId = eventIdSchema.parse(id);
  const session = await requireRole(["admin", "staff"]);

  const [existing] = await db
    .select({ id: events.id, namaKegiatan: events.namaKegiatan })
    .from(events)
    .where(eq(events.id, parsedId))
    .limit(1);

  if (!existing) return { ok: false as const, error: "Kegiatan tidak ditemukan." };

  await db.delete(events).where(eq(events.id, parsedId));

  await db.insert(auditLog).values({
    userId: session.user.id,
    aksi: "DELETE_SERTIFIKAT_EVENT",
    entitasType: "sertifikat_event",
    entitasId: String(parsedId),
    detail: { namaKegiatan: existing.namaKegiatan },
  });

  revalidatePath("/sertifikat/kegiatan");
  return { ok: true as const };
}
