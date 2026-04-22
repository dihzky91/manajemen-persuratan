"use server";

import { asc, desc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/server/db";
import {
  users,
  pegawaiBiodata,
  pegawaiKeluarga,
  pegawaiKelengkapan,
  pegawaiKesehatan,
  pegawaiPendidikan,
  pegawaiPernyataanIntegritas,
  pegawaiRiwayatPekerjaan,
  divisi,
  auditLog,
} from "@/server/db/schema";
import {
  pegawaiCreateSchema,
  pegawaiUpdateSchema,
  pegawaiDeleteSchema,
  biodataSchema,
} from "@/lib/validators/pegawai.schema";
import { requireRole, requireSession } from "./auth";

export type PegawaiListRow = {
  id: string;
  namaLengkap: string;
  email: string;
  emailPribadi: string | null;
  noHp: string | null;
  role: "admin" | "staff" | "pejabat" | "viewer" | null;
  divisiId: number | null;
  divisiNama: string | null;
  jabatan: string | null;
  levelJabatan: string | null;
  jenisPegawai: string | null;
  tanggalMasuk: string | null;
  isActive: boolean | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  biodataUpdatedAt: Date | null;
};

export async function listPegawai(): Promise<PegawaiListRow[]> {
  await requireSession();
  return db
    .select({
      id: users.id,
      namaLengkap: users.namaLengkap,
      email: users.email,
      emailPribadi: users.emailPribadi,
      noHp: users.noHp,
      role: users.role,
      divisiId: users.divisiId,
      divisiNama: divisi.nama,
      jabatan: users.jabatan,
      levelJabatan: users.levelJabatan,
      jenisPegawai: users.jenisPegawai,
      tanggalMasuk: users.tanggalMasuk,
      isActive: users.isActive,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      biodataUpdatedAt: pegawaiBiodata.updatedAt,
    })
    .from(users)
    .leftJoin(divisi, eq(users.divisiId, divisi.id))
    .leftJoin(pegawaiBiodata, eq(pegawaiBiodata.userId, users.id))
    .orderBy(desc(users.createdAt))
    .limit(200);
}

export async function getPegawaiById(id: string) {
  await requireSession();
  const [user] = await db
    .select({
      id: users.id,
      namaLengkap: users.namaLengkap,
      email: users.email,
      emailPribadi: users.emailPribadi,
      noHp: users.noHp,
      role: users.role,
      divisiId: users.divisiId,
      divisiNama: divisi.nama,
      jabatan: users.jabatan,
      levelJabatan: users.levelJabatan,
      jenisPegawai: users.jenisPegawai,
      tanggalMasuk: users.tanggalMasuk,
      isActive: users.isActive,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .leftJoin(divisi, eq(users.divisiId, divisi.id))
    .where(eq(users.id, id));
  const [biodata] = await db
    .select()
    .from(pegawaiBiodata)
    .where(eq(pegawaiBiodata.userId, id));
  return { user: user ?? null, biodata: biodata ?? null };
}

export async function createPegawai(data: unknown) {
  const parsed = pegawaiCreateSchema.parse(data);
  const session = await requireRole(["admin"]);
  const [row] = await db.insert(users).values({ id: crypto.randomUUID(), ...parsed }).returning();

  await db.insert(auditLog).values({
    userId: session.user.id as string,
    aksi: "CREATE_PEGAWAI",
    entitasType: "users",
    entitasId: row!.id,
    detail: { email: parsed.email, namaLengkap: parsed.namaLengkap },
  });

  revalidatePath("/pegawai");
  return row!;
}

export async function updatePegawai(data: unknown) {
  const parsed = pegawaiUpdateSchema.parse(data);
  const session = await requireRole(["admin"]);

  try {
    const [row] = await db
      .update(users)
      .set({
        namaLengkap: parsed.namaLengkap,
        email: parsed.email,
        emailPribadi: parsed.emailPribadi,
        noHp: parsed.noHp,
        role: parsed.role,
        divisiId: parsed.divisiId,
        jabatan: parsed.jabatan,
        levelJabatan: parsed.levelJabatan,
        jenisPegawai: parsed.jenisPegawai,
        tanggalMasuk: parsed.tanggalMasuk,
        isActive: parsed.isActive,
        updatedAt: new Date(),
      })
      .where(eq(users.id, parsed.id))
      .returning();

    if (!row) {
      return { ok: false as const, error: "Pegawai tidak ditemukan." };
    }

    await db.insert(auditLog).values({
      userId: session.user.id as string,
      aksi: "UPDATE_PEGAWAI",
      entitasType: "users",
      entitasId: row.id,
      detail: { email: parsed.email, namaLengkap: parsed.namaLengkap },
    });

    revalidatePath("/pegawai");
    return { ok: true as const, data: row };
  } catch (err) {
    if (err instanceof Error && err.message.includes("unique")) {
      return { ok: false as const, error: "Email sudah digunakan." };
    }
    throw err;
  }
}

export async function deletePegawai(data: unknown) {
  const parsed = pegawaiDeleteSchema.parse(data);
  const session = await requireRole(["admin"]);

  if (session.user.id === parsed.id) {
    return {
      ok: false as const,
      error: "Akun yang sedang aktif tidak dapat dihapus.",
    };
  }

  const [target] = await db
    .select({ id: users.id, namaLengkap: users.namaLengkap, email: users.email })
    .from(users)
    .where(eq(users.id, parsed.id));

  if (!target) {
    return { ok: false as const, error: "Pegawai tidak ditemukan." };
  }

  await db.delete(pegawaiKeluarga).where(eq(pegawaiKeluarga.userId, parsed.id));
  await db.delete(pegawaiPendidikan).where(eq(pegawaiPendidikan.userId, parsed.id));
  await db
    .delete(pegawaiRiwayatPekerjaan)
    .where(eq(pegawaiRiwayatPekerjaan.userId, parsed.id));
  await db.delete(pegawaiBiodata).where(eq(pegawaiBiodata.userId, parsed.id));
  await db.delete(pegawaiKelengkapan).where(eq(pegawaiKelengkapan.userId, parsed.id));
  await db.delete(pegawaiKesehatan).where(eq(pegawaiKesehatan.userId, parsed.id));
  await db
    .delete(pegawaiPernyataanIntegritas)
    .where(eq(pegawaiPernyataanIntegritas.userId, parsed.id));
  await db.delete(users).where(eq(users.id, parsed.id));

  await db.insert(auditLog).values({
    userId: session.user.id as string,
    aksi: "DELETE_PEGAWAI",
    entitasType: "users",
    entitasId: parsed.id,
    detail: { email: target.email, namaLengkap: target.namaLengkap },
  });

  revalidatePath("/pegawai");
  return { ok: true as const };
}

export async function listPegawaiReference() {
  await requireSession();

  return db
    .select({
      id: users.id,
      namaLengkap: users.namaLengkap,
      email: users.email,
      jabatan: users.jabatan,
      divisiId: users.divisiId,
    })
    .from(users)
    .where(inArray(users.role, ["admin", "staff", "pejabat", "viewer"]))
    .orderBy(asc(users.namaLengkap));
}

export async function upsertBiodata(data: unknown) {
  const parsed = biodataSchema.parse(data);
  const session = await requireSession();
  const role = (session.user as { role?: string }).role;
  if (role !== "admin" && session.user.id !== parsed.userId) {
    throw new Error("Forbidden");
  }

  const existing = await db
    .select()
    .from(pegawaiBiodata)
    .where(eq(pegawaiBiodata.userId, parsed.userId));

  if (existing[0]) {
    const [row] = await db
      .update(pegawaiBiodata)
      .set({ ...parsed, updatedAt: new Date() })
      .where(eq(pegawaiBiodata.userId, parsed.userId))
      .returning();
    revalidatePath("/pegawai");
    return row!;
  }

  const [row] = await db.insert(pegawaiBiodata).values(parsed).returning();
  revalidatePath("/pegawai");
  return row!;
}
