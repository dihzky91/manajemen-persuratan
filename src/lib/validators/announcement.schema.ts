import { z } from "zod";
import { fileUrlSchema } from "@/lib/validators/fileUrl";

const roleSchema = z.enum(["admin", "staff", "pejabat", "viewer"]);

const audienceSchema = z
  .object({
    all: z.boolean().default(true),
    roles: z.array(roleSchema).default([]),
    divisiIds: z.array(z.number().int().positive()).default([]),
  })
  .refine(
    (value) => value.all || value.roles.length > 0 || value.divisiIds.length > 0,
    {
      message: "Pilih minimal satu target audiens.",
      path: ["all"],
    },
  );

const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal wajib YYYY-MM-DD");

const announcementBaseSchema = z.object({
  title: z.string().trim().min(3, "Judul minimal 3 karakter.").max(220),
  description: z.string().trim().min(1, "Deskripsi wajib diisi."),
  startDate: dateStringSchema,
  endDate: dateStringSchema,
  audience: audienceSchema,
  attachments: z
    .array(
      z.object({
        fileName: z.string().trim().min(1).max(220),
        url: fileUrlSchema,
        contentType: z.string().trim().min(1).max(120).optional(),
        size: z.number().int().positive().optional(),
      }),
    )
    .max(10, "Lampiran maksimal 10 file.")
    .default([]),
  isPinned: z.boolean().default(false),
  requiresAck: z.boolean().default(false),
  status: z.enum(["draft", "published"]).default("published"),
});

export const announcementCreateSchema = announcementBaseSchema.refine(
  (value) => value.endDate >= value.startDate,
  {
    message: "Tanggal akhir tidak boleh lebih awal dari tanggal mulai.",
    path: ["endDate"],
  },
);

export const announcementUpdateSchema = announcementBaseSchema
  .extend({
    id: z.string().uuid("ID pengumuman tidak valid."),
  })
  .refine((value) => value.endDate >= value.startDate, {
    message: "Tanggal akhir tidak boleh lebih awal dari tanggal mulai.",
    path: ["endDate"],
  });

export const announcementDeleteSchema = z.object({
  id: z.string().uuid("ID pengumuman tidak valid."),
});

export const announcementMarkReadSchema = z.object({
  id: z.string().uuid("ID pengumuman tidak valid."),
});

export const announcementAcknowledgeSchema = z.object({
  id: z.string().uuid("ID pengumuman tidak valid."),
});

export const announcementUploadFileSchema = z.object({
  fileName: z.string().min(1, "Nama file wajib ada."),
  contentType: z.string().min(1).optional(),
  dataUrl: z.string().min(1, "Data file wajib ada."),
});

export const announcementDuplicateSchema = z.object({
  id: z.string().uuid("ID pengumuman tidak valid."),
});

export const announcementGetReadersSchema = z.object({
  id: z.string().uuid("ID pengumuman tidak valid."),
});

export type AnnouncementCreateInput = z.infer<typeof announcementCreateSchema>;
export type AnnouncementUpdateInput = z.infer<typeof announcementUpdateSchema>;
