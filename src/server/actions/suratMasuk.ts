"use server";

import { desc, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { suratMasuk, auditLog } from "@/server/db/schema";
import { suratMasukCreateSchema } from "@/lib/validators/suratMasuk.schema";
import { requireRole, requireSession } from "./auth";

export async function listSuratMasuk() {
  await requireSession();
  return db
    .select()
    .from(suratMasuk)
    .orderBy(desc(suratMasuk.tanggalDiterima))
    .limit(50);
}

export async function getSuratMasukById(id: string) {
  await requireSession();
  const [row] = await db.select().from(suratMasuk).where(eq(suratMasuk.id, id));
  return row ?? null;
}

export async function createSuratMasuk(data: unknown) {
  const parsed = suratMasukCreateSchema.parse(data);
  const session = await requireRole(["admin", "staff"]);
  const [row] = await db
    .insert(suratMasuk)
    .values({
      id: crypto.randomUUID(),
      ...parsed,
      dicatatOleh: session.user.id as string,
    })
    .returning();

  await db.insert(auditLog).values({
    userId: session.user.id as string,
    aksi: "CREATE_SURAT_MASUK",
    entitasType: "surat_masuk",
    entitasId: row!.id,
    detail: { perihal: parsed.perihal, pengirim: parsed.pengirim },
  });

  return row!;
}
