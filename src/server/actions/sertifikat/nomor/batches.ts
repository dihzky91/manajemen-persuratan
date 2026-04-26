"use server";

import { and, asc, count, desc, eq, max, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/server/db";
import {
  auditLog,
  certificateBatches,
  certificateClassTypes,
  certificateItems,
  certificatePrograms,
  certificateSerialConfig,
  users,
} from "@/server/db/schema";
import { requireRole, requireSession } from "../../auth";

// ─── Schemas ─────────────────────────────────────────────────────────────────

const batchFilterSchema = z.object({
  programId:   z.string().optional(),
  classTypeId: z.string().optional(),
  angkatan:    z.coerce.number().int().optional(),
  status:      z.enum(["active", "revised", "cancelled"]).optional(),
});

const generateSchema = z.object({
  programId:     z.string().min(1, "Program wajib dipilih."),
  classTypeId:   z.string().min(1, "Jenis kelas wajib dipilih."),
  classTypeCode: z.string().regex(/^\d{2}$/, "Kode jenis kelas tidak valid."),
  angkatan:      z.number().int().min(100, "Angkatan minimal 100.").max(999, "Angkatan maksimal 999."),
  quantity:      z.number().int().min(1, "Jumlah minimal 1.").max(1000, "Jumlah maksimal 1000."),
});

const idSchema = z.string().min(1, "ID tidak valid.");

const updateQuantitySchema = z.object({
  batchId:       z.string().min(1),
  newQuantity:   z.number().int().min(1, "Jumlah minimal 1."),
  classTypeCode: z.string().regex(/^\d{2}$/),
  angkatan:      z.number().int(),
});

// ─── Types ───────────────────────────────────────────────────────────────────

export type BatchRow = {
  id: string;
  programId: string;
  programName: string;
  classTypeId: string;
  classTypeName: string;
  classTypeCode: string;
  angkatan: number;
  quantityRequested: number;
  firstCertificateNumber: string;
  lastCertificateNumber: string;
  status: "active" | "revised" | "cancelled";
  notes: string | null;
  createdByName: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type BatchDetailRow = BatchRow & {
  items: BatchItemRow[];
};

export type BatchItemRow = {
  id: string;
  fullNumber: string;
  serialNumber: number;
  status: "active" | "cancelled";
  createdAt: Date;
};

export type YearlyStats = {
  year: number;
  totalActive: number;
  totalCancelled: number;
  firstSerial: number | null;
  lastSerial: number | null;
};

export type YearlyProgramStats = {
  programName: string;
  classTypeName: string;
  classTypeCode: string;
  activeCount: number;
  cancelledCount: number;
};

export type CsvExportRow = {
  "No.": number;
  "Nomor Sertifikat": string;
  "Serial Number": number;
  Status: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getLastSerial(): Promise<number> {
  const [config] = await db
    .select({ value: certificateSerialConfig.value })
    .from(certificateSerialConfig)
    .where(eq(certificateSerialConfig.key, "last_serial_number"))
    .limit(1);

  return config ? parseInt(config.value, 10) : 0;
}

async function setLastSerial(value: number): Promise<void> {
  await db
    .insert(certificateSerialConfig)
    .values({ key: "last_serial_number", value: String(value) })
    .onConflictDoUpdate({
      target: certificateSerialConfig.key,
      set: { value: String(value), updatedAt: new Date() },
    });
}

// ─── Actions: List & Get ──────────────────────────────────────────────────────

export async function listBatches(filters?: z.infer<typeof batchFilterSchema>): Promise<BatchRow[]> {
  await requireSession();

  const rows = await db
    .select({
      id:                     certificateBatches.id,
      programId:              certificateBatches.programId,
      programName:            certificatePrograms.name,
      classTypeId:            certificateBatches.classTypeId,
      classTypeName:          certificateClassTypes.name,
      classTypeCode:          certificateClassTypes.code,
      angkatan:               certificateBatches.angkatan,
      quantityRequested:      certificateBatches.quantityRequested,
      firstCertificateNumber: certificateBatches.firstCertificateNumber,
      lastCertificateNumber:  certificateBatches.lastCertificateNumber,
      status:                 certificateBatches.status,
      notes:                  certificateBatches.notes,
      createdByName:          users.namaLengkap,
      createdAt:              certificateBatches.createdAt,
      updatedAt:              certificateBatches.updatedAt,
    })
    .from(certificateBatches)
    .innerJoin(certificatePrograms, eq(certificateBatches.programId, certificatePrograms.id))
    .innerJoin(certificateClassTypes, eq(certificateBatches.classTypeId, certificateClassTypes.id))
    .leftJoin(users, eq(certificateBatches.createdBy, users.id))
    .where(
      and(
        filters?.programId   ? eq(certificateBatches.programId, filters.programId)     : undefined,
        filters?.classTypeId ? eq(certificateBatches.classTypeId, filters.classTypeId) : undefined,
        filters?.angkatan    ? eq(certificateBatches.angkatan, filters.angkatan)       : undefined,
        filters?.status      ? eq(certificateBatches.status, filters.status)           : undefined,
      ),
    )
    .orderBy(desc(certificateBatches.createdAt));

  return rows as BatchRow[];
}

export async function getBatch(id: string): Promise<BatchDetailRow | null> {
  await requireSession();
  const parsedId = idSchema.parse(id);

  const rows = await db
    .select({
      id:                     certificateBatches.id,
      programId:              certificateBatches.programId,
      programName:            certificatePrograms.name,
      classTypeId:            certificateBatches.classTypeId,
      classTypeName:          certificateClassTypes.name,
      classTypeCode:          certificateClassTypes.code,
      angkatan:               certificateBatches.angkatan,
      quantityRequested:      certificateBatches.quantityRequested,
      firstCertificateNumber: certificateBatches.firstCertificateNumber,
      lastCertificateNumber:  certificateBatches.lastCertificateNumber,
      status:                 certificateBatches.status,
      notes:                  certificateBatches.notes,
      createdByName:          users.namaLengkap,
      createdAt:              certificateBatches.createdAt,
      updatedAt:              certificateBatches.updatedAt,
    })
    .from(certificateBatches)
    .innerJoin(certificatePrograms, eq(certificateBatches.programId, certificatePrograms.id))
    .innerJoin(certificateClassTypes, eq(certificateBatches.classTypeId, certificateClassTypes.id))
    .leftJoin(users, eq(certificateBatches.createdBy, users.id))
    .where(eq(certificateBatches.id, parsedId))
    .limit(1);

  const batch = rows[0];
  if (!batch) return null;

  const items = await db
    .select({
      id:           certificateItems.id,
      fullNumber:   certificateItems.fullNumber,
      serialNumber: certificateItems.serialNumber,
      status:       certificateItems.status,
      createdAt:    certificateItems.createdAt,
    })
    .from(certificateItems)
    .where(eq(certificateItems.batchId, parsedId))
    .orderBy(asc(certificateItems.serialNumber));

  return { ...(batch as BatchRow), items: items as BatchItemRow[] };
}

// ─── Actions: Generate ────────────────────────────────────────────────────────

export async function generateBatch(data: unknown) {
  const result = generateSchema.safeParse(data);
  if (!result.success) {
    return { ok: false as const, error: result.error.issues[0]?.message ?? "Data tidak valid." };
  }
  const { programId, classTypeId, classTypeCode, angkatan, quantity } = result.data;
  const session = await requireRole(["admin", "staff"]);

  try {
    // 1. Baca serial terakhir
    const lastSerial = await getLastSerial();
    const startSerial = lastSerial + 1;
    const endSerial = startSerial + quantity - 1;

    // 2. Format nomor: {angkatan 3-digit}{kode}.{serial}
    const angkatanStr = String(angkatan).padStart(3, "0");
    const firstNumber = `${angkatanStr}${classTypeCode}.${startSerial}`;
    const lastNumber  = `${angkatanStr}${classTypeCode}.${endSerial}`;

    // 3. Insert batch
    const [batch] = await db
      .insert(certificateBatches)
      .values({
        programId,
        classTypeId,
        angkatan,
        quantityRequested: quantity,
        firstCertificateNumber: firstNumber,
        lastCertificateNumber:  lastNumber,
        status: "active",
        createdBy: session.user.id,
        updatedAt: new Date(),
      })
      .returning();

    if (!batch) throw new Error("Gagal membuat batch.");

    // 4. Insert items individual
    const itemValues = [];
    for (let i = startSerial; i <= endSerial; i++) {
      itemValues.push({
        batchId:       batch.id,
        fullNumber:    `${angkatanStr}${classTypeCode}.${i}`,
        angkatan,
        classTypeCode,
        serialNumber:  i,
        status:        "active" as const,
      });
    }

    // Insert dalam chunk 500 untuk menghindari batas parameter query
    const CHUNK_SIZE = 500;
    const generatedItems = [];
    for (let i = 0; i < itemValues.length; i += CHUNK_SIZE) {
      const chunk = itemValues.slice(i, i + CHUNK_SIZE);
      const inserted = await db.insert(certificateItems).values(chunk).returning();
      generatedItems.push(...inserted);
    }

    // 5. Update serial config
    await setLastSerial(endSerial);

    // 6. Audit log
    await db.insert(auditLog).values({
      userId: session.user.id,
      aksi: "GENERATE_CERT_BATCH",
      entitasType: "cert_batch",
      entitasId: batch.id,
      detail: {
        programId,
        classTypeId,
        angkatan,
        quantity,
        firstNumber,
        lastNumber,
        startSerial,
        endSerial,
      },
    });

    revalidatePath("/sertifikat/nomor");
    return {
      ok: true as const,
      data: {
        batch,
        items: generatedItems,
        firstNumber,
        lastNumber,
      },
    };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Gagal generate batch sertifikat.",
    };
  }
}

// ─── Actions: Update Jumlah Batch ────────────────────────────────────────────

export async function updateBatchQuantity(rawData: unknown) {
  const result = updateQuantitySchema.safeParse(rawData);
  if (!result.success) {
    return { ok: false as const, error: result.error.issues[0]?.message ?? "Data tidak valid." };
  }
  const { batchId, newQuantity, classTypeCode, angkatan } = result.data;
  const session = await requireRole(["admin", "staff"]);

  // Ambil semua items batch ini
  const batchItems = await db
    .select()
    .from(certificateItems)
    .where(eq(certificateItems.batchId, batchId))
    .orderBy(asc(certificateItems.serialNumber));

  const currentQty = batchItems.length;
  if (newQuantity === currentQty) return { ok: true as const };

  if (newQuantity < currentQty) {
    // === PENGURANGAN — hanya boleh untuk batch terakhir (serial tertinggi) ===
    const batchMaxSerial = Math.max(...batchItems.map((item) => item.serialNumber));

    const [globalMaxRow] = await db
      .select({ maxSerial: max(certificateItems.serialNumber) })
      .from(certificateItems);

    const globalMaxSerial = globalMaxRow?.maxSerial ?? 0;

    if (batchMaxSerial !== globalMaxSerial) {
      return {
        ok: false as const,
        error:
          "Batch ini bukan batch dengan nomor serial tertinggi. Pengurangan jumlah hanya diizinkan untuk batch terakhir agar tidak ada celah nomor.",
      };
    }

    // Hapus items dari ekor
    const toDelete = batchItems.slice(newQuantity);
    const deleteIds = toDelete.map((item) => item.id);

    // Hapus satu per satu untuk menghindari batas IN clause
    for (const deleteId of deleteIds) {
      await db.delete(certificateItems).where(eq(certificateItems.id, deleteId));
    }

    const remaining = batchItems.slice(0, newQuantity);
    const firstItem = remaining[0];
    const lastItem  = remaining[remaining.length - 1];

    if (!firstItem || !lastItem) {
      return { ok: false as const, error: "Gagal menghitung sisa items." };
    }

    // Update batch record
    await db
      .update(certificateBatches)
      .set({
        quantityRequested:      newQuantity,
        firstCertificateNumber: firstItem.fullNumber,
        lastCertificateNumber:  lastItem.fullNumber,
        status: "revised",
        updatedAt: new Date(),
      })
      .where(eq(certificateBatches.id, batchId));

    // Recompute serial config dari data aktual
    const [newMaxRow] = await db
      .select({ maxSerial: max(certificateItems.serialNumber) })
      .from(certificateItems);

    await setLastSerial(newMaxRow?.maxSerial ?? 0);

    await db.insert(auditLog).values({
      userId: session.user.id,
      aksi: "DECREASE_CERT_BATCH_QTY",
      entitasType: "cert_batch",
      entitasId: batchId,
      detail: { previousQty: currentQty, newQty: newQuantity, deletedCount: toDelete.length },
    });

  } else {
    // === PENAMBAHAN — generate nomor baru melanjutkan serial global ===
    const addCount = newQuantity - currentQty;
    const lastSerial = await getLastSerial();
    const startSerial = lastSerial + 1;
    const endSerial = startSerial + addCount - 1;

    const angkatanStr = String(angkatan).padStart(3, "0");
    const newItems = [];
    for (let i = startSerial; i <= endSerial; i++) {
      newItems.push({
        batchId,
        fullNumber:    `${angkatanStr}${classTypeCode}.${i}`,
        angkatan,
        classTypeCode,
        serialNumber:  i,
        status:        "active" as const,
      });
    }

    const CHUNK_SIZE = 500;
    for (let i = 0; i < newItems.length; i += CHUNK_SIZE) {
      await db.insert(certificateItems).values(newItems.slice(i, i + CHUNK_SIZE));
    }

    await setLastSerial(endSerial);

    // Ambil lastNumber terbaru untuk update batch
    const lastNumber = `${angkatanStr}${classTypeCode}.${endSerial}`;
    await db
      .update(certificateBatches)
      .set({
        quantityRequested: newQuantity,
        lastCertificateNumber: lastNumber,
        status: "revised",
        updatedAt: new Date(),
      })
      .where(eq(certificateBatches.id, batchId));

    await db.insert(auditLog).values({
      userId: session.user.id,
      aksi: "INCREASE_CERT_BATCH_QTY",
      entitasType: "cert_batch",
      entitasId: batchId,
      detail: { previousQty: currentQty, newQty: newQuantity, addedCount: addCount, endSerial },
    });
  }

  revalidatePath("/sertifikat/nomor");
  revalidatePath(`/sertifikat/nomor/${batchId}`);
  return { ok: true as const };
}

// ─── Actions: Cancel Batch ────────────────────────────────────────────────────

export async function cancelBatch(id: string) {
  const parsedId = idSchema.parse(id);
  const session = await requireRole(["admin"]);

  const [existing] = await db
    .select({ id: certificateBatches.id, status: certificateBatches.status, firstCertificateNumber: certificateBatches.firstCertificateNumber })
    .from(certificateBatches)
    .where(eq(certificateBatches.id, parsedId))
    .limit(1);

  if (!existing) return { ok: false as const, error: "Batch tidak ditemukan." };
  if (existing.status === "cancelled") return { ok: false as const, error: "Batch sudah dibatalkan." };

  await db
    .update(certificateBatches)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(eq(certificateBatches.id, parsedId));

  // Update semua items jadi cancelled
  await db
    .update(certificateItems)
    .set({ status: "cancelled" })
    .where(eq(certificateItems.batchId, parsedId));

  await db.insert(auditLog).values({
    userId: session.user.id,
    aksi: "CANCEL_CERT_BATCH",
    entitasType: "cert_batch",
    entitasId: parsedId,
    detail: { firstCertificateNumber: existing.firstCertificateNumber },
  });

  revalidatePath("/sertifikat/nomor");
  revalidatePath(`/sertifikat/nomor/${parsedId}`);
  return { ok: true as const };
}

// ─── Actions: Export CSV ──────────────────────────────────────────────────────

export async function exportBatchToCsv(id: string): Promise<
  { ok: true; data: CsvExportRow[]; filename: string } | { ok: false; error: string }
> {
  await requireRole(["admin", "staff"]);
  const parsedId = idSchema.parse(id);

  const [batch] = await db
    .select({
      id:                     certificateBatches.id,
      firstCertificateNumber: certificateBatches.firstCertificateNumber,
      programName:            certificatePrograms.name,
      angkatan:               certificateBatches.angkatan,
    })
    .from(certificateBatches)
    .innerJoin(certificatePrograms, eq(certificateBatches.programId, certificatePrograms.id))
    .where(eq(certificateBatches.id, parsedId))
    .limit(1);

  if (!batch) return { ok: false, error: "Batch tidak ditemukan." };

  const items = await db
    .select({
      fullNumber:   certificateItems.fullNumber,
      serialNumber: certificateItems.serialNumber,
      status:       certificateItems.status,
    })
    .from(certificateItems)
    .where(
      and(
        eq(certificateItems.batchId, parsedId),
        eq(certificateItems.status, "active"),
      ),
    )
    .orderBy(asc(certificateItems.serialNumber));

  const data: CsvExportRow[] = items.map((item, idx) => ({
    "No.": idx + 1,
    "Nomor Sertifikat": item.fullNumber,
    "Serial Number": item.serialNumber,
    Status: item.status === "active" ? "Aktif" : "Dibatalkan",
  }));

  const safeProgramName = batch.programName.replace(/[^a-zA-Z0-9-_]/g, "_");
  const filename = `sertifikat_${safeProgramName}_${batch.angkatan}_${batch.id.slice(0, 8)}.csv`;

  return { ok: true, data, filename };
}

// ─── Actions: Rekap Tahunan ───────────────────────────────────────────────────

export async function getAvailableYears(): Promise<number[]> {
  await requireSession();

  const rows = await db
    .selectDistinct({
      year: sql<number>`extract(year from ${certificateBatches.createdAt})::int`,
    })
    .from(certificateBatches)
    .orderBy(desc(sql`extract(year from ${certificateBatches.createdAt})`));

  return rows.map((r) => r.year);
}

export async function getYearlyStats(year: number): Promise<YearlyStats> {
  await requireSession();

  const [stats] = await db
    .select({
      totalActive:    sql<number>`count(*) filter (where ${certificateItems.status} = 'active')::int`,
      totalCancelled: sql<number>`count(*) filter (where ${certificateItems.status} = 'cancelled')::int`,
      firstSerial:    sql<number | null>`min(${certificateItems.serialNumber}) filter (where ${certificateItems.status} = 'active')`,
      lastSerial:     sql<number | null>`max(${certificateItems.serialNumber}) filter (where ${certificateItems.status} = 'active')`,
    })
    .from(certificateItems)
    .innerJoin(certificateBatches, eq(certificateItems.batchId, certificateBatches.id))
    .where(
      sql`extract(year from ${certificateBatches.createdAt})::int = ${year}`,
    );

  return {
    year,
    totalActive:    stats?.totalActive    ?? 0,
    totalCancelled: stats?.totalCancelled ?? 0,
    firstSerial:    stats?.firstSerial    ?? null,
    lastSerial:     stats?.lastSerial     ?? null,
  };
}

export async function getYearlyProgramStats(year: number): Promise<YearlyProgramStats[]> {
  await requireSession();

  const rows = await db
    .select({
      programName:   certificatePrograms.name,
      classTypeName: certificateClassTypes.name,
      classTypeCode: certificateClassTypes.code,
      activeCount:    sql<number>`count(*) filter (where ${certificateItems.status} = 'active')::int`,
      cancelledCount: sql<number>`count(*) filter (where ${certificateItems.status} = 'cancelled')::int`,
    })
    .from(certificateItems)
    .innerJoin(certificateBatches, eq(certificateItems.batchId, certificateBatches.id))
    .innerJoin(certificatePrograms, eq(certificateBatches.programId, certificatePrograms.id))
    .innerJoin(certificateClassTypes, eq(certificateBatches.classTypeId, certificateClassTypes.id))
    .where(
      sql`extract(year from ${certificateBatches.createdAt})::int = ${year}`,
    )
    .groupBy(
      certificatePrograms.name,
      certificateClassTypes.name,
      certificateClassTypes.code,
    )
    .orderBy(
      asc(certificatePrograms.name),
      asc(certificateClassTypes.code),
    );

  return rows;
}

// ─── Action: Dashboard Stats ──────────────────────────────────────────────────

export type CertDashboardStats = {
  totalBatches: number;
  activeBatches: number;
  totalCertificates: number;
};

export async function getCertDashboardStats(): Promise<CertDashboardStats> {
  await requireSession();

  const [stats] = await db
    .select({
      totalBatches:  sql<number>`count(*)::int`,
      activeBatches: sql<number>`count(*) filter (where ${certificateBatches.status} = 'active')::int`,
      totalCertificates: sql<number>`coalesce(sum(${certificateBatches.quantityRequested}), 0)::int`,
    })
    .from(certificateBatches);

  return {
    totalBatches:      stats?.totalBatches      ?? 0,
    activeBatches:     stats?.activeBatches     ?? 0,
    totalCertificates: stats?.totalCertificates ?? 0,
  };
}
