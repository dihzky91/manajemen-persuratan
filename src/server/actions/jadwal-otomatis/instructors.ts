"use server";

import { eq, asc, and, gte, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { z } from "zod";
import { db } from "@/server/db";
import {
  instructors,
  instructorExpertise,
  classSessions,
  sessionAssignments,
  kelasPelatihan,
} from "@/server/db/schema";
import { requirePermission } from "@/server/actions/auth";

const expertiseLevelSchema = z.enum(["basic", "middle", "senior"]);

const instructorExpertiseInputSchema = z.object({
  programId: z.string().min(1),
  materiBlock: z.string().trim().min(1).max(100),
  level: expertiseLevelSchema.default("middle"),
});

const instructorCreateSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(200),
  email: z.string().email("Email tidak valid").optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  expertise: z
    .array(instructorExpertiseInputSchema)
    .min(1, "Minimal satu keahlian harus diisi"),
});

const instructorUpdateSchema = z
  .object({
  id: z.string().min(1),
    name: z.string().trim().min(2, "Nama minimal 2 karakter").max(200).optional(),
    email: z.string().email("Email tidak valid").optional().or(z.literal("")),
    phone: z.string().trim().max(30).optional().or(z.literal("")),
  isActive: z.boolean().optional(),
  })
  .refine(
    (value) =>
      value.name !== undefined ||
      value.email !== undefined ||
      value.phone !== undefined ||
      value.isActive !== undefined,
    {
      message: "Tidak ada perubahan data.",
    },
  );

export type InstructorRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  expertiseCount: number;
  weeklySessions: number;
  monthlySessions: number;
  activeClassCount: number;
  createdAt: Date;
};

export async function listInstructors() {
  await requirePermission("jadwalUjian", "view");

  const rows = await db
    .select()
    .from(instructors)
    .orderBy(asc(instructors.name));

  if (rows.length === 0) return [];

  const instructorIds = rows.map((row) => row.id);
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekEndStr = weekEnd.toISOString().slice(0, 10);
  const monthEnd = new Date(today);
  monthEnd.setDate(monthEnd.getDate() + 29);
  const monthEndStr = monthEnd.toISOString().slice(0, 10);

  const [expertiseRows, upcomingRows] = await Promise.all([
    db
      .select({ instructorId: instructorExpertise.instructorId })
      .from(instructorExpertise)
      .where(inArray(instructorExpertise.instructorId, instructorIds)),
    db
      .select({
        instructorId: sessionAssignments.plannedInstructorId,
        scheduledDate: classSessions.scheduledDate,
        kelasId: classSessions.kelasId,
      })
      .from(sessionAssignments)
      .innerJoin(classSessions, eq(sessionAssignments.sessionId, classSessions.id))
      .innerJoin(kelasPelatihan, eq(classSessions.kelasId, kelasPelatihan.id))
      .where(
        and(
          inArray(sessionAssignments.plannedInstructorId, instructorIds),
          gte(classSessions.scheduledDate, todayStr),
          eq(kelasPelatihan.status, "active"),
        ),
      ),
  ]);

  const expertiseCountByInstructor = new Map<string, number>();
  for (const row of expertiseRows) {
    expertiseCountByInstructor.set(
      row.instructorId,
      (expertiseCountByInstructor.get(row.instructorId) ?? 0) + 1,
    );
  }

  const weeklySessionsByInstructor = new Map<string, number>();
  const monthlySessionsByInstructor = new Map<string, number>();
  const activeClassByInstructor = new Map<string, Set<string>>();

  for (const row of upcomingRows) {
    const activeClasses = activeClassByInstructor.get(row.instructorId) ?? new Set<string>();
    activeClasses.add(row.kelasId);
    activeClassByInstructor.set(row.instructorId, activeClasses);

    if (row.scheduledDate <= weekEndStr) {
      weeklySessionsByInstructor.set(
        row.instructorId,
        (weeklySessionsByInstructor.get(row.instructorId) ?? 0) + 1,
      );
    }

    if (row.scheduledDate <= monthEndStr) {
      monthlySessionsByInstructor.set(
        row.instructorId,
        (monthlySessionsByInstructor.get(row.instructorId) ?? 0) + 1,
      );
    }
  }

  return rows.map((row) => ({
    ...row,
    expertiseCount: expertiseCountByInstructor.get(row.id) ?? 0,
    weeklySessions: weeklySessionsByInstructor.get(row.id) ?? 0,
    monthlySessions: monthlySessionsByInstructor.get(row.id) ?? 0,
    activeClassCount: activeClassByInstructor.get(row.id)?.size ?? 0,
  }));
}

export async function createInstructor(data: z.infer<typeof instructorCreateSchema>) {
  const parsed = instructorCreateSchema.parse(data);
  await requirePermission("jadwalUjian", "manage");

  const id = nanoid();
  const uniqueExpertise = new Map<string, z.infer<typeof instructorExpertiseInputSchema>>();

  for (const item of parsed.expertise) {
    const materiBlock = item.materiBlock.trim();
    const dedupeKey = `${item.programId}::${materiBlock.toLowerCase()}`;
    if (!uniqueExpertise.has(dedupeKey)) {
      uniqueExpertise.set(dedupeKey, {
        programId: item.programId,
        materiBlock,
        level: item.level,
      });
    }
  }

  await db.insert(instructors).values({
    id,
    name: parsed.name,
    email: parsed.email || null,
    phone: parsed.phone || null,
  });

  try {
    if (uniqueExpertise.size > 0) {
      await db.insert(instructorExpertise).values(
        Array.from(uniqueExpertise.values()).map((item) => ({
          id: nanoid(),
          instructorId: id,
          programId: item.programId,
          materiBlock: item.materiBlock,
          level: item.level,
        })),
      );
    }
  } catch (error) {
    await db.delete(instructors).where(eq(instructors.id, id));
    throw error;
  }

  revalidatePath("/jadwal-otomatis/instruktur");
  return { ok: true as const, id };
}

export async function updateInstructor(data: z.infer<typeof instructorUpdateSchema>) {
  const parsed = instructorUpdateSchema.parse(data);
  await requirePermission("jadwalUjian", "manage");

  const updatePayload: {
    name?: string;
    email?: string | null;
    phone?: string | null;
    isActive?: boolean;
    updatedAt: Date;
  } = {
    updatedAt: new Date(),
  };

  if (parsed.name !== undefined) updatePayload.name = parsed.name;
  if (parsed.email !== undefined) updatePayload.email = parsed.email || null;
  if (parsed.phone !== undefined) updatePayload.phone = parsed.phone || null;
  if (parsed.isActive !== undefined) updatePayload.isActive = parsed.isActive;

  await db
    .update(instructors)
    .set(updatePayload)
    .where(eq(instructors.id, parsed.id));

  revalidatePath("/jadwal-otomatis/instruktur");
  return { ok: true as const };
}

export async function deleteInstructor(id: string) {
  await requirePermission("jadwalUjian", "configure");

  await db.delete(instructors).where(eq(instructors.id, id));

  revalidatePath("/jadwal-otomatis/instruktur");
  return { ok: true as const };
}
