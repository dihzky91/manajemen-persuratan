"use server";

import { asc, desc, eq, sql, and, gte, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { db } from "@/server/db";
import { adminJaga, jadwalUjian, kelasUjian, pengawas, auditLog } from "@/server/db/schema";
import { requireRole, requireSession } from "@/server/actions/auth";
import {
  adminJagaAssignSchema,
  type AdminJagaAssignInput,
  type AdminJagaFilter,
} from "@/lib/validators/jadwalUjian.schema";

export type AdminJagaRow = {
  id: string;
  ujianId: string;
  pengawasId: string;
  namaPengawas: string;
  catatan: string | null;
  konflik: boolean;
  tanggalUjian: string;
  jamMulai: string;
  jamSelesai: string;
  namaKelas: string;
  program: string;
  mataPelajaran: string[];
  createdAt: Date;
};

export type BebanAdminJagaRow = {
  pengawasId: string;
  namaPengawas: string;
  jumlah: number;
  jumlahKonflik: number;
};

export async function listAdminJagaByUjian(ujianId: string): Promise<AdminJagaRow[]> {
  await requireSession();
  const rows = await db
    .select({
      id: adminJaga.id,
      ujianId: adminJaga.ujianId,
      pengawasId: adminJaga.pengawasId,
      namaPengawas: pengawas.nama,
      catatan: adminJaga.catatan,
      konflik: adminJaga.konflik,
      tanggalUjian: jadwalUjian.tanggalUjian,
      jamMulai: jadwalUjian.jamMulai,
      jamSelesai: jadwalUjian.jamSelesai,
      namaKelas: kelasUjian.namaKelas,
      program: kelasUjian.program,
      mataPelajaran: jadwalUjian.mataPelajaran,
      createdAt: adminJaga.createdAt,
    })
    .from(adminJaga)
    .leftJoin(pengawas, eq(adminJaga.pengawasId, pengawas.id))
    .leftJoin(jadwalUjian, eq(adminJaga.ujianId, jadwalUjian.id))
    .leftJoin(kelasUjian, eq(jadwalUjian.kelasId, kelasUjian.id))
    .where(eq(adminJaga.ujianId, ujianId))
    .orderBy(asc(pengawas.nama));
  return rows as AdminJagaRow[];
}

export async function listAllAdminJaga(filter: AdminJagaFilter = {}): Promise<AdminJagaRow[]> {
  await requireSession();
  const conditions = [];
  if (filter.pengawasId) conditions.push(eq(adminJaga.pengawasId, filter.pengawasId));
  if (filter.tanggalMulai) conditions.push(gte(jadwalUjian.tanggalUjian, filter.tanggalMulai));
  if (filter.tanggalSelesai) conditions.push(lte(jadwalUjian.tanggalUjian, filter.tanggalSelesai));

  const rows = await db
    .select({
      id: adminJaga.id,
      ujianId: adminJaga.ujianId,
      pengawasId: adminJaga.pengawasId,
      namaPengawas: pengawas.nama,
      catatan: adminJaga.catatan,
      konflik: adminJaga.konflik,
      tanggalUjian: jadwalUjian.tanggalUjian,
      jamMulai: jadwalUjian.jamMulai,
      jamSelesai: jadwalUjian.jamSelesai,
      namaKelas: kelasUjian.namaKelas,
      program: kelasUjian.program,
      mataPelajaran: jadwalUjian.mataPelajaran,
      createdAt: adminJaga.createdAt,
    })
    .from(adminJaga)
    .leftJoin(pengawas, eq(adminJaga.pengawasId, pengawas.id))
    .leftJoin(jadwalUjian, eq(adminJaga.ujianId, jadwalUjian.id))
    .leftJoin(kelasUjian, eq(jadwalUjian.kelasId, kelasUjian.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(jadwalUjian.tanggalUjian), asc(jadwalUjian.jamMulai), asc(pengawas.nama));
  return rows as AdminJagaRow[];
}

export async function getBebanAdminJaga(): Promise<BebanAdminJagaRow[]> {
  await requireSession();
  const rows = await db
    .select({
      pengawasId: adminJaga.pengawasId,
      namaPengawas: pengawas.nama,
      jumlah: sql<number>`count(*)::int`,
      jumlahKonflik: sql<number>`count(*) filter (where ${adminJaga.konflik} = true)::int`,
    })
    .from(adminJaga)
    .leftJoin(pengawas, eq(adminJaga.pengawasId, pengawas.id))
    .groupBy(adminJaga.pengawasId, pengawas.nama)
    .orderBy(desc(sql`count(*)`));
  return rows as BebanAdminJagaRow[];
}

export async function assignAdminJaga(
  data: AdminJagaAssignInput & { tanggalUjian: string; jamMulai: string; jamSelesai: string },
) {
  const parsed = adminJagaAssignSchema.parse(data);
  const session = await requireRole(["admin", "staff"]);

  const existing = await db
    .select({
      ujianId: adminJaga.ujianId,
      jamMulai: jadwalUjian.jamMulai,
      jamSelesai: jadwalUjian.jamSelesai,
    })
    .from(adminJaga)
    .leftJoin(jadwalUjian, eq(adminJaga.ujianId, jadwalUjian.id))
    .where(and(eq(adminJaga.pengawasId, parsed.pengawasId), eq(jadwalUjian.tanggalUjian, data.tanggalUjian)));

  const konflik = existing.some((e) => {
    if (e.ujianId === parsed.ujianId) return false;
    if (!e.jamMulai || !e.jamSelesai) return false;
    return data.jamMulai < e.jamSelesai && data.jamSelesai > e.jamMulai;
  });

  const id = nanoid();
  await db
    .insert(adminJaga)
    .values({
      id,
      ujianId: parsed.ujianId,
      pengawasId: parsed.pengawasId,
      catatan: parsed.catatan || null,
      konflik,
    })
    .onConflictDoUpdate({
      target: [adminJaga.ujianId, adminJaga.pengawasId],
      set: { catatan: parsed.catatan || null, konflik },
    });

  await db.insert(auditLog).values({
    userId: session.user.id,
    aksi: "ASSIGN_ADMIN_JAGA",
    entitasType: "admin_jaga",
    entitasId: parsed.ujianId,
    detail: { pengawasId: parsed.pengawasId, konflik },
  });

  revalidatePath("/jadwal-ujian");
  revalidatePath(`/jadwal-ujian/${parsed.ujianId}`);
  revalidatePath("/jadwal-ujian/admin-jaga");
  return { ok: true as const, konflik };
}

export async function unassignAdminJaga(id: string) {
  const session = await requireRole(["admin", "staff"]);

  const rows = await db
    .select({ pengawasId: adminJaga.pengawasId, ujianId: adminJaga.ujianId })
    .from(adminJaga)
    .where(eq(adminJaga.id, id));
  if (!rows[0]) return { ok: false as const, error: "Admin jaga tidak ditemukan." };

  await db.delete(adminJaga).where(eq(adminJaga.id, id));

  await db.insert(auditLog).values({
    userId: session.user.id,
    aksi: "UNASSIGN_ADMIN_JAGA",
    entitasType: "admin_jaga",
    entitasId: rows[0].ujianId,
    detail: { pengawasId: rows[0].pengawasId },
  });

  revalidatePath("/jadwal-ujian");
  revalidatePath(`/jadwal-ujian/${rows[0].ujianId}`);
  revalidatePath("/jadwal-ujian/admin-jaga");
  return { ok: true as const };
}
