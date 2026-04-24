"use server";

import { z } from "zod";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { nomorSuratCounter, auditLog, jenisSuratEnum } from "@/server/db/schema";
import { formatBulanRomawi } from "@/lib/utils";
import { requireRole, requireSession } from "./auth";

export const jenisSuratValues = jenisSuratEnum.enumValues;

const generateNomorSchema = z.object({
  jenisSurat: z.enum(jenisSuratValues),
  bulan: z.number().int().min(1).max(12),
  tahun: z.number().int().min(2020).max(2100),
  prefixOverride: z.string().max(80).optional(),
});

const updatePrefixSchema = z.object({
  id: z.number().int().positive(),
  prefix: z.string().min(1, "Prefix wajib diisi.").max(80),
});

export type NomorSuratCounterRow = {
  id: number;
  tahun: number;
  bulan: number;
  jenisSurat: string;
  counter: number;
  prefix: string | null;
  updatedAt: Date | null;
};

export async function listNomorSuratCounters(): Promise<NomorSuratCounterRow[]> {
  await requireSession();
  return db
    .select({
      id: nomorSuratCounter.id,
      tahun: nomorSuratCounter.tahun,
      bulan: nomorSuratCounter.bulan,
      jenisSurat: nomorSuratCounter.jenisSurat,
      counter: nomorSuratCounter.counter,
      prefix: nomorSuratCounter.prefix,
      updatedAt: nomorSuratCounter.updatedAt,
    })
    .from(nomorSuratCounter)
    .orderBy(
      desc(nomorSuratCounter.tahun),
      desc(nomorSuratCounter.bulan),
      desc(nomorSuratCounter.updatedAt),
    )
    .limit(200);
}

// Generate nomor surat atomic.
// Format final: "{counter}/{prefix}/{bulanRomawi}/{tahun}"
// WAJIB: pakai DB transaction + SELECT FOR UPDATE untuk mencegah race condition
export async function generateNomorSurat(input: unknown) {
  const data = generateNomorSchema.parse(input);
  const session = await requireRole(["admin", "pejabat"]);

  const result = await db.transaction(async (tx) => {
    const prefixCandidate = data.prefixOverride ?? "IAI-DKIJKT";
    const upsert = await tx.execute(sql`
      INSERT INTO nomor_surat_counter (tahun, bulan, jenis_surat, counter, prefix, updated_at)
      VALUES (${data.tahun}, ${data.bulan}, ${data.jenisSurat}, 1, ${prefixCandidate}, NOW())
      ON CONFLICT (tahun, bulan, jenis_surat)
      DO UPDATE SET
        counter = nomor_surat_counter.counter + 1,
        prefix = COALESCE(${data.prefixOverride ?? null}, nomor_surat_counter.prefix, ${"IAI-DKIJKT"}),
        updated_at = NOW()
      RETURNING counter, prefix
    `);

    const row = (upsert.rows as { counter: number; prefix: string | null }[])[0];
    if (!row) throw new Error("Gagal menggenerate nomor surat");

    const counter = row.counter;
    const prefix = row.prefix ?? "IAI-DKIJKT";

    const bulanRomawi = formatBulanRomawi(data.bulan);
    const nomor = `${counter}/${prefix}/${bulanRomawi}/${data.tahun}`;

    return { nomor, counter, prefix, bulanRomawi, tahun: data.tahun };
  });

  await db.insert(auditLog).values({
    userId: session.user.id as string,
    aksi: "GENERATE_NOMOR_SURAT",
    entitasType: "nomor_surat_counter",
    entitasId: `${data.tahun}-${data.bulan}-${data.jenisSurat}`,
    detail: { nomor: result.nomor },
  });

  return result;
}

export async function updateNomorSuratCounterPrefix(input: unknown) {
  const data = updatePrefixSchema.parse(input);
  const session = await requireRole(["admin"]);

  const [row] = await db
    .update(nomorSuratCounter)
    .set({
      prefix: data.prefix,
      updatedAt: new Date(),
    })
    .where(eq(nomorSuratCounter.id, data.id))
    .returning();

  if (!row) {
    return { ok: false as const, error: "Counter nomor surat tidak ditemukan." };
  }

  await db.insert(auditLog).values({
    userId: session.user.id as string,
    aksi: "UPDATE_PREFIX_NOMOR_SURAT",
    entitasType: "nomor_surat_counter",
    entitasId: String(data.id),
    detail: { prefix: data.prefix },
  });

  return { ok: true as const, data: row };
}
