"use server";

import { cache } from "react";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/server/db";
import { systemSettings, auditLog } from "@/server/db/schema";
import { systemSettingsUpdateSchema } from "@/lib/validators/systemSettings.schema";
import { requireRole, getSession } from "./auth";
import { getStorageProvider } from "@/lib/storage";
import { env } from "@/lib/env";

export type SystemSettingsRow = {
  id: number;
  namaSistem: string;
  singkatan: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  updatedAt: Date | null;
};

const FALLBACK: SystemSettingsRow = {
  id: 0,
  namaSistem: process.env.NEXT_PUBLIC_APP_NAME ?? "IAI Jakarta",
  singkatan: null,
  logoUrl: null,
  faviconUrl: null,
  updatedAt: null,
};

// cache() deduplicates DB calls within a single request
// (dipakai di root layout + dashboard layout sekaligus)
export const getSystemSettings = cache(async (): Promise<SystemSettingsRow> => {
  try {
    const rows = await db
      .select({
        id: systemSettings.id,
        namaSistem: systemSettings.namaSistem,
        singkatan: systemSettings.singkatan,
        logoUrl: systemSettings.logoUrl,
        faviconUrl: systemSettings.faviconUrl,
        updatedAt: systemSettings.updatedAt,
      })
      .from(systemSettings)
      .limit(1);
    return rows[0] ?? FALLBACK;
  } catch {
    return FALLBACK;
  }
});

const ALLOWED_LOGO_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
const ALLOWED_FAVICON_TYPES = [
  "image/x-icon",
  "image/vnd.microsoft.icon",
  "image/png",
  "image/svg+xml",
];

export async function updateSystemSettings(formData: FormData) {
  const session = await requireRole(["admin"]);

  const parsed = systemSettingsUpdateSchema.parse({
    namaSistem: formData.get("namaSistem"),
    singkatan: formData.get("singkatan"),
  });

  const storage = getStorageProvider();
  const maxBytes = env.STORAGE_MAX_FILE_MB * 1024 * 1024;

  let logoUrl: string | undefined;
  let faviconUrl: string | undefined;

  const logoFile = formData.get("logo") as File | null;
  if (logoFile && logoFile.size > 0) {
    if (!ALLOWED_LOGO_TYPES.includes(logoFile.type)) {
      return { ok: false as const, error: "Format logo tidak didukung. Gunakan PNG, JPG, WebP, atau SVG." };
    }
    if (logoFile.size > maxBytes) {
      return { ok: false as const, error: `Logo melebihi batas ${env.STORAGE_MAX_FILE_MB} MB.` };
    }
    const result = await storage.upload({
      body: Buffer.from(await logoFile.arrayBuffer()),
      fileName: logoFile.name,
      contentType: logoFile.type,
      folder: "system-identity",
      publicId: "logo",
    });
    logoUrl = result.url;
  }

  const faviconFile = formData.get("favicon") as File | null;
  if (faviconFile && faviconFile.size > 0) {
    if (!ALLOWED_FAVICON_TYPES.includes(faviconFile.type)) {
      return { ok: false as const, error: "Format favicon tidak didukung. Gunakan ICO, PNG, atau SVG." };
    }
    if (faviconFile.size > maxBytes) {
      return { ok: false as const, error: `Favicon melebihi batas ${env.STORAGE_MAX_FILE_MB} MB.` };
    }
    const result = await storage.upload({
      body: Buffer.from(await faviconFile.arrayBuffer()),
      fileName: faviconFile.name,
      contentType: faviconFile.type,
      folder: "system-identity",
      publicId: "favicon",
    });
    faviconUrl = result.url;
  }

  const updates = {
    namaSistem: parsed.namaSistem,
    singkatan: parsed.singkatan || null,
    updatedBy: session.user.id,
    updatedAt: new Date(),
    ...(logoUrl !== undefined && { logoUrl }),
    ...(faviconUrl !== undefined && { faviconUrl }),
  };

  const existing = await db
    .select({ id: systemSettings.id })
    .from(systemSettings)
    .limit(1);

  let rowId: number;
  if (existing.length === 0) {
    const rows = await db.insert(systemSettings).values(updates).returning({ id: systemSettings.id });
    rowId = rows[0]!.id;
  } else {
    await db.update(systemSettings).set(updates).where(eq(systemSettings.id, existing[0]!.id));
    rowId = existing[0]!.id;
  }

  await db.insert(auditLog).values({
    userId: session.user.id,
    aksi: "UPDATE_SYSTEM_SETTINGS",
    entitasType: "system_settings",
    entitasId: String(rowId),
    detail: {
      namaSistem: parsed.namaSistem,
      singkatan: parsed.singkatan,
      logoUpdated: !!logoUrl,
      faviconUpdated: !!faviconUrl,
    },
  });

  revalidatePath("/pengaturan");
  revalidatePath("/", "layout");
  return { ok: true as const };
}

// Untuk cek role di pengaturan page (server component)
export async function getSessionRole(): Promise<string | null> {
  const session = await getSession();
  if (!session) return null;
  return (session.user as { role?: string }).role ?? null;
}
