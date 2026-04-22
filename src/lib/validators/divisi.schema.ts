import { z } from "zod";

export const divisiCreateSchema = z.object({
  nama: z
    .string()
    .trim()
    .min(2, "Nama divisi minimal 2 karakter")
    .max(150, "Nama divisi maksimal 150 karakter"),
  kode: z
    .string()
    .trim()
    .max(20, "Kode divisi maksimal 20 karakter")
    .optional()
    .or(z.literal("")),
});

export function normalizeKode(kode: string | undefined | null): string | null {
  if (!kode || kode.trim() === "") return null;
  return kode.trim();
}

export const divisiUpdateSchema = divisiCreateSchema.extend({
  id: z.number().int().positive(),
});

export const divisiDeleteSchema = z.object({
  id: z.number().int().positive(),
});

export type DivisiCreateInput = z.infer<typeof divisiCreateSchema>;
export type DivisiUpdateInput = z.infer<typeof divisiUpdateSchema>;
