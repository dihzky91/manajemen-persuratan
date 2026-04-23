export type StorageProviderKind = "local" | "cloudinary" | "hosted";

export type StorageUploadInput = {
  body: Buffer | Uint8Array | string;
  fileName: string;
  contentType?: string;
  folder?: string;
  publicId?: string;
};

export type StorageUploadResult = {
  provider: StorageProviderKind;
  key: string;
  url: string;
  fileName: string;
  contentType?: string;
  size?: number;
};

export interface StorageProvider {
  kind: StorageProviderKind;
  upload(input: StorageUploadInput): Promise<StorageUploadResult>;
  delete(key: string): Promise<void>;
  getPublicUrl(key: string): string;
}
