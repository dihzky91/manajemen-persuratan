"use server";

import { asc, desc, eq, sql, and, gte, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { db } from "@/server/db";
import { jadwalAdminJaga, kelasUjian, pengawas, auditLog } from "@/server/db/schema";
import { requireRole, requireSession } from "@/server/actions/auth";
import {
  jadwalAdminJagaCreateSchema,
  jadwalAdminJagaUpdateSchema,
  type JadwalAdminJagaCreateInput,
  type JadwalAdminJagaUpdateInput,
  type JadwalAdminJagaFilter,
} from "@/lib/validators/jadwalUjian.schema";

export type JadwalAdminJagaRow = {
  id: string;
  kelasId: string;
  namaKelas: string;
  program: string;
  tanggal: string;
  jamMulai: string | null;
  jamSelesai: string | null;
  materi: string;
  pengawasId: string;
  namaPengawas: string;
  catatan: string | null;
  createdAt: Date;
};

export type BebanJadwalAdminJagaRow = {
  pengawasId: string;
  namaPengawas: string;
  jumlah: number;
};

export async function listJadwalAdminJaga(
  filter: JadwalAdminJagaFilter = {},
): Promise<JadwalAdminJagaRow[]> {
  await requireSession();
  const conditions = [];
  if (filter.kelasId) conditions.push(eq(jadwalAdminJaga.kelasId, filter.kelasId));
  if (filter.pengawasId) conditions.push(eq(jadwalAdminJaga.pengawasId, filter.pengawasId));
  if (filter.tanggalMulai) conditions.push(gte(jadwalAdminJaga.tanggal, filter.tanggalMulai));
  if (filter.tanggalSelesai) conditions.push(lte(jadwalAdminJaga.tanggal, filter.tanggalSelesai));

  const rows = await db
    .select({
      id: jadwalAdminJaga.id,
      kelasId: jadwalAdminJaga.kelasId,
      namaKelas: kelasUjian.namaKelas,
      program: kelasUjian.program,
      tanggal: jadwalAdminJaga.tanggal,
      jamMulai: jadwalAdminJaga.jamMulai,
      jamSelesai: jadwalAdminJaga.jamSelesai,
      materi: jadwalAdminJaga.materi,
      pengawasId: jadwalAdminJaga.pengawasId,
      namaPengawas: pengawas.nama,
      catatan: jadwalAdminJaga.catatan,
      createdAt: jadwalAdminJaga.createdAt,
    })
    .from(jadwalAdminJaga)
    .leftJoin(kelasUjian, eq(jadwalAdminJaga.kelasId, kelasUjian.id))
    .leftJoin(pengawas, eq(jadwalAdminJaga.pengawasId, pengawas.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(asc(jadwalAdminJaga.tanggal), asc(jadwalAdminJaga.jamMulai), asc(pengawas.nama));

  return rows as JadwalAdminJagaRow[];
}

export async function getBebanJadwalAdminJaga(): Promise<BebanJadwalAdminJagaRow[]> {
  await requireSession();
  const rows = await db
    .select({
      pengawasId: jadwalAdminJaga.pengawasId,
      namaPengawas: pengawas.nama,
      jumlah: sql<number>`count(*)::int`,
    })
    .from(jadwalAdminJaga)
    .leftJoin(pengawas, eq(jadwalAdminJaga.pengawasId, pengawas.id))
    .groupBy(jadwalAdminJaga.pengawasId, pengawas.nama)
    .orderBy(desc(sql`count(*)`));
  return rows as BebanJadwalAdminJagaRow[];
}

export async function createJadwalAdminJaga(data: JadwalAdminJagaCreateInput) {
  const parsed = jadwalAdminJagaCreateSchema.parse(data);
  const session = await requireRole(["admin", "staff"]);

  const id = nanoid();
  await db.insert(jadwalAdminJaga).values({
    id,
    kelasId: parsed.kelasId,
    tanggal: parsed.tanggal,
    jamMulai: parsed.jamMulai,
    jamSelesai: parsed.jamSelesai,
    materi: parsed.materi,
    pengawasId: parsed.pengawasId,
    catatan: parsed.catatan || null,
  });

  await db.insert(auditLog).values({
    userId: session.user.id,
    aksi: "CREATE_JADWAL_ADMIN_JAGA",
    entitasType: "jadwal_admin_jaga",
    entitasId: id,
    detail: {
      tanggal: parsed.tanggal,
      jamMulai: parsed.jamMulai,
      jamSelesai: parsed.jamSelesai,
      materi: parsed.materi,
      pengawasId: parsed.pengawasId,
    },
  });

  revalidatePath("/jadwal-ujian/admin-jaga");
  return { ok: true as const, id };
}

export async function updateJadwalAdminJaga(data: JadwalAdminJagaUpdateInput) {
  const parsed = jadwalAdminJagaUpdateSchema.parse(data);
  const session = await requireRole(["admin", "staff"]);

  const existing = await db
    .select({ id: jadwalAdminJaga.id })
    .from(jadwalAdminJaga)
    .where(eq(jadwalAdminJaga.id, parsed.id));
  if (!existing[0]) return { ok: false as const, error: "Data tidak ditemukan." };

  await db
    .update(jadwalAdminJaga)
    .set({
      kelasId: parsed.kelasId,
      tanggal: parsed.tanggal,
      jamMulai: parsed.jamMulai,
      jamSelesai: parsed.jamSelesai,
      materi: parsed.materi,
      pengawasId: parsed.pengawasId,
      catatan: parsed.catatan || null,
      updatedAt: new Date(),
    })
    .where(eq(jadwalAdminJaga.id, parsed.id));

  await db.insert(auditLog).values({
    userId: session.user.id,
    aksi: "UPDATE_JADWAL_ADMIN_JAGA",
    entitasType: "jadwal_admin_jaga",
    entitasId: parsed.id,
    detail: {
      tanggal: parsed.tanggal,
      jamMulai: parsed.jamMulai,
      jamSelesai: parsed.jamSelesai,
      materi: parsed.materi,
      pengawasId: parsed.pengawasId,
    },
  });

  revalidatePath("/jadwal-ujian/admin-jaga");
  return { ok: true as const };
}

export async function deleteJadwalAdminJaga(id: string) {
  const session = await requireRole(["admin", "staff"]);

  const rows = await db
    .select({ pengawasId: jadwalAdminJaga.pengawasId, tanggal: jadwalAdminJaga.tanggal })
    .from(jadwalAdminJaga)
    .where(eq(jadwalAdminJaga.id, id));
  if (!rows[0]) return { ok: false as const, error: "Data tidak ditemukan." };

  await db.delete(jadwalAdminJaga).where(eq(jadwalAdminJaga.id, id));

  await db.insert(auditLog).values({
    userId: session.user.id,
    aksi: "DELETE_JADWAL_ADMIN_JAGA",
    entitasType: "jadwal_admin_jaga",
    entitasId: id,
    detail: { pengawasId: rows[0].pengawasId, tanggal: rows[0].tanggal },
  });

  revalidatePath("/jadwal-ujian/admin-jaga");
  return { ok: true as const };
}

export async function deleteJadwalAdminJagaByKelas(kelasId: string) {
  if (!kelasId) return { ok: false as const, error: "Kelas wajib dipilih." };

  const session = await requireRole(["admin", "staff"]);
  const deleted = await db
    .delete(jadwalAdminJaga)
    .where(eq(jadwalAdminJaga.kelasId, kelasId))
    .returning({ id: jadwalAdminJaga.id });

  if (deleted.length === 0) {
    return { ok: false as const, error: "Tidak ada jadwal untuk kelas ini." };
  }

  await db.insert(auditLog).values({
    userId: session.user.id,
    aksi: "DELETE_JADWAL_ADMIN_JAGA_BY_KELAS",
    entitasType: "jadwal_admin_jaga",
    entitasId: kelasId,
    detail: { kelasId, jumlah: deleted.length },
  });

  revalidatePath("/jadwal-ujian/admin-jaga");
  return { ok: true as const, deleted: deleted.length };
}

export type ImportJadwalAdminJagaRow = {
  kelasId: string;
  tanggal: string;
  jamMulai: string;
  jamSelesai: string;
  materi: string;
  pengawasId: string;
  catatan?: string;
};

export async function importJadwalAdminJaga(rows: ImportJadwalAdminJagaRow[]) {
  if (rows.length === 0) return { ok: false as const, error: "Tidak ada data untuk diimpor." };
  if (rows.length > 500) return { ok: false as const, error: "Maksimal 500 baris per import." };

  const session = await requireRole(["admin", "staff"]);

  const parsedRows = rows.map((row) => jadwalAdminJagaCreateSchema.parse(row));

  const values = parsedRows.map((r) => ({
    id: nanoid(),
    kelasId: r.kelasId,
    tanggal: r.tanggal,
    jamMulai: r.jamMulai,
    jamSelesai: r.jamSelesai,
    materi: r.materi.trim(),
    pengawasId: r.pengawasId,
    catatan: r.catatan?.trim() || null,
  }));

  await db.insert(jadwalAdminJaga).values(values);

  await db.insert(auditLog).values({
    userId: session.user.id,
    aksi: "IMPORT_JADWAL_ADMIN_JAGA",
    entitasType: "jadwal_admin_jaga",
    entitasId: "batch",
    detail: { jumlah: rows.length },
  });

  revalidatePath("/jadwal-ujian/admin-jaga");
  return { ok: true as const, inserted: rows.length };
}
