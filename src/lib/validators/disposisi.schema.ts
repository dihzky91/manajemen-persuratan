import { z } from "zod";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD");

export const disposisiCreateSchema = z.object({
  suratMasukId: z.string().uuid(),
  kepadaUserId: z.string().min(1),
  catatan: z.string().optional(),
  instruksi: z.string().optional(),
  batasWaktu: isoDate.optional(),
  parentDisposisiId: z.string().uuid().optional(),
});

export const disposisiUpdateStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["belum_dibaca", "dibaca", "diproses", "selesai"]),
});

export type DisposisiCreateInput = z.infer<typeof disposisiCreateSchema>;
export type DisposisiUpdateStatusInput = z.infer<
  typeof disposisiUpdateStatusSchema
>;
