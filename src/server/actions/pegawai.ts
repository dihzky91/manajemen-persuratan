"use server";

import { desc, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { users, pegawaiBiodata, auditLog } from "@/server/db/schema";
import { pegawaiCreateSchema, biodataSchema } from "@/lib/validators/pegawai.schema";
import { requireRole, requireSession } from "./auth";

export async function listPegawai() {
  await requireSession();
  return db
    .select()
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(100);
}

export async function getPegawaiById(id: string) {
  await requireSession();
  const [user] = await db.select().from(users).where(eq(users.id, id));
  const [biodata] = await db
    .select()
    .from(pegawaiBiodata)
    .where(eq(pegawaiBiodata.userId, id));
  return { user: user ?? null, biodata: biodata ?? null };
}

export async function createPegawai(data: unknown) {
  const parsed = pegawaiCreateSchema.parse(data);
  const session = await requireRole(["admin"]);
  const [row] = await db.insert(users).values({ id: crypto.randomUUID(), ...parsed }).returning();

  await db.insert(auditLog).values({
    userId: session.user.id as string,
    aksi: "CREATE_PEGAWAI",
    entitasType: "users",
    entitasId: row!.id,
    detail: { email: parsed.email, namaLengkap: parsed.namaLengkap },
  });

  return row!;
}

export async function upsertBiodata(data: unknown) {
  const parsed = biodataSchema.parse(data);
  const session = await requireSession();
  const role = (session.user as { role?: string }).role;
  if (role !== "admin" && session.user.id !== parsed.userId) {
    throw new Error("Forbidden");
  }

  const existing = await db
    .select()
    .from(pegawaiBiodata)
    .where(eq(pegawaiBiodata.userId, parsed.userId));

  if (existing[0]) {
    const [row] = await db
      .update(pegawaiBiodata)
      .set({ ...parsed, updatedAt: new Date() })
      .where(eq(pegawaiBiodata.userId, parsed.userId))
      .returning();
    return row!;
  }

  const [row] = await db.insert(pegawaiBiodata).values(parsed).returning();
  return row!;
}
