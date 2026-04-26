/**
 * Seed data awal untuk modul Penomoran Sertifikat (Certificate Hub).
 *
 * Jalankan dengan:
 *   npx tsx --env-file=.env src/server/db/seed-cert-hub.ts
 *
 * Script ini idempotent — aman dijalankan berulang kali.
 * Baris yang sudah ada (berdasarkan unique constraint) akan dilewati.
 */

import { db } from "./index";
import {
  certificatePrograms,
  certificateClassTypes,
  certificateSerialConfig,
} from "./schema";
import { sql } from "drizzle-orm";

// ─── Data seed ────────────────────────────────────────────────────────────────

const programs = [
  { name: "Brevet AB", code: "AB" },
  { name: "Brevet C",  code: "C"  },
  { name: "BFA",       code: "BFA" },
];

const classTypes = [
  { name: "Reguler Pagi",  code: "01" },
  { name: "Reguler Siang", code: "02" },
  { name: "Weekend",       code: "03" },
  { name: "Online",        code: "04" },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding Certificate Hub data...\n");

  // 1. Serial config (singleton)
  await db
    .insert(certificateSerialConfig)
    .values({ key: "last_serial_number", value: "0" })
    .onConflictDoNothing();
  console.log("✅ certificate_serial_config: last_serial_number = 0");

  // 2. Program pelatihan
  for (const prog of programs) {
    await db
      .insert(certificatePrograms)
      .values({
        id:        crypto.randomUUID(),
        name:      prog.name,
        code:      prog.code,
        updatedAt: new Date(),
      })
      .onConflictDoNothing();
    console.log(`✅ program: ${prog.name} (${prog.code})`);
  }

  // 3. Jenis kelas
  for (const ct of classTypes) {
    await db
      .insert(certificateClassTypes)
      .values({
        id:        crypto.randomUUID(),
        name:      ct.name,
        code:      ct.code,
        updatedAt: new Date(),
      })
      .onConflictDoNothing();
    console.log(`✅ class_type: ${ct.name} (kode: ${ct.code})`);
  }

  console.log("\n🎉 Seed selesai!");

  // Tampilkan ringkasan
  const [progCount] = await db.select({ count: sql<number>`count(*)::int` }).from(certificatePrograms);
  const [ctCount]   = await db.select({ count: sql<number>`count(*)::int` }).from(certificateClassTypes);
  console.log(`\n📊 Ringkasan DB:`);
  console.log(`   Programs  : ${progCount?.count ?? 0} baris`);
  console.log(`   ClassTypes: ${ctCount?.count   ?? 0} baris`);

  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seed gagal:", err);
  process.exit(1);
});
