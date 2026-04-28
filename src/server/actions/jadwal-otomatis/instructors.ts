"use server";

import { eq, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { z } from "zod";
import { db } from "@/server/db";
import { instructors } from "@/server/db/schema";
import { requirePermission } from "@/server/actions/auth";

const instructorCreateSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(200),
  email: z.string().email("Email tidak valid").optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
});

const instructorUpdateSchema = instructorCreateSchema.extend({
  id: z.string().min(1),
  isActive: z.boolean().optional(),
});

export type InstructorRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  expertiseCount: number;
  createdAt: Date;
};

export async function listInstructors() {
  await requirePermission("jadwalUjian", "view");

  return db
    .select()
    .from(instructors)
    .orderBy(asc(instructors.name));
}

export async function createInstructor(data: z.infer<typeof instructorCreateSchema>) {
  const parsed = instructorCreateSchema.parse(data);
  await requirePermission("jadwalUjian", "manage");

  const id = nanoid();
  await db.insert(instructors).values({
    id,
    name: parsed.name,
    email: parsed.email || null,
    phone: parsed.phone || null,
  });

  revalidatePath("/jadwal-otomatis/instruktur");
  return { ok: true as const, id };
}

export async function updateInstructor(data: z.infer<typeof instructorUpdateSchema>) {
  const parsed = instructorUpdateSchema.parse(data);
  await requirePermission("jadwalUjian", "manage");

  await db
    .update(instructors)
    .set({
      name: parsed.name,
      email: parsed.email || null,
      phone: parsed.phone || null,
      ...(parsed.isActive !== undefined ? { isActive: parsed.isActive } : {}),
      updatedAt: new Date(),
    })
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
