"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import {
  generateQRDataURL,
  buildVCard,
  buildVerifikasiSuratPayload,
} from "@/lib/qr/generateQR";
import { requirePermission, requireSession } from "./auth";

const qrContactSchema = z.object({ userId: z.string().min(1) });

// Generate QR vCard untuk pegawai.
export async function generateQRContact(input: unknown) {
  const data = qrContactSchema.parse(input);
  const session = await requireSession();

  const role = (session.user as { role?: string }).role;
  if (role !== "admin" && session.user.id !== data.userId) {
    throw new Error("Forbidden");
  }

  const [user] = await db.select().from(users).where(eq(users.id, data.userId));
  if (!user) throw new Error("Pegawai tidak ditemukan");

  const vcard = buildVCard({
    namaLengkap: user.namaLengkap,
    email: user.email,
    noHp: user.noHp,
    jabatan: user.jabatan,
    organisasi: "IAI Wilayah Jakarta",
  });
  const dataUrl = await generateQRDataURL(vcard, { size: 512 });

  await db
    .update(users)
    .set({ qrContactUrl: dataUrl })
    .where(eq(users.id, data.userId));

  return { dataUrl };
}

const qrSuratSchema = z.object({
  jenis: z.enum(["surat-keluar", "surat-keputusan", "surat-mou"]),
  id: z.string().uuid(),
  nomor: z.string().optional(),
});

export async function generateQRSurat(input: unknown) {
  const data = qrSuratSchema.parse(input);
  await requirePermission("suratKeluar", "generate");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const payload = buildVerifikasiSuratPayload({
    appUrl,
    jenis: data.jenis,
    id: data.id,
    nomor: data.nomor,
  });
  const dataUrl = await generateQRDataURL(payload, { size: 512 });
  return { dataUrl, payload };
}
