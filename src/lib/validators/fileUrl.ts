import { z } from "zod";

const relativeUploadPath = z
  .string()
  .regex(/^\/[A-Za-z0-9/._-]+$/, "Path file lokal tidak valid")
  .refine(
    (value) => !value.includes("..") && !value.includes("//"),
    "Path file lokal tidak valid",
  );

const absoluteUrl = z.string().url("URL file harus valid");

export const fileUrlSchema = z.union([absoluteUrl, relativeUploadPath]);

export const optionalFileUrlSchema = fileUrlSchema.or(z.literal("")).optional();
