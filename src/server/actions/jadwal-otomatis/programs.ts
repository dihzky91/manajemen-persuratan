"use server";

import { asc, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { programs } from "@/server/db/schema";
import { requireSession } from "@/server/actions/auth";

export async function listPrograms() {
  await requireSession();
  return db.select().from(programs).where(eq(programs.isActive, true)).orderBy(asc(programs.name));
}

export async function getProgram(id: string) {
  await requireSession();
  const rows = await db.select().from(programs).where(eq(programs.id, id));
  return rows[0] ?? null;
}
