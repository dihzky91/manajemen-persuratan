"use server";

import { desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { events, participants } from "@/server/db/schema";
import { requireSession } from "../auth";

export type SertifikatStats = {
  totalEvents: number;
  totalParticipants: number;
  activeEvents: number;
};

export type SertifikatAnalytics = {
  trends: { month: string; count: number }[];
  categories: { name: string; value: number }[];
  topEvents: { name: string; date: string; participants: number }[];
};

function todayJakarta() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export async function getStats(): Promise<SertifikatStats> {
  await requireSession();
  const today = todayJakarta();

  const [eventCount, participantCount, activeCount] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(events),
    db.select({ count: sql<number>`count(*)::int` }).from(participants),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(events)
      .where(gte(events.tanggalSelesai, today)),
  ]);

  return {
    totalEvents: eventCount[0]?.count ?? 0,
    totalParticipants: participantCount[0]?.count ?? 0,
    activeEvents: activeCount[0]?.count ?? 0,
  };
}

export async function getAnalytics(): Promise<SertifikatAnalytics> {
  await requireSession();

  const [trends, categories, topEvents] = await Promise.all([
    db
      .select({
        month: sql<string>`to_char(${events.tanggalMulai}::date, 'YYYY-MM')`,
        count: sql<number>`count(${participants.id})::int`,
      })
      .from(events)
      .leftJoin(participants, eq(events.id, participants.eventId))
      .where(sql`${events.tanggalMulai} >= (current_date - interval '12 months')`)
      .groupBy(sql`to_char(${events.tanggalMulai}::date, 'YYYY-MM')`)
      .orderBy(sql`to_char(${events.tanggalMulai}::date, 'YYYY-MM')`),
    db
      .select({
        name: events.kategori,
        value: sql<number>`count(${participants.id})::int`,
      })
      .from(events)
      .leftJoin(participants, eq(events.id, participants.eventId))
      .groupBy(events.kategori)
      .orderBy(events.kategori),
    db
      .select({
        name: events.namaKegiatan,
        date: events.tanggalMulai,
        participants: sql<number>`count(${participants.id})::int`,
      })
      .from(events)
      .leftJoin(participants, eq(events.id, participants.eventId))
      .groupBy(events.id)
      .orderBy(desc(sql<number>`count(${participants.id})`), desc(events.tanggalMulai))
      .limit(5),
  ]);

  return { trends, categories, topEvents };
}
