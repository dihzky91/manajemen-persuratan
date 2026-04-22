import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  // Jangan crash saat build/dev awal — cukup warning. Query pertama akan gagal dengan jelas.
  console.warn(
    "[db] DATABASE_URL belum di-set. Isi .env.local sebelum menjalankan query DB.",
  );
}

// fetchConnectionCache kini selalu aktif secara default di Neon driver terbaru

const sql = neon(databaseUrl ?? "postgresql://invalid:invalid@invalid/invalid");

export const db = drizzle(sql, { schema });
export { schema };
export type DB = typeof db;
