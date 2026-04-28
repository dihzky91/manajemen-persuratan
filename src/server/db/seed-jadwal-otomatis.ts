import { nanoid } from "nanoid";
import { sql } from "drizzle-orm";
import { db } from "./index";
import {
  programs,
  classTypes,
  curriculumTemplate,
  curriculumExamPoints,
} from "./schema";

const PROGRAM_IDS = {
  BREVET_AB: nanoid(),
  BREVET_C: nanoid(),
  BFA: nanoid(),
};

const CLASS_TYPE_IDS = {
  WEEKEND_PAGI: nanoid(),
  WEEKEND_SIANG: nanoid(),
  WEEKDAY_SELASA_KAMIS: nanoid(),
  WEEKDAY_SENIN_RABU_JUMAT: nanoid(),
};

function generateSessions(
  programId: string,
  blocks: { block: string; sessions: [number, number]; materi: string }[],
): { id: string; programId: string; sessionNumber: number; materiBlock: string; materiName: string; slot: number }[] {
  const result: { id: string; programId: string; sessionNumber: number; materiBlock: string; materiName: string; slot: number }[] = [];
  for (const block of blocks) {
    for (let s = block.sessions[0]; s <= block.sessions[1]; s++) {
      const slot = s % 2 === 1 ? 1 : 2;
      result.push({
        id: nanoid(),
        programId,
        sessionNumber: s,
        materiBlock: block.block,
        materiName: block.materi,
        slot,
      });
    }
  }
  return result;
}

