import type {
  StorageProvider,
  StorageUploadInput,
  StorageUploadResult,
} from "@/lib/storage/types";

export class HostedStorageProvider implements StorageProvider {
  kind = "hosted" as const;

  async upload(_input: StorageUploadInput): Promise<StorageUploadResult> {
    throw new Error(
      "HostedStorageProvider belum diimplementasikan. Tentukan target storage Hostinger lebih dulu.",
    );
  }

  async delete(_key: string): Promise<void> {
    throw new Error(
      "HostedStorageProvider belum diimplementasikan. Tentukan target storage Hostinger lebih dulu.",
    );
  }

  getPublicUrl(key: string): string {
    return key;
  }
}
