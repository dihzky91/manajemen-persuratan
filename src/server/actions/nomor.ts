"use server";

import { z } from "zod";
import { eq, and, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { nomorSuratCounter, auditLog, jenisSuratEnum } from "@/server/db/schema";
import { formatBulanRomawi } from "@/lib/utils";
import { requireRole } from "./auth";

const jenisSuratValues = jenisSuratEnum.enumValues;

const generateNomorSchema = z.object({
  jenisSurat: z.enum(jenisSuratValues),
  bulan: z.number().int().min(1).max(12),
  tahun: z.number().int().min(2020).max(2100),
  prefixOverride: z.string().max(80).optional(),
});

// Generate nomor surat atomic.
// Format final: "{counter}/{prefix}/{bulanRomawi}/{tahun}"
// WAJIB: pakai DB transaction + SELECT FOR UPDATE untuk mencegah race condition
export async function generateNomorSurat(input: unknown) {
  const data = generateNomorSchema.parse(input);
  const session = await requireRole(["admin", "pejabat"]);

  const result = await db.transaction(async (tx) => {
    const existing = await tx.execute(sql`
      SELECT id, counter, prefix
      FROM ${nomorSuratCounter}
      WHERE tahun = ${data.tahun}
        AND bulan = ${data.bulan}
        AND jenis_surat = ${data.jenisSurat}
      FOR UPDATE
    `);

    let counter: number;
    let prefix: string;

    const row = (existing.rows as { id: number; counter: number; prefix: string | null }[])[0];

    if (!row) {
      counter = 1;
      prefix = data.prefixOverride ?? "IAI-DKIJKT";
      await tx.insert(nomorSuratCounter).values({
        tahun: data.tahun,
        bulan: data.bulan,
        jenisSurat: data.jenisSurat,
        counter,
        prefix,
      });
    } else {
      counter = row.counter + 1;
      prefix = data.prefixOverride ?? row.prefix ?? "IAI-DKIJKT";
      await tx
        .update(nomorSuratCounter)
        .set({ counter, prefix, updatedAt: new Date() })
        .where(
          and(
            eq(nomorSuratCounter.tahun, data.tahun),
            eq(nomorSuratCounter.bulan, data.bulan),
            eq(nomorSuratCounter.jenisSurat, data.jenisSurat),
          ),
        );
    }

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
