import { env } from "@/lib/env";

export function sanitizePathSegment(value: string): string {
  return value
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\//, "")
    .replace(/\.\./g, "")
    .replace(/[^a-zA-Z0-9/._-]+/g, "-")
    .replace(/\/{2,}/g, "/")
    .replace(/^-+|-+$/g, "");
}

export function sanitizeFileName(fileName: string): string {
  const dotIndex = fileName.lastIndexOf(".");
  const baseName = dotIndex >= 0 ? fileName.slice(0, dotIndex) : fileName;
  const extension = dotIndex >= 0 ? fileName.slice(dotIndex).toLowerCase() : "";

  const safeBase = baseName
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${safeBase || "file"}${extension}`;
}

export function buildStorageKey(parts: string[]) {
  return parts
    .map((part) => sanitizePathSegment(part))
    .filter(Boolean)
    .join("/");
}

export function prependStoragePrefix(prefix: string, folder?: string) {
  return buildStorageKey([prefix, folder ?? ""]);
}

export function ensureBuffer(body: Buffer | Uint8Array | string): Buffer {
  if (Buffer.isBuffer(body)) return body;
  if (typeof body === "string") return Buffer.from(body, "base64");
  return Buffer.from(body);
}

export type PreparedUploadPayload = {
  body: Buffer;
  contentType: string;
  fileName: string;
  size: number;
};

const DATA_URL_PATTERN = /^data:([^;,]+)(?:;charset=[^;,]+)?;base64,(.+)$/s;

export function getAllowedMimeTypes(): string[] {
  return env.STORAGE_ALLOWED_MIME_TYPES.split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export function parseDataUrl(dataUrl: string) {
  const match = DATA_URL_PATTERN.exec(dataUrl);
  if (!match) {
    throw new Error("Format file upload tidak valid.");
  }

  const contentType = match[1];
  const encodedBody = match[2];

  if (!contentType || !encodedBody) {
    throw new Error("Konten file upload tidak lengkap.");
  }

  return {
    contentType: contentType.toLowerCase(),
    body: Buffer.from(encodedBody, "base64"),
  };
}

export function prepareUploadPayload(input: {
  fileName: string;
  contentType?: string;
  dataUrl: string;
}): PreparedUploadPayload {
  const safeFileName = sanitizeFileName(input.fileName);
  const parsed = parseDataUrl(input.dataUrl);
  const declaredType = input.contentType?.trim().toLowerCase();
  const contentType = declaredType || parsed.contentType;
  const allowedMimeTypes = getAllowedMimeTypes();
  const maxBytes = Math.max(1, env.STORAGE_MAX_FILE_MB) * 1024 * 1024;

  if (declaredType && declaredType !== parsed.contentType) {
    throw new Error("Tipe file tidak konsisten dengan konten upload.");
  }

  if (!allowedMimeTypes.includes(contentType)) {
    throw new Error("Tipe file tidak didukung.");
  }

  if (!parsed.body.byteLength) {
    throw new Error("File upload kosong.");
  }

  if (parsed.body.byteLength > maxBytes) {
    throw new Error(
      `Ukuran file melebihi batas ${env.STORAGE_MAX_FILE_MB} MB.`,
    );
  }

  return {
    body: parsed.body,
    contentType,
    fileName: safeFileName,
    size: parsed.body.byteLength,
  };
}
