import { z } from "zod";
import { CAPABILITIES } from "@/lib/rbac/capabilities";

const capabilitySchema = z.enum(CAPABILITIES);

export const roleCreateSchema = z.object({
  nama: z.string().trim().min(2, "Nama role minimal 2 karakter.").max(150),
  kode: z
    .string()
    .trim()
    .min(2, "Kode role minimal 2 karakter.")
    .max(50)
    .regex(/^[a-z0-9_-]+$/, "Kode hanya boleh huruf kecil, angka, underscore, atau dash."),
  capabilities: z.array(capabilitySchema).default([]),
});

export const roleUpdateSchema = roleCreateSchema.extend({
  id: z.number().int().positive(),
});

export const roleDeleteSchema = z.object({
  id: z.number().int().positive(),
});

export const updateRoleCapabilitiesSchema = z.object({
  roleId: z.number().int().positive(),
  capabilities: z.array(capabilitySchema).default([]),
});

export const updateUserAccessSchema = z.object({
  userId: z.string().min(1),
  roleId: z.number().int().positive().nullable(),
  divisiId: z.number().int().positive().nullable(),
  isSuperAdmin: z.boolean(),
});

export type RoleCreateInput = z.infer<typeof roleCreateSchema>;
export type RoleUpdateInput = z.infer<typeof roleUpdateSchema>;
export type RoleDeleteInput = z.infer<typeof roleDeleteSchema>;
export type UpdateRoleCapabilitiesInput = z.infer<
  typeof updateRoleCapabilitiesSchema
>;
export type UpdateUserAccessInput = z.infer<typeof updateUserAccessSchema>;
