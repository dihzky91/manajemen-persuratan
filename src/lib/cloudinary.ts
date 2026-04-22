import { v2 as cloudinary } from "cloudinary";
import { env } from "@/lib/env";

let configured = false;

function configure() {
  if (configured) return;
  if (
    !env.CLOUDINARY_CLOUD_NAME ||
    !env.CLOUDINARY_API_KEY ||
    !env.CLOUDINARY_API_SECRET
  ) {
    console.warn("[cloudinary] Env kosong — upload akan gagal.");
    return;
  }
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  configured = true;
}

// Upload file (buffer atau base64 data URL) ke Cloudinary.
// Dipakai untuk: scan surat PDF/gambar, dokumen kelengkapan pegawai.
export async function uploadFile(
  fileDataUrl: string,
  opts: { folder?: string; publicId?: string; resourceType?: "image" | "raw" | "auto" } = {},
) {
  configure();
  return cloudinary.uploader.upload(fileDataUrl, {
    folder: opts.folder ?? "manajemen-surat",
    public_id: opts.publicId,
    resource_type: opts.resourceType ?? "auto",
  });
}

export async function deleteFile(publicId: string) {
  configure();
  return cloudinary.uploader.destroy(publicId);
}

export { cloudinary };
