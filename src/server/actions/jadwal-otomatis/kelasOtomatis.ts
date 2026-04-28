"use server";

import { eq, asc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { db } from "@/server/db";
import {
  kelasPelatihan,
  classExcludedDates,
  classSessions,
  programs,
  classTypes,
} from "@/server/db/schema";
import { requirePermission } from "@/server/actions/auth";
import {
  kelasOtomatisCreateSchema,
  type KelasOtomatisCreateInput,
} from "@/lib/validators/jadwalOtomatis.schema";
import { generateSchedule } from "./generate";

export type KelasOtomatisRow = {
  id: string;
  namaKelas: string;
  programName: string;
  programCode: string;
  classTypeName: string;
  mode: string;
  startDate: string;
  endDate: string | null;
  lokasi: string | null;
  status: string;
  totalSessions: number;
  createdAt: Date;
};

export async function listKelasOtomatis(): Promise<KelasOtomatisRow[]> {
  await requirePermission("jadwalUjian", "view");

  const rows = await db
    .select({
      id: kelasPelatihan.id,
      namaKelas: kelasPelatihan.namaKelas,
      programName: programs.name,
      programCode: programs.code,
      classTypeName: classTypes.name,
      mode: kelasPelatihan.mode,
      startDate: kelasPelatihan.startDate,
      endDate: kelasPelatihan.endDate,
      lokasi: kelasPelatihan.lokasi,
      status: kelasPelatihan.status,
      totalSessions:
        sql<number>`COALESCE((SELECT COUNT(*) FROM ${classSessions} WHERE ${classSessions.kelasId} = ${kelasPelatihan.id})::int, 0)`.as(
          "total_sessions",
        ),
      createdAt: kelasPelatihan.createdAt,
    })
    .from(kelasPelatihan)
    .leftJoin(programs, eq(kelasPelatihan.programId, programs.id))
    .leftJoin(classTypes, eq(kelasPelatihan.classTypeId, classTypes.id))
    .orderBy(asc(kelasPelatihan.createdAt));

  return rows as KelasOtomatisRow[];
}

export async function createKelasOtomatis(data: KelasOtomatisCreateInput) {
  const parsed = kelasOtomatisCreateSchema.parse(data);
  await requirePermission("jadwalUjian", "manage");

  const id = nanoid();

  // Insert excluded dates
  if (parsed.excludedDates.length > 0) {
    const uniqueDates = [...new Set(parsed.excludedDates)];
    for (const date of uniqueDates) {
      try {
        await db
          .insert(classExcludedDates)
          .values({ id: nanoid(), kelasId: id, date, reason: "Manual" })
          .onConflictDoNothing();
      } catch {
        // skip duplicate
      }
    }
  }

  // Insert kelas
  const rows = await db
    .insert(kelasPelatihan)
    .values({
      id,
      namaKelas: parsed.namaKelas,
      programId: parsed.programId,
      classTypeId: parsed.classTypeId,
      mode: parsed.mode ?? "offline",
      startDate: parsed.startDate,
      lokasi: parsed.lokasi || null,
      status: "active",
    })
    .returning();

  const row = rows[0];
  if (!row) throw new Error("Gagal membuat kelas");

  // Generate schedule
  await generateSchedule({
    kelasId: id,
    programId: parsed.programId,
    classTypeId: parsed.classTypeId,
    startDate: parsed.startDate,
  });

  // Update end date based on last session
  const lastSessions = await db
    .select()
    .from(classSessions)
    .where(eq(classSessions.kelasId, id))
    .orderBy(asc(classSessions.scheduledDate));

  const lastSession = lastSessions[lastSessions.length - 1];
  if (lastSession) {
    await db
      .update(kelasPelatihan)
      .set({ endDate: lastSession.scheduledDate, updatedAt: new Date() })
      .where(eq(kelasPelatihan.id, id));
  }

  revalidatePath("/jadwal-otomatis");
  return { ok: true as const, data: row };
}

export async function getKelasOtomatisDetail(id: string) {
  await requirePermission("jadwalUjian", "view");

  const row = await db
    .select({
      id: kelasPelatihan.id,
      namaKelas: kelasPelatihan.namaKelas,
      programId: kelasPelatihan.programId,
      programName: programs.name,
      programCode: programs.code,
      classTypeId: kelasPelatihan.classTypeId,
      classTypeName: classTypes.name,
      mode: kelasPelatihan.mode,
      startDate: kelasPelatihan.startDate,
      endDate: kelasPelatihan.endDate,
      lokasi: kelasPelatihan.lokasi,
      status: kelasPelatihan.status,
      createdAt: kelasPelatihan.createdAt,
    })
    .from(kelasPelatihan)
    .leftJoin(programs, eq(kelasPelatihan.programId, programs.id))
    .leftJoin(classTypes, eq(kelasPelatihan.classTypeId, classTypes.id))
    .where(eq(kelasPelatihan.id, id))
    .then((r) => r[0] ?? null);

  return row;
}

export async function getSessionsByKelas(kelasId: string) {
  await requirePermission("jadwalUjian", "view");

  return db
    .select()
    .from(classSessions)
    .where(eq(classSessions.kelasId, kelasId))
    .orderBy(asc(classSessions.scheduledDate));
}

export async function deleteKelasOtomatis(id: string) {
  await requirePermission("jadwalUjian", "configure");

  await db.delete(kelasPelatihan).where(eq(kelasPelatihan.id, id));

  revalidatePath("/jadwal-otomatis");
  return { ok: true as const };
}
