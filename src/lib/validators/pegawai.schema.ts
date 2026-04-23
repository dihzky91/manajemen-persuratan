import { z } from "zod";
import { genderEnum, jenisPegawaiEnum, statusPernikahanEnum } from "@/server/db/schema";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD");

export const pegawaiCreateSchema = z.object({
  namaLengkap: z.string().min(1),
  email: z.string().email(),
  emailPribadi: z.string().email().optional(),
  noHp: z.string().optional(),
  role: z.enum(["admin", "staff", "pejabat", "viewer"]).default("staff"),
  divisiId: z.number().int().positive().optional(),
  jabatan: z.string().optional(),
  levelJabatan: z.string().optional(),
  jenisPegawai: z.enum(jenisPegawaiEnum.enumValues).optional(),
  tanggalMasuk: isoDate.optional(),
});

export const pegawaiUpdateSchema = pegawaiCreateSchema.extend({
  id: z.string().uuid(),
  isActive: z.boolean().optional(),
});

export const pegawaiDeleteSchema = z.object({
  id: z.string().uuid(),
});

export const biodataSchema = z.object({
  userId: z.string().uuid(),
  noKtp: z.string().optional(),
  gender: z.enum(genderEnum.enumValues).optional(),
  statusPernikahan: z.enum(statusPernikahanEnum.enumValues).optional(),
  tempatLahir: z.string().optional(),
  tanggalLahir: isoDate.optional(),
  alamatTinggal: z.string().optional(),
  kodePos: z.string().optional(),
  provinsi: z.string().optional(),
  kotaKabupaten: z.string().optional(),
  alamatKtp: z.string().optional(),
});

// ─── Keluarga ────────────────────────────────────────────────────────────────

export const keluargaCreateSchema = z.object({
  userId: z.string().uuid(),
  hubungan: z.string().optional(),
  namaAnggota: z.string().min(1, "Nama anggota wajib diisi"),
  tempatLahir: z.string().optional(),
  tanggalLahir: isoDate.optional(),
  pekerjaan: z.string().optional(),
});

export const keluargaUpdateSchema = keluargaCreateSchema.extend({
  id: z.number().int().positive(),
});

export const keluargaDeleteSchema = z.object({
  id: z.number().int().positive(),
  userId: z.string().uuid(),
});

// ─── Pendidikan ──────────────────────────────────────────────────────────────

export const pendidikanCreateSchema = z.object({
  userId: z.string().uuid(),
  jenjang: z.string().optional(),
  namaInstitusi: z.string().optional(),
  jurusan: z.string().optional(),
  tahunMasuk: z.coerce.number().int().min(1900).max(2100).optional(),
  tahunLulus: z.coerce.number().int().min(1900).max(2100).optional(),
});

export const pendidikanUpdateSchema = pendidikanCreateSchema.extend({
  id: z.number().int().positive(),
});

export const pendidikanDeleteSchema = z.object({
  id: z.number().int().positive(),
  userId: z.string().uuid(),
});

// ─── Pekerjaan ───────────────────────────────────────────────────────────────

export const pekerjaanCreateSchema = z.object({
  userId: z.string().uuid(),
  namaPerusahaan: z.string().optional(),
  jabatan: z.string().optional(),
  tanggalMulai: isoDate.optional(),
  tanggalSelesai: isoDate.optional(),
  keterangan: z.string().optional(),
});

export const pekerjaanUpdateSchema = pekerjaanCreateSchema.extend({
  id: z.number().int().positive(),
});

export const pekerjaanDeleteSchema = z.object({
  id: z.number().int().positive(),
  userId: z.string().uuid(),
});

// ─── Kesehatan ───────────────────────────────────────────────────────────────

export const kesehatanSchema = z.object({
  userId: z.string().uuid(),
  golonganDarah: z.string().optional(),
  tinggiBadan: z.coerce.number().int().min(0).max(300).optional(),
  beratBadan: z.coerce.number().int().min(0).max(500).optional(),
  riwayatPenyakit: z.string().optional(),
  alergi: z.string().optional(),
  catatanKesehatan: z.string().optional(),
});

// ─── Kelengkapan ─────────────────────────────────────────────────────────────

export const kelengkapanSchema = z.object({
  userId: z.string().uuid(),
  fotoUrl: z.string().optional(),
  ktpUrl: z.string().optional(),
  npwpUrl: z.string().optional(),
  bpjsUrl: z.string().optional(),
  ijazahUrl: z.string().optional(),
  dokumenLainUrl: z.string().optional(),
});

// ─── Integritas ──────────────────────────────────────────────────────────────

export const integritasSchema = z.object({
  userId: z.string().uuid(),
  tanggalPernyataan: isoDate.optional(),
  statusTandaTangan: z.boolean().optional(),
  catatan: z.string().optional(),
});

// ─── Types ───────────────────────────────────────────────────────────────────

export type PegawaiCreateInput = z.infer<typeof pegawaiCreateSchema>;
export type PegawaiUpdateInput = z.infer<typeof pegawaiUpdateSchema>;
export type BiodataInput = z.infer<typeof biodataSchema>;
export type KeluargaCreateInput = z.infer<typeof keluargaCreateSchema>;
export type KeluargaUpdateInput = z.infer<typeof keluargaUpdateSchema>;
export type PendidikanCreateInput = z.infer<typeof pendidikanCreateSchema>;
export type PendidikanUpdateInput = z.infer<typeof pendidikanUpdateSchema>;
export type PekerjaanCreateInput = z.infer<typeof pekerjaanCreateSchema>;
export type PekerjaanUpdateInput = z.infer<typeof pekerjaanUpdateSchema>;
export type KesehatanInput = z.infer<typeof kesehatanSchema>;
export type IntegritasInput = z.infer<typeof integritasSchema>;
export type KelengkapanInput = z.infer<typeof kelengkapanSchema>;
