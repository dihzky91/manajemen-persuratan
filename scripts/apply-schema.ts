import { db } from "../src/server/db";
import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/neon-http/migrator";
import path from "path";

async function main() {
  console.log("🔄 Resetting schema...");
  await db.execute(sql.raw(`DROP SCHEMA public CASCADE`));
  await db.execute(sql.raw(`CREATE SCHEMA public`));
  await db.execute(sql.raw(`GRANT USAGE ON SCHEMA public TO public`));
  await db.execute(sql.raw(`GRANT CREATE ON SCHEMA public TO public`));
  console.log("✅ Schema reset done");

  console.log("📦 Applying migration...");
  await migrate(db, {
    migrationsFolder: path.join(process.cwd(), "drizzle/migrations"),
  });
  console.log("✅ Migration applied!");
  process.exit(0);
}

main().catch((e) => {
  console.error("Error:", e.message ?? e);
  process.exit(1);
});
