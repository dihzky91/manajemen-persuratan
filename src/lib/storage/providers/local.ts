import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "@/lib/env";
import type {
  StorageProvider,
  StorageUploadInput,
  StorageUploadResult,
} from "@/lib/storage/types";
import {
  buildStorageKey,
  ensureBuffer,
  sanitizeFileName,
  sanitizePathSegment,
} from "@/lib/storage/utils";

export class LocalStorageProvider implements StorageProvider {
  kind = "local" as const;

  private get baseDir() {
    return path.resolve(process.cwd(), env.STORAGE_LOCAL_DIR || "./uploads");
  }

  private get publicBaseUrl() {
    return (env.STORAGE_PUBLIC_BASE_URL || "").replace(/\/$/, "");
  }

  async upload(input: StorageUploadInput): Promise<StorageUploadResult> {
    const safeFolder = input.folder ? sanitizePathSegment(input.folder) : "";
    const safeFileName = sanitizeFileName(input.fileName);
    const key = buildStorageKey(
      [safeFolder, `${Date.now()}-${safeFileName}`].filter(Boolean),
    );
    const absolutePath = path.join(this.baseDir, ...key.split("/"));
    const fileBuffer = ensureBuffer(input.body);

    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, fileBuffer);

    return {
      provider: this.kind,
      key,
      url: this.getPublicUrl(key),
      fileName: safeFileName,
      contentType: input.contentType,
      size: fileBuffer.byteLength,
    };
  }

  async delete(key: string): Promise<void> {
    const safeKey = buildStorageKey([key]);
    const absolutePath = path.join(this.baseDir, ...safeKey.split("/"));
    await rm(absolutePath, { force: true });
  }

  getPublicUrl(key: string): string {
    const safeKey = buildStorageKey([key]);
    if (!this.publicBaseUrl) {
      return safeKey;
    }
    return `${this.publicBaseUrl}/${safeKey}`;
  }
}
