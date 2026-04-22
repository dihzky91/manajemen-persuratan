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

export type PegawaiCreateInput = z.infer<typeof pegawaiCreateSchema>;
export type BiodataInput = z.infer<typeof biodataSchema>;
