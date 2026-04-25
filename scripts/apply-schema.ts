/**
 * DESTRUCTIVE: drop schema public + drizzle, lalu re-create kosong.
 * Setelah jalan, push schema dari src/server/db/schema.ts:
 *   npx -y dotenv-cli -e .env.local -- npx drizzle-kit push --force
 *
 * Catatan: kita pakai db:push (sync schema langsung) alih-alih `migrate()` dari
 * neon-http migrator karena migrator tsb. tidak reliabel jalankan migrasi
 * multi-statement yang sudah ada (lihat issue terkait neon-http transactions).
 */
import { db } from "../src/server/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("🔄 Dropping schema...");
  await db.execute(sql.raw(`DROP SCHEMA IF EXISTS drizzle CASCADE`));
  await db.execute(sql.raw(`DROP SCHEMA IF EXISTS public CASCADE`));
  await db.execute(sql.raw(`CREATE SCHEMA public`));
  await db.execute(sql.raw(`GRANT USAGE ON SCHEMA public TO public`));
  await db.execute(sql.raw(`GRANT CREATE ON SCHEMA public TO public`));
  console.log("✅ Schema reset done.");
  console.log(
    "ℹ️  Lanjutkan: npx -y dotenv-cli -e .env.local -- npx drizzle-kit push --force",
  );
  process.exit(0);
}

main().catch((e) => {
  console.error("Error:", e?.message ?? e);
  if (e?.cause) console.error("Cause:", e.cause);
  if (e?.stack) console.error("Stack:", e.stack);
  process.exit(1);
});
