import { z } from "zod";

export const systemSettingsUpdateSchema = z.object({
  namaSistem: z
    .string()
    .trim()
    .min(2, "Nama sistem minimal 2 karakter")
    .max(200, "Nama sistem maksimal 200 karakter"),
  singkatan: z
    .string()
    .trim()
    .max(20, "Singkatan maksimal 20 karakter")
    .optional()
    .or(z.literal("")),
});

export type SystemSettingsUpdateInput = z.infer<typeof systemSettingsUpdateSchema>;
