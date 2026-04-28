"use server";

import { asc, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { classTypes } from "@/server/db/schema";
import { requireSession } from "@/server/actions/auth";

export async function listClassTypes() {
  await requireSession();
  return db.select().from(classTypes).orderBy(asc(classTypes.name));
}
