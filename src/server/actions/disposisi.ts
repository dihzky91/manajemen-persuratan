"use server";

import { desc, eq, and } from "drizzle-orm";
import { db } from "@/server/db";
import { disposisi, suratMasuk, users, auditLog } from "@/server/db/schema";
import {
  disposisiCreateSchema,
  disposisiUpdateStatusSchema,
} from "@/lib/validators/disposisi.schema";
import { requireRole, requireSession } from "./auth";
import { sendEmail, buildDisposisiEmail } from "@/lib/email/mailjet";

export async function inboxDisposisi() {
  const session = await requireSession();
  return db
    .select()
    .from(disposisi)
    .where(eq(disposisi.kepadaUserId, session.user.id as string))
    .orderBy(desc(disposisi.tanggalDisposisi));
}

export async function createDisposisi(data: unknown) {
  const parsed = disposisiCreateSchema.parse(data);
  const session = await requireRole(["admin", "pejabat"]);

  const [row] = await db
    .insert(disposisi)
    .values({
      id: crypto.randomUUID(),
      ...parsed,
      dariUserId: session.user.id as string,
    })
    .returning();

  // Ambil data penerima + surat untuk email notifikasi
  const [penerima] = await db
    .select()
    .from(users)
    .where(eq(users.id, parsed.kepadaUserId));
  const [surat] = await db
    .select()
    .from(suratMasuk)
    .where(eq(suratMasuk.id, parsed.suratMasukId));

  if (penerima && surat) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const email = buildDisposisiEmail({
      penerimaNama: penerima.namaLengkap,
      pengirimNama: session.user.name ?? "Pengirim",
      perihalSurat: surat.perihal,
      instruksi: parsed.instruksi ?? null,
      batasWaktu: parsed.batasWaktu ?? null,
      inboxUrl: `${appUrl}/disposisi`,
    });
    // fire-and-forget — jangan block response
    void sendEmail({ to: penerima.email, toName: penerima.namaLengkap, ...email });
  }

  await db.insert(auditLog).values({
    userId: session.user.id as string,
    aksi: "CREATE_DISPOSISI",
    entitasType: "disposisi",
    entitasId: row!.id,
    detail: { suratMasukId: parsed.suratMasukId, kepada: parsed.kepadaUserId },
  });

  return row!;
}

export async function updateStatusDisposisi(data: unknown) {
  const parsed = disposisiUpdateStatusSchema.parse(data);
  const session = await requireSession();

  const patch: Record<string, unknown> = { status: parsed.status };
  if (parsed.status === "dibaca") patch.tanggalDibaca = new Date();
  if (parsed.status === "selesai") patch.tanggalSelesai = new Date();

  const [row] = await db
    .update(disposisi)
    .set(patch)
    .where(
      and(
        eq(disposisi.id, parsed.id),
        eq(disposisi.kepadaUserId, session.user.id as string),
      ),
    )
    .returning();

  return row ?? null;
}
