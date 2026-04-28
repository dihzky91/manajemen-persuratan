import { z } from "zod";

export const inviteUserSchema = z.object({
  email: z.string().email("Email tidak valid."),
  namaLengkap: z.string().min(1, "Nama lengkap wajib diisi."),
  roleId: z.number().int().positive("Role wajib dipilih."),
  divisiId: z.number().int().positive().optional(),
  jabatan: z.string().optional(),
});
export type InviteUserInput = z.infer<typeof inviteUserSchema>;

export const resendInviteSchema = z.object({
  invitationId: z.string().min(1),
});
export type ResendInviteInput = z.infer<typeof resendInviteSchema>;

export const cancelInviteSchema = z.object({
  invitationId: z.string().min(1),
});
export type CancelInviteInput = z.infer<typeof cancelInviteSchema>;

export const toggleUserStatusSchema = z.object({
  userId: z.string().min(1),
  isActive: z.boolean(),
});
export type ToggleUserStatusInput = z.infer<typeof toggleUserStatusSchema>;
