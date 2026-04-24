import { env } from "@/lib/env";
import path from "node:path";
import { deleteFile, uploadFile } from "@/lib/cloudinary";
import type {
  StorageProvider,
  StorageUploadInput,
  StorageUploadResult,
} from "@/lib/storage/types";
import {
  buildStorageKey,
  prependStoragePrefix,
  sanitizeFileName,
} from "@/lib/storage/utils";

function getDataUrl(body: Buffer | Uint8Array | string, contentType?: string) {
  if (typeof body === "string" && body.startsWith("data:")) {
    return body;
  }

  const buffer = Buffer.isBuffer(body) ? body : Buffer.from(body);
  const mime = contentType || "application/octet-stream";
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

export class CloudinaryStorageProvider implements StorageProvider {
  kind = "cloudinary" as const;

  async upload(input: StorageUploadInput): Promise<StorageUploadResult> {
    const safeFileName = sanitizeFileName(input.fileName);
    const extension = path.extname(safeFileName);
    const baseName = extension
      ? safeFileName.slice(0, -extension.length)
      : safeFileName;
    const scopedFolder = prependStoragePrefix(
      env.STORAGE_ENV_PREFIX,
      input.folder ?? "manajemen-surat",
    );
    const key = buildStorageKey(
      [
        scopedFolder,
        input.publicId ?? `${Date.now()}-${baseName}`,
      ].filter(Boolean),
    );

    const uploaded = await uploadFile(getDataUrl(input.body, input.contentType), {
      folder: scopedFolder,
      publicId: input.publicId ?? `${Date.now()}-${baseName}`,
      resourceType: "auto",
    });

    return {
      provider: this.kind,
      key: uploaded.public_id,
      url: uploaded.secure_url,
      fileName: safeFileName,
      contentType: input.contentType,
      size: uploaded.bytes,
    };
  }

  async delete(key: string): Promise<void> {
    await deleteFile(key);
  }

  getPublicUrl(key: string): string {
    return key;
  }
}
