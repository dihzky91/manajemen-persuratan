"use server";

import { desc, eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/server/db";
import {
  suratKeluar,
  auditLog,
  divisi,
  users,
  pejabatPenandatangan,
  nomorSuratCounter,
} from "@/server/db/schema";
import {
  suratKeluarCreateSchema,
  suratKeluarUpdateSchema,
} from "@/lib/validators/suratKeluar.schema";
import { requireRole, requireSession } from "./auth";
import { formatBulanRomawi } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SuratKeluarRow = {
  id: string;
  nomorSurat: string | null;
  perihal: string;
  tujuan: string;
  tujuanAlamat: string | null;
  tanggalSurat: string;
  jenisSurat: string;
  isiSingkat: string | null;
  status: string | null;
  fileDraftUrl: string | null;
  catatanReviu: string | null;
  pejabatId: number | null;
  divisiId: number | null;
  divisiNama: string | null;
  dibuatOleh: string | null;
  dibuatOlehNama: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export type PejabatOption = {
  id: number;
  namaJabatan: string;
};

export type DivisiOption = {
  id: number;
  nama: string;
  kode: string | null;
};

const idSchema = z.object({ id: z.string().uuid() });

async function ensureSuratStatus(
  id: string,
  allowedStatuses: Array<NonNullable<typeof suratKeluar.$inferSelect.status>>,
) {
  const [existing] = await db
    .select({ status: suratKeluar.status })
    .from(suratKeluar)
    .where(eq(suratKeluar.id, id));

  if (!existing) {
    return { ok: false as const, error: "Surat tidak ditemukan." };
  }

  const status = existing.status ?? "draft";
  if (!allowedStatuses.includes(status)) {
    return {
      ok: false as const,
      error: `Transisi tidak valid dari status ${status}.`,
    };
  }

  return { ok: true as const, status };
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function listSuratKeluar(): Promise<SuratKeluarRow[]> {
  await requireSession();
  return db
    .select({
      id: suratKeluar.id,
      nomorSurat: suratKeluar.nomorSurat,
      perihal: suratKeluar.perihal,
      tujuan: suratKeluar.tujuan,
      tujuanAlamat: suratKeluar.tujuanAlamat,
      tanggalSurat: suratKeluar.tanggalSurat,
      jenisSurat: suratKeluar.jenisSurat,
      isiSingkat: suratKeluar.isiSingkat,
      status: suratKeluar.status,
      fileDraftUrl: suratKeluar.fileDraftUrl,
      catatanReviu: suratKeluar.catatanReviu,
      pejabatId: suratKeluar.pejabatId,
      divisiId: suratKeluar.divisiId,
      divisiNama: divisi.nama,
      dibuatOleh: suratKeluar.dibuatOleh,
      dibuatOlehNama: users.namaLengkap,
      createdAt: suratKeluar.createdAt,
      updatedAt: suratKeluar.updatedAt,
    })
    .from(suratKeluar)
    .leftJoin(divisi, eq(suratKeluar.divisiId, divisi.id))
    .leftJoin(users, eq(suratKeluar.dibuatOleh, users.id))
    .orderBy(desc(suratKeluar.createdAt))
    .limit(100);
}

export async function listPejabatAktif(): Promise<PejabatOption[]> {
  await requireSession();
  return db
    .select({
      id: pejabatPenandatangan.id,
      namaJabatan: pejabatPenandatangan.namaJabatan,
    })
    .from(pejabatPenandatangan)
    .where(eq(pejabatPenandatangan.isActive, true))
    .orderBy(pejabatPenandatangan.namaJabatan);
}

export async function listDivisiOptions(): Promise<DivisiOption[]> {
  await requireSession();
  return db
    .select({ id: divisi.id, nama: divisi.nama, kode: divisi.kode })
    .from(divisi)
    .orderBy(divisi.nama);
}

export async function getSuratKeluarById(id: string) {
  await requireSession();
  const [row] = await db
    .select()
    .from(suratKeluar)
    .where(eq(suratKeluar.id, id));
  return row ?? null;
}

// ─── Create ──────────────────────────────────────────────────────────────────

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

  revalidatePath("/surat-keluar");
  return { ok: true as const, data: row! };
}

// ─── Update ──────────────────────────────────────────────────────────────────

export async function updateSuratKeluar(data: unknown) {
  const parsed = suratKeluarUpdateSchema.parse(data);
  const session = await requireRole(["admin", "pejabat", "staff"]);

  const [existing] = await db
    .select({ status: suratKeluar.status })
    .from(suratKeluar)
    .where(eq(suratKeluar.id, parsed.id));

  if (!existing) return { ok: false as const, error: "Surat tidak ditemukan." };
  if (existing.status !== "draft") {
    return {
      ok: false as const,
      error: "Surat hanya bisa diubah saat berstatus Draft.",
    };
  }

  const { id, ...rest } = parsed;
  const [row] = await db
    .update(suratKeluar)
    .set({ ...rest, updatedAt: new Date() })
    .where(eq(suratKeluar.id, id))
    .returning();

  await db.insert(auditLog).values({
    userId: session.user.id as string,
    aksi: "UPDATE_SURAT_KELUAR",
    entitasType: "surat_keluar",
    entitasId: id,
    detail: { perihal: parsed.perihal },
  });

  revalidatePath("/surat-keluar");
  return { ok: true as const, data: row! };
}

// ─── Delete ──────────────────────────────────────────────────────────────────

export async function deleteSuratKeluar(data: { id: string }) {
  const { id } = idSchema.parse(data);
  const session = await requireRole(["admin"]);

  const [existing] = await db
    .select({ status: suratKeluar.status, perihal: suratKeluar.perihal })
    .from(suratKeluar)
    .where(eq(suratKeluar.id, id));

  if (!existing) return { ok: false as const, error: "Surat tidak ditemukan." };
  if (existing.status !== "draft" && existing.status !== "dibatalkan") {
    return {
      ok: false as const,
      error: "Hanya surat berstatus Draft atau Dibatalkan yang dapat dihapus.",
    };
  }

  await db.delete(suratKeluar).where(eq(suratKeluar.id, id));

  await db.insert(auditLog).values({
    userId: session.user.id as string,
    aksi: "DELETE_SURAT_KELUAR",
    entitasType: "surat_keluar",
    entitasId: id,
    detail: null,
  });

  revalidatePath("/surat-keluar");
  return { ok: true as const };
}

// ─── Status Transitions ───────────────────────────────────────────────────────

export async function ajukanPersetujuan(data: { id: string }) {
  const { id } = idSchema.parse(data);
  const session = await requireRole(["admin", "pejabat", "staff"]);

  const [existing] = await db
    .select({ status: suratKeluar.status })
    .from(suratKeluar)
    .where(eq(suratKeluar.id, id));

  if (!existing) return { ok: false as const, error: "Surat tidak ditemukan." };
  if (existing.status !== "draft") {
    return {
      ok: false as const,
      error: "Surat harus berstatus Draft untuk diajukan.",
    };
  }

  await db
    .update(suratKeluar)
    .set({ status: "permohonan_persetujuan", updatedAt: new Date() })
    .where(eq(suratKeluar.id, id));

  await db.insert(auditLog).values({
    userId: session.user.id as string,
    aksi: "AJUKAN_PERSETUJUAN_SURAT_KELUAR",
    entitasType: "surat_keluar",
    entitasId: id,
    detail: null,
  });

  revalidatePath("/surat-keluar");
  return { ok: true as const };
}

export async function mulaiReviu(data: { id: string }) {
  const { id } = idSchema.parse(data);
  const session = await requireRole(["admin", "pejabat"]);

  const guard = await ensureSuratStatus(id, ["permohonan_persetujuan"]);
  if (!guard.ok) return guard;

  const rows = await db
    .update(suratKeluar)
    .set({ status: "reviu", updatedAt: new Date() })
    .where(
      and(
        eq(suratKeluar.id, id),
        eq(suratKeluar.status, "permohonan_persetujuan"),
      ),
    )
    .returning({ id: suratKeluar.id });

  if (!rows[0]) {
    return { ok: false as const, error: "Surat tidak dapat masuk ke tahap reviu." };
  }

  await db.insert(auditLog).values({
    userId: session.user.id as string,
    aksi: "MULAI_REVIU_SURAT_KELUAR",
    entitasType: "surat_keluar",
    entitasId: id,
    detail: null,
  });

  revalidatePath("/surat-keluar");
  return { ok: true as const };
}

export async function setujuiSurat(data: { id: string }) {
  const { id } = idSchema.parse(data);
  const session = await requireRole(["admin", "pejabat"]);

  const guard = await ensureSuratStatus(id, ["reviu"]);
  if (!guard.ok) return guard;

  await db
    .update(suratKeluar)
    .set({
      status: "pengarsipan",
      disetujuiOleh: session.user.id as string,
      tanggalDisetujui: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(suratKeluar.id, id));

  await db.insert(auditLog).values({
    userId: session.user.id as string,
    aksi: "SETUJUI_SURAT_KELUAR",
    entitasType: "surat_keluar",
    entitasId: id,
    detail: null,
  });

  revalidatePath("/surat-keluar");
  return { ok: true as const };
}

export async function tolakSurat(data: { id: string; catatanReviu: string }) {
  const parsed = z
    .object({
      id: z.string().uuid(),
      catatanReviu: z.string().min(1, "Catatan reviu wajib diisi"),
    })
    .parse(data);
  const session = await requireRole(["admin", "pejabat"]);

  const guard = await ensureSuratStatus(parsed.id, ["reviu"]);
  if (!guard.ok) return guard;

  await db
    .update(suratKeluar)
    .set({
      status: "draft",
      catatanReviu: parsed.catatanReviu,
      updatedAt: new Date(),
    })
    .where(eq(suratKeluar.id, parsed.id));

  await db.insert(auditLog).values({
    userId: session.user.id as string,
    aksi: "TOLAK_SURAT_KELUAR",
    entitasType: "surat_keluar",
    entitasId: parsed.id,
    detail: { catatanReviu: parsed.catatanReviu },
  });

  revalidatePath("/surat-keluar");
  return { ok: true as const };
}

export async function selesaikanSurat(data: { id: string }) {
  const { id } = idSchema.parse(data);
  const session = await requireRole(["admin", "pejabat"]);

  const guard = await ensureSuratStatus(id, ["pengarsipan"]);
  if (!guard.ok) return guard;

  const [existing] = await db
    .select({ nomorSurat: suratKeluar.nomorSurat })
    .from(suratKeluar)
    .where(eq(suratKeluar.id, id));

  if (!existing?.nomorSurat) {
    return {
      ok: false as const,
      error: "Nomor surat harus digenerate sebelum pengarsipan diselesaikan.",
    };
  }

  await db
    .update(suratKeluar)
    .set({ status: "selesai", updatedAt: new Date() })
    .where(eq(suratKeluar.id, id));

  await db.insert(auditLog).values({
    userId: session.user.id as string,
    aksi: "SELESAIKAN_SURAT_KELUAR",
    entitasType: "surat_keluar",
    entitasId: id,
    detail: null,
  });

  revalidatePath("/surat-keluar");
  return { ok: true as const };
}

export async function batalkanSurat(data: { id: string }) {
  const { id } = idSchema.parse(data);
  const session = await requireRole(["admin"]);

  const guard = await ensureSuratStatus(id, [
    "draft",
    "permohonan_persetujuan",
    "reviu",
  ]);
  if (!guard.ok) return guard;

  await db
    .update(suratKeluar)
    .set({ status: "dibatalkan", updatedAt: new Date() })
    .where(eq(suratKeluar.id, id));

  await db.insert(auditLog).values({
    userId: session.user.id as string,
    aksi: "BATALKAN_SURAT_KELUAR",
    entitasType: "surat_keluar",
    entitasId: id,
    detail: null,
  });

  revalidatePath("/surat-keluar");
  return { ok: true as const };
}

// ─── Generate & Assign Nomor Surat ───────────────────────────────────────────
// Atomic: counter increment + nomorSurat assignment dalam satu DB transaction.

export async function assignNomorSuratKeluar(data: { id: string }) {
  const { id } = idSchema.parse(data);
  const session = await requireRole(["admin", "pejabat"]);

  const nomorSurat = await db.transaction(async (tx) => {
    const [surat] = await tx
      .select()
      .from(suratKeluar)
      .where(eq(suratKeluar.id, id));

    if (!surat) throw new Error("Surat tidak ditemukan");
    if (surat.nomorSurat) throw new Error("Nomor surat sudah digenerate");
    if (surat.status !== "pengarsipan") {
      throw new Error(
        "Nomor surat hanya bisa digenerate saat status Pengarsipan",
      );
    }

    const tanggal = new Date(surat.tanggalSurat);
    const bulan = tanggal.getMonth() + 1;
    const tahun = tanggal.getFullYear();
    const jenisSurat = surat.jenisSurat;

    const upsert = await tx.execute(sql`
      INSERT INTO nomor_surat_counter (tahun, bulan, jenis_surat, counter, prefix, updated_at)
      VALUES (${tahun}, ${bulan}, ${jenisSurat}, 1, ${"IAI-DKIJKT"}, NOW())
      ON CONFLICT (tahun, bulan, jenis_surat)
      DO UPDATE SET
        counter = nomor_surat_counter.counter + 1,
        updated_at = NOW()
      RETURNING counter, prefix
    `);

    const row = (upsert.rows as { counter: number; prefix: string | null }[])[0];
    if (!row) throw new Error("Gagal menggenerate nomor surat");

    const counter = row.counter;
    const prefix = row.prefix ?? "IAI-DKIJKT";

    const bulanRomawi = formatBulanRomawi(bulan);
    const nomor = `${counter}/${prefix}/${bulanRomawi}/${tahun}`;

    await tx
      .update(suratKeluar)
      .set({ nomorSurat: nomor, updatedAt: new Date() })
      .where(eq(suratKeluar.id, id));

    return nomor;
  });

  await db.insert(auditLog).values({
    userId: session.user.id as string,
    aksi: "ASSIGN_NOMOR_SURAT_KELUAR",
    entitasType: "surat_keluar",
    entitasId: id,
    detail: { nomorSurat },
  });

  revalidatePath("/surat-keluar");
  return { ok: true as const, nomorSurat };
}
