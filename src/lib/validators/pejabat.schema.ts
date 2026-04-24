import { z } from "zod";
import { optionalFileUrlSchema } from "@/lib/validators/fileUrl";

export const pejabatCreateSchema = z.object({
  userId: z.string().min(1).optional(),
  namaJabatan: z.string().min(1, "Nama jabatan wajib diisi."),
  wilayah: z.string().optional(),
  ttdUrl: optionalFileUrlSchema,
  isActive: z.boolean().optional(),
});

export const pejabatUpdateSchema = pejabatCreateSchema.extend({
  id: z.number().int().positive(),
});

export const pejabatDeleteSchema = z.object({
  id: z.number().int().positive(),
});

export type PejabatCreateInput = z.infer<typeof pejabatCreateSchema>;
export type PejabatUpdateInput = z.infer<typeof pejabatUpdateSchema>;
