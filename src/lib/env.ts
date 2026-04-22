// Helper pembacaan env yang memberi warning jelas bila kosong saat development.
// Server-side only — jangan impor dari komponen client.

function readEnv(key: string, required = false): string {
  const v = process.env[key];
  if (!v) {
    if (required) {
      throw new Error(`Env var ${key} wajib di-set.`);
    }
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[env] ${key} kosong — fitur terkait akan non-fungsional.`);
    }
    return "";
  }
  return v;
}

export const env = {
  DATABASE_URL: readEnv("DATABASE_URL"),
  BETTER_AUTH_SECRET: readEnv("BETTER_AUTH_SECRET"),
  BETTER_AUTH_URL: readEnv("BETTER_AUTH_URL"),
  CLOUDINARY_CLOUD_NAME: readEnv("CLOUDINARY_CLOUD_NAME"),
  CLOUDINARY_API_KEY: readEnv("CLOUDINARY_API_KEY"),
  CLOUDINARY_API_SECRET: readEnv("CLOUDINARY_API_SECRET"),
  MAILJET_API_KEY: readEnv("MAILJET_API_KEY"),
  MAILJET_API_SECRET: readEnv("MAILJET_API_SECRET"),
  MAILJET_FROM_EMAIL: readEnv("MAILJET_FROM_EMAIL"),
  MAILJET_FROM_NAME: readEnv("MAILJET_FROM_NAME"),
};
