"use server";

import { eq, and, asc, or, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { z } from "zod";
import { db } from "@/server/db";
import {
  sessionAssignments,
  classSessions,
  kelasPelatihan,
  programs,
  instructors,
} from "@/server/db/schema";
import { requirePermission } from "@/server/actions/auth";

// ─── ASSIGN ────────────────────────────────────────────────────────────────

const assignSchema = z.object({
  sessionId: z.string().min(1),
  plannedInstructorId: z.string().min(1),
});

export async function assignInstructorToSession(data: z.infer<typeof assignSchema>) {
  const parsed = assignSchema.parse(data);
  await requirePermission("jadwalUjian", "manage");

  // Cek existing
  const existing = await db
    .select()
    .from(sessionAssignments)
    .where(
      and(
        eq(sessionAssignments.sessionId, parsed.sessionId),
        eq(sessionAssignments.plannedInstructorId, parsed.plannedInstructorId),
      ),
    );

  if (existing.length > 0) return { ok: true as const };

  await db.insert(sessionAssignments).values({
    id: nanoid(),
    sessionId: parsed.sessionId,
    plannedInstructorId: parsed.plannedInstructorId,
  });

  revalidatePath("/jadwal-otomatis");
  return { ok: true as const };
}

// ─── BULK ASSIGN BY BLOCK ──────────────────────────────────────────────────

export async function assignInstructorToBlock(
  kelasId: string,
  instrukturId: string,
  materiBlock: string,
) {
  await requirePermission("jadwalUjian", "manage");

  // Cari semua sesi dalam kelas ini yang belong ke materiBlock
  const sessions = await db
    .select()
    .from(classSessions)
    .where(
      and(
        eq(classSessions.kelasId, kelasId),
        eq(classSessions.materiName, materiBlock),
        eq(classSessions.isExamDay, false),
      ),
    );

  for (const s of sessions) {
    const existing = await db
      .select()
      .from(sessionAssignments)
      .where(eq(sessionAssignments.sessionId, s.id));

    if (existing.length > 0) continue;

    await db.insert(sessionAssignments).values({
      id: nanoid(),
      sessionId: s.id,
      plannedInstructorId: instrukturId,
    });
  }

  revalidatePath("/jadwal-otomatis");
  return { ok: true as const, assignedCount: sessions.length };
}

// ─── SUBSTITUTE ────────────────────────────────────────────────────────────

export async function substituteInstructor(
  assignmentId: string,
  newInstructorId: string,
  reason: string,
) {
  await requirePermission("jadwalUjian", "manage");

  await db
    .update(sessionAssignments)
    .set({
      actualInstructorId: newInstructorId,
      substitutionReason: reason,
      updatedAt: new Date(),
    })
    .where(eq(sessionAssignments.id, assignmentId));

  revalidatePath("/jadwal-otomatis");
  return { ok: true as const };
}

// ─── GET ASSIGNMENTS FOR KELAS ─────────────────────────────────────────────

export async function getAssignmentsByKelas(kelasId: string) {
  await requirePermission("jadwalUjian", "view");

  return db
    .select({
      assignmentId: sessionAssignments.id,
      sessionId: sessionAssignments.sessionId,
      sessionNumber: classSessions.sessionNumber,
      scheduledDate: classSessions.scheduledDate,
      materiName: classSessions.materiName,
      isExamDay: classSessions.isExamDay,
      plannedInstructorId: sessionAssignments.plannedInstructorId,
      plannedInstructorName: instructors.name,
      actualInstructorId: sessionAssignments.actualInstructorId,
      substitutionReason: sessionAssignments.substitutionReason,
    })
    .from(sessionAssignments)
    .innerJoin(classSessions, eq(sessionAssignments.sessionId, classSessions.id))
    .innerJoin(instructors, eq(sessionAssignments.plannedInstructorId, instructors.id))
    .where(eq(classSessions.kelasId, kelasId))
    .orderBy(asc(classSessions.scheduledDate));
}

// ─── GET ASSIGNMENTS FOR SESSION ────────────────────────────────────────────

export async function getAssignmentsBySession(sessionId: string) {
  await requirePermission("jadwalUjian", "view");

  return db
    .select()
    .from(sessionAssignments)
    .innerJoin(instructors, eq(sessionAssignments.plannedInstructorId, instructors.id))
    .where(eq(sessionAssignments.sessionId, sessionId));
}

// ─── HISTORI MENGAJAR ──────────────────────────────────────────────────────

export async function getTeachingHistory(instructorId: string) {
  await requirePermission("jadwalUjian", "view");

  return db
    .select({
      assignmentId: sessionAssignments.id,
      sessionId: sessionAssignments.sessionId,
      kelasId: kelasPelatihan.id,
      namaKelas: kelasPelatihan.namaKelas,
      programName: programs.name,
      scheduledDate: classSessions.scheduledDate,
      materiName: classSessions.materiName,
      sessionNumber: classSessions.sessionNumber,
      isExamDay: classSessions.isExamDay,
      isSubstitute: sql<boolean>`${sessionAssignments.actualInstructorId} is not null`,
      substitutionReason: sessionAssignments.substitutionReason,
    })
    .from(sessionAssignments)
    .innerJoin(classSessions, eq(sessionAssignments.sessionId, classSessions.id))
    .innerJoin(kelasPelatihan, eq(classSessions.kelasId, kelasPelatihan.id))
    .innerJoin(programs, eq(kelasPelatihan.programId, programs.id))
    .where(
      or(
        eq(sessionAssignments.plannedInstructorId, instructorId),
        eq(sessionAssignments.actualInstructorId, instructorId),
      ),
    )
    .orderBy(desc(classSessions.scheduledDate));
}

// ─── CONFLICT DETECTION ────────────────────────────────────────────────────

export async function checkInstructorConflict(instructorId: string, tanggal: string) {
  await requirePermission("jadwalUjian", "view");

  const conflictingAssignments = await db
    .select({
      kelasId: kelasPelatihan.id,
      namaKelas: kelasPelatihan.namaKelas,
      sessionNumber: classSessions.sessionNumber,
      scheduledDate: classSessions.scheduledDate,
      timeSlotStart: classSessions.timeSlotStart,
      timeSlotEnd: classSessions.timeSlotEnd,
    })
    .from(sessionAssignments)
    .innerJoin(classSessions, eq(sessionAssignments.sessionId, classSessions.id))
    .innerJoin(kelasPelatihan, eq(classSessions.kelasId, kelasPelatihan.id))
    .where(
      and(
        eq(sessionAssignments.plannedInstructorId, instructorId),
        eq(classSessions.scheduledDate, tanggal),
      ),
    );

  return conflictingAssignments;
}
