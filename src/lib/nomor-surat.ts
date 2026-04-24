import { sql } from "drizzle-orm";
import { db } from "@/server/db";
import { formatBulanRomawi } from "@/lib/utils";

const DEFAULT_PREFIX = "IAI-DKIJKT";
type DbExecutor = Pick<typeof db, "execute">;

type AllocateNomorSuratInput = {
  tahun: number;
  bulan: number;
  jenisSurat: string;
  jumlah?: number;
  prefixOverride?: string;
};

export type AllocateNomorSuratResult = {
  nomorList: string[];
  prefix: string;
  bulanRomawi: string;
  tahun: number;
  startCounter: number;
  endCounter: number;
  jumlah: number;
};

export async function allocateNomorSurat(
  input: AllocateNomorSuratInput,
  executor: DbExecutor = db,
): Promise<AllocateNomorSuratResult> {
  const jumlah = input.jumlah ?? 1;
  const prefixCandidate = input.prefixOverride ?? DEFAULT_PREFIX;

  const upsert = await executor.execute(sql`
    INSERT INTO nomor_surat_counter (tahun, bulan, jenis_surat, counter, prefix, updated_at)
    VALUES (${input.tahun}, ${input.bulan}, ${input.jenisSurat}, ${jumlah}, ${prefixCandidate}, NOW())
    ON CONFLICT (tahun, bulan, jenis_surat)
    DO UPDATE SET
      counter = nomor_surat_counter.counter + ${jumlah},
      prefix = COALESCE(${input.prefixOverride ?? null}, nomor_surat_counter.prefix, ${DEFAULT_PREFIX}),
      updated_at = NOW()
    RETURNING counter, prefix
  `);

  const row = (upsert.rows as { counter: number; prefix: string | null }[])[0];
  if (!row) {
    throw new Error(
      jumlah > 1 ? "Gagal menggenerate bulk nomor surat" : "Gagal menggenerate nomor surat",
    );
  }

  const endCounter = row.counter;
  const startCounter = endCounter - jumlah + 1;
  const prefix = row.prefix ?? DEFAULT_PREFIX;
  const bulanRomawi = formatBulanRomawi(input.bulan);
  const nomorList = Array.from({ length: jumlah }, (_, index) => {
    const counter = startCounter + index;
    return `${counter}/${prefix}/${bulanRomawi}/${input.tahun}`;
  });

  return {
    nomorList,
    prefix,
    bulanRomawi,
    tahun: input.tahun,
    startCounter,
    endCounter,
    jumlah,
  };
}
