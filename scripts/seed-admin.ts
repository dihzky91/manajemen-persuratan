/**
 * Seed script: buat akun admin pertama.
 * Jalankan: npx dotenv-cli -e .env.local -- npx tsx scripts/seed-admin.ts
 */
import { auth } from "../src/server/auth";

const ADMIN_EMAIL = "admin@iaijakarta.or.id";
const ADMIN_PASSWORD = "141Jakarta";
const ADMIN_NAME = "Administrator";

async function main() {
  console.log("🌱 Membuat akun admin...");

  try {
    const result = await auth.api.signUpEmail({
      body: {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        name: ADMIN_NAME,
      },
    });

    if (!result?.user) {
      console.error("❌ Gagal membuat user:", result);
      process.exit(1);
    }

    console.log("✅ Admin berhasil dibuat:");
    console.log("   Email   :", ADMIN_EMAIL);
    console.log("   Password:", ADMIN_PASSWORD);
    console.log("   ID      :", result.user.id);
    console.log("");
    console.log("⚠️  Ganti password setelah login pertama!");
  } catch (err: any) {
    if (err?.message?.includes("already exists") || err?.status === 422) {
      console.log("ℹ️  User sudah ada — tidak perlu seed ulang.");
      console.log("   Email   :", ADMIN_EMAIL);
      console.log("   Password:", ADMIN_PASSWORD);
    } else {
      console.error("❌ Error:", err?.message ?? err);
      process.exit(1);
    }
  }

  process.exit(0);
}

main();
