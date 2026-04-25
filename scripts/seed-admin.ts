/**
 * Seed script: buat akun admin pertama.
 * Jalankan: npx dotenv-cli -e .env.local -- npx tsx scripts/seed-admin.ts
 */
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../src/server/db";
import {
  users,
  session as sessionTable,
  account as accountTable,
  verification as verificationTable,
} from "../src/server/db/schema";
import { eq } from "drizzle-orm";

// Parallel auth instance khusus seed: signup TIDAK di-disable agar admin pertama
// bisa dibuat. Auth instance yang dipakai aplikasi (src/server/auth.ts) tetap
// punya `disableSignUp: true`.
const seedAuth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: users,
      session: sessionTable,
      account: accountTable,
      verification: verificationTable,
    },
    usePlural: false,
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  generateId: () => crypto.randomUUID(),
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
  },
  user: {
    fields: { name: "namaLengkap" },
  },
});

const ADMIN_EMAIL = "admin@iaijakarta.or.id";
const ADMIN_PASSWORD = "141Jakarta";
const ADMIN_NAME = "Administrator";

async function main() {
  console.log("🌱 Membuat akun admin...");

  try {
    const result = await seedAuth.api.signUpEmail({
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

    await db
      .update(users)
      .set({
        role: "admin",
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, result.user.id));

    console.log("✅ Admin berhasil dibuat:");
    console.log("   Email   :", ADMIN_EMAIL);
    console.log("   Password:", ADMIN_PASSWORD);
    console.log("   ID      :", result.user.id);
    console.log("   Role    :", "admin");
    console.log("");
    console.log("⚠️  Ganti password setelah login pertama!");
  } catch (err: any) {
    if (err?.message?.includes("already exists") || err?.status === 422) {
      await db
        .update(users)
        .set({
          role: "admin",
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(users.email, ADMIN_EMAIL));

      console.log("ℹ️  User sudah ada — tidak perlu seed ulang.");
      console.log("   Email   :", ADMIN_EMAIL);
      console.log("   Password:", ADMIN_PASSWORD);
      console.log("   Role    :", "admin");
    } else {
      console.error("❌ Error:", err?.message ?? err);
      process.exit(1);
    }
  }

  process.exit(0);
}

main();