async function seedJadwalOtomatis() {
  // ─── PROGRAMS ──────────────────────────────────────────────────────────────
  await db.insert(programs).values([
    { id: PROGRAM_IDS.BREVET_AB, code: "BREVET_AB", name: "Brevet AB", totalSessions: 60, totalMeetings: 35 },
    { id: PROGRAM_IDS.BREVET_C, code: "BREVET_C", name: "Brevet C", totalSessions: 30, totalMeetings: 18 },
    { id: PROGRAM_IDS.BFA, code: "BFA", name: "BFA", totalSessions: 40, totalMeetings: 25 },
  ]).onConflictDoNothing();

  // ─── CLASS TYPES ───────────────────────────────────────────────────────────
  await db.insert(classTypes).values([
    { id: CLASS_TYPE_IDS.WEEKEND_PAGI, code: "weekend_pagi", name: "Weekend Pagi", activeDays: "Sat,Sun", slot1Start: "08:00", slot1End: "10:15", slot2Start: "10:30", slot2End: "12:30" },
    { id: CLASS_TYPE_IDS.WEEKEND_SIANG, code: "weekend_siang", name: "Weekend Siang", activeDays: "Sat,Sun", slot1Start: "13:00", slot1End: "15:15", slot2Start: "15:30", slot2End: "17:15" },
    { id: CLASS_TYPE_IDS.WEEKDAY_SELASA_KAMIS, code: "weekday_selasa_kamis", name: "Weekday Selasa-Kamis", activeDays: "Tue,Thu", slot1Start: "17:15", slot1End: "19:15", slot2Start: "19:30", slot2End: "21:30" },
    { id: CLASS_TYPE_IDS.WEEKDAY_SENIN_RABU_JUMAT, code: "weekday_senin_rabu_jumat", name: "Weekday Senin-Rabu-Jumat", activeDays: "Mon,Wed,Fri", slot1Start: "17:15", slot1End: "19:15", slot2Start: "19:30", slot2End: "21:30" },
  ]).onConflictDoNothing();

  // ─── CURRICULUM BREVET AB (60 sesi) ───────────────────────────────────────
  const abBlocks = [
    { block: "Pengantar Hukum Pajak", sessions: [1, 2] as [number, number], materi: "Pengantar Hukum Pajak" },
    { block: "KUP A", sessions: [3, 4] as [number, number], materi: "KUP A" },
    { block: "PPh Orang Pribadi", sessions: [5, 12] as [number, number], materi: "PPh Orang Pribadi" },
    { block: "PPh Pemotongan Pemungutan", sessions: [13, 20] as [number, number], materi: "PPh Pemotongan Pemungutan" },
    { block: "Pajak Bumi & Bangunan", sessions: [21, 22] as [number, number], materi: "Pajak Bumi & Bangunan" },
    { block: "Bea Meterai", sessions: [23, 23] as [number, number], materi: "Bea Meterai" },
    { block: "PPN A", sessions: [24, 31] as [number, number], materi: "PPN A" },
    { block: "KUP B", sessions: [32, 35] as [number, number], materi: "KUP B" },
    { block: "PPh Badan", sessions: [36, 43] as [number, number], materi: "PPh Badan" },
    { block: "Pemeriksaan Pajak", sessions: [44, 45] as [number, number], materi: "Pemeriksaan Pajak" },
    { block: "PPN B", sessions: [46, 49] as [number, number], materi: "PPN B" },
    { block: "Akuntansi Perpajakan", sessions: [50, 56] as [number, number], materi: "Akuntansi Perpajakan" },
    { block: "Simulasi e-SPT & Manajemen Perpajakan", sessions: [57, 60] as [number, number], materi: "Simulasi e-SPT & Manajemen Perpajakan" },
  ];

  const abSessions = generateSessions(PROGRAM_IDS.BREVET_AB, abBlocks);
  await db.insert(curriculumTemplate).values(abSessions).onConflictDoNothing();

  // Exam points Brevet AB
  await db.insert(curriculumExamPoints).values([
    { id: nanoid(), programId: PROGRAM_IDS.BREVET_AB, afterSessionNumber: 12, isMixedDay: false, examSlotCount: 2, examSubjects: ["KUP A", "PPh Orang Pribadi"], hasExam: true },
    { id: nanoid(), programId: PROGRAM_IDS.BREVET_AB, afterSessionNumber: 23, isMixedDay: true, examSlotCount: 2, examSubjects: ["PPh Pemotongan Pemungutan"], hasExam: true },
    { id: nanoid(), programId: PROGRAM_IDS.BREVET_AB, afterSessionNumber: 31, isMixedDay: false, examSlotCount: 2, examSubjects: ["Pajak Bumi & Bangunan", "PPN A"], hasExam: true },
    { id: nanoid(), programId: PROGRAM_IDS.BREVET_AB, afterSessionNumber: 43, isMixedDay: false, examSlotCount: 2, examSubjects: ["KUP B", "PPh Badan"], hasExam: true },
    { id: nanoid(), programId: PROGRAM_IDS.BREVET_AB, afterSessionNumber: 56, isMixedDay: false, examSlotCount: 2, examSubjects: ["PPN B", "Akuntansi Perpajakan"], hasExam: true },
  ]).onConflictDoNothing();

  // ─── CURRICULUM BREVET C (30 sesi) ────────────────────────────────────────
  const cBlocks = [
    { block: "Perpajakan Internasional", sessions: [1, 8] as [number, number], materi: "Perpajakan Internasional" },
    { block: "PPh Pemotongan & Pemungutan C", sessions: [9, 12] as [number, number], materi: "PPh Pemotongan & Pemungutan C" },
    { block: "PPh Badan C", sessions: [13, 16] as [number, number], materi: "PPh Badan C" },
    { block: "Transfer Pricing", sessions: [17, 20] as [number, number], materi: "Transfer Pricing" },
    { block: "Akuntansi Pajak C", sessions: [21, 24] as [number, number], materi: "Akuntansi Pajak C" },
    { block: "Tax Planning", sessions: [25, 30] as [number, number], materi: "Tax Planning" },
  ];

  const cSessions = generateSessions(PROGRAM_IDS.BREVET_C, cBlocks);
  await db.insert(curriculumTemplate).values(cSessions).onConflictDoNothing();

  await db.insert(curriculumExamPoints).values([
    { id: nanoid(), programId: PROGRAM_IDS.BREVET_C, afterSessionNumber: 12, isMixedDay: false, examSlotCount: 2, examSubjects: ["Perpajakan Internasional", "PPh PotPut C"], hasExam: true },
    { id: nanoid(), programId: PROGRAM_IDS.BREVET_C, afterSessionNumber: 20, isMixedDay: false, examSlotCount: 2, examSubjects: ["PPh Badan C", "Transfer Pricing"], hasExam: true },
    { id: nanoid(), programId: PROGRAM_IDS.BREVET_C, afterSessionNumber: 24, isMixedDay: false, examSlotCount: 1, examSubjects: ["Akuntansi Pajak C"], hasExam: true },
    // Blok Tax Planning tidak punya ujian (hasExam: false)
    { id: nanoid(), programId: PROGRAM_IDS.BREVET_C, afterSessionNumber: 30, isMixedDay: false, examSlotCount: 0, examSubjects: [], hasExam: false },
  ]).onConflictDoNothing();

  // ─── CURRICULUM BFA (40 sesi) ────────────────────────────────────────────
  const bfaBlocks = [
    { block: "Dasar-Dasar Akuntansi", sessions: [1, 6] as [number, number], materi: "Dasar-Dasar Akuntansi" },
    { block: "Akuntansi Kas, Piutang, Persediaan", sessions: [7, 16] as [number, number], materi: "Akuntansi Kas, Piutang, Persediaan" },
    { block: "Akuntansi Aset", sessions: [17, 20] as [number, number], materi: "Akuntansi Aset" },
    { block: "Akuntansi Kewajiban & Ekuitas", sessions: [21, 30] as [number, number], materi: "Akuntansi Kewajiban & Ekuitas" },
    { block: "Laporan Keuangan & Analisis", sessions: [31, 40] as [number, number], materi: "Laporan Keuangan & Analisis" },
  ];

  const bfaSessions = generateSessions(PROGRAM_IDS.BFA, bfaBlocks);
  await db.insert(curriculumTemplate).values(bfaSessions).onConflictDoNothing();

  await db.insert(curriculumExamPoints).values([
    { id: nanoid(), programId: PROGRAM_IDS.BFA, afterSessionNumber: 6, isMixedDay: false, examSlotCount: 1, examSubjects: ["Evaluasi Dasar-Dasar Akuntansi"], hasExam: true },
    { id: nanoid(), programId: PROGRAM_IDS.BFA, afterSessionNumber: 16, isMixedDay: false, examSlotCount: 1, examSubjects: ["Evaluasi Kas, Piutang, Persediaan"], hasExam: true },
    { id: nanoid(), programId: PROGRAM_IDS.BFA, afterSessionNumber: 20, isMixedDay: false, examSlotCount: 1, examSubjects: ["Evaluasi Akuntansi Aset"], hasExam: true },
    { id: nanoid(), programId: PROGRAM_IDS.BFA, afterSessionNumber: 30, isMixedDay: false, examSlotCount: 1, examSubjects: ["Evaluasi Kewajiban & Ekuitas"], hasExam: true },
    { id: nanoid(), programId: PROGRAM_IDS.BFA, afterSessionNumber: 40, isMixedDay: false, examSlotCount: 1, examSubjects: ["Evaluasi Laporan Keuangan & Analisis"], hasExam: true },
  ]).onConflictDoNothing();
}

async function main() {
  console.log("🌱 Seeding Jadwal Otomatis Brevet data...\n");

  await seedJadwalOtomatis();

  const [progResult] = await db.select({ count: sql<number>`count(*)::int` }).from(programs);
  const [ctResult] = await db.select({ count: sql<number>`count(*)::int` }).from(classTypes);
  const [curResult] = await db.select({ count: sql<number>`count(*)::int` }).from(curriculumTemplate);
  const [examResult] = await db.select({ count: sql<number>`count(*)::int` }).from(curriculumExamPoints);

  console.log("📊 Ringkasan DB:");
  console.log(`   Programs           : ${progResult?.count ?? 0} baris`);
  console.log(`   ClassTypes         : ${ctResult?.count ?? 0} baris`);
  console.log(`   CurriculumTemplate : ${curResult?.count ?? 0} baris`);
  console.log(`   ExamPoints         : ${examResult?.count ?? 0} baris`);

  console.log("\n🎉 Seed selesai!");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seed gagal:", err);
  process.exit(1);
});
