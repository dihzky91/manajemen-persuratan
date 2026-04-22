"use server";

import { desc, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { suratKeluar, auditLog } from "@/server/db/schema";
import {
  suratKeluarCreateSchema,
  suratKeluarStatusSchema,
} from "@/lib/validators/suratKeluar.schema";
import { requireRole, requireSession } from "./auth";

export async function listSuratKeluar() {
  await requireSession();
  return db
    .select()
    .from(suratKeluar)
    .orderBy(desc(suratKeluar.createdAt))
    .limit(50);
}

export async function getSuratKeluarById(id: string) {
  await requireSession();
  const [row] = await db
    .select()
    .from(suratKeluar)
    .where(eq(suratKeluar.id, id));
  return row ?? null;
}

export async function createSuratKeluar(data: unknown) {
  const parsed = suratKeluarCreateSchema.parse(data);
  const session = await requireRole(["admin", "pejabat", "staff"]);
  const [row] = await db
    .insert(suratKeluar)
    .values({
      id: crypto.randomUUID(),
      ...parsed,
      dibuatOleh: session.user.id as string,
      status: "draft",
    })
    .returning();

  await db.insert(auditLog).values({
    userId: session.user.id as string,
    aksi: "CREATE_SURAT_KELUAR",
    entitasType: "surat_keluar",
    entitasId: row!.id,
    detail: { perihal: parsed.perihal, tujuan: parsed.tujuan },
  });

  return row!;
}

export async function updateStatusSuratKeluar(data: unknown) {
  const parsed = suratKeluarStatusSchema.parse(data);
  const session = await requireRole(["admin", "pejabat"]);
  const [row] = await db
    .update(suratKeluar)
    .set({
      status: parsed.status,
      catatanReviu: parsed.catatanReviu,
      updatedAt: new Date(),
    })
    .where(eq(suratKeluar.id, parsed.id))
    .returning();

  await db.insert(auditLog).values({
    userId: session.user.id as string,
    aksi: "UPDATE_STATUS_SURAT_KELUAR",
    entitasType: "surat_keluar",
    entitasId: parsed.id,
    detail: { status: parsed.status },
  });

  return row!;
}
