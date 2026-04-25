"use server";

import { db } from "@/server/db";
import {
  suratKeluar,
  suratMasuk,
  disposisi,
  users,
  divisi,
} from "@/server/db/schema";
import { count, eq, sql, and, gte, lte, between } from "drizzle-orm";

export interface DashboardStats {
  totalSuratKeluar: number;
  totalSuratMasuk: number;
  totalDisposisi: number;
  totalPegawai: number;
  suratKeluarByStatus: { status: string; count: number }[];
  suratMasukByStatus: { status: string; count: number }[];
  suratByJenis: { jenis: string; count: number }[];
  suratKeluarMonthly: { month: string; count: number }[];
  suratMasukMonthly: { month: string; count: number }[];
  disposisiByStatus: { status: string; count: number }[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [
    totalSuratKeluarResult,
    totalSuratMasukResult,
    totalDisposisiResult,
    totalPegawaiResult,
  ] = await Promise.all([
    db.select({ count: count() }).from(suratKeluar),
    db.select({ count: count() }).from(suratMasuk),
    db.select({ count: count() }).from(disposisi),
    db.select({ count: count() }).from(users),
  ]);

  // Surat keluar by status
  const suratKeluarByStatus = await db
    .select({
      status: suratKeluar.status,
      count: count(),
    })
    .from(suratKeluar)
    .groupBy(suratKeluar.status);

  // Surat masuk by status
  const suratMasukByStatus = await db
    .select({
      status: suratMasuk.status,
      count: count(),
    })
    .from(suratMasuk)
    .groupBy(suratMasuk.status);

  // Surat by jenis (combined keluar and masuk)
  const suratKeluarByJenis = await db
    .select({
      jenis: suratKeluar.jenisSurat,
      count: count(),
    })
    .from(suratKeluar)
    .groupBy(suratKeluar.jenisSurat);

  const suratMasukByJenis = await db
    .select({
      jenis: suratMasuk.jenisSurat,
      count: count(),
    })
    .from(suratMasuk)
    .groupBy(suratMasuk.jenisSurat);

  const jenisMap = new Map<string, number>();
  [...suratKeluarByJenis, ...suratMasukByJenis].forEach((item) => {
    const current = jenisMap.get(item.jenis) || 0;
    jenisMap.set(item.jenis, current + item.count);
  });

  const suratByJenis = Array.from(jenisMap.entries()).map(([jenis, count]) => ({
    jenis,
    count,
  }));

  // Monthly stats for current year
  const currentYear = new Date().getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);
  const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

  const suratKeluarMonthlyRaw = await db
    .select({
      month: sql<string>`EXTRACT(MONTH FROM ${suratKeluar.createdAt})`,
      count: count(),
    })
    .from(suratKeluar)
    .where(
      and(
        gte(suratKeluar.createdAt, startOfYear),
        lte(suratKeluar.createdAt, endOfYear)
      )
    )
    .groupBy(sql`EXTRACT(MONTH FROM ${suratKeluar.createdAt})`);

  const suratMasukMonthlyRaw = await db
    .select({
      month: sql<string>`EXTRACT(MONTH FROM ${suratMasuk.createdAt})`,
      count: count(),
    })
    .from(suratMasuk)
    .where(
      and(
        gte(suratMasuk.createdAt, startOfYear),
        lte(suratMasuk.createdAt, endOfYear)
      )
    )
    .groupBy(sql`EXTRACT(MONTH FROM ${suratMasuk.createdAt})`);

  const months = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Ags", "Sep", "Okt", "Nov", "Des",
  ];

  const suratKeluarMonthly = months.map((month, index) => {
    const found = suratKeluarMonthlyRaw.find(
      (r) => parseInt(r.month) === index + 1
    );
    return { month, count: found?.count || 0 };
  });

  const suratMasukMonthly = months.map((month, index) => {
    const found = suratMasukMonthlyRaw.find(
      (r) => parseInt(r.month) === index + 1
    );
    return { month, count: found?.count || 0 };
  });

  // Disposisi by status
  const disposisiByStatus = await db
    .select({
      status: disposisi.status,
      count: count(),
    })
    .from(disposisi)
    .groupBy(disposisi.status);

  return {
    totalSuratKeluar: totalSuratKeluarResult[0]?.count || 0,
    totalSuratMasuk: totalSuratMasukResult[0]?.count || 0,
    totalDisposisi: totalDisposisiResult[0]?.count || 0,
    totalPegawai: totalPegawaiResult[0]?.count || 0,
    suratKeluarByStatus: suratKeluarByStatus.map((s) => ({
      status: s.status || "unknown",
      count: s.count,
    })),
    suratMasukByStatus: suratMasukByStatus.map((s) => ({
      status: s.status || "unknown",
      count: s.count,
    })),
    suratByJenis,
    suratKeluarMonthly,
    suratMasukMonthly,
    disposisiByStatus: disposisiByStatus.map((s) => ({
      status: s.status || "unknown",
      count: s.count,
    })),
  };
}

export async function getSuratKeluarTrend(days: number = 30) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  const result = await db
    .select({
      date: sql<string>`DATE(${suratKeluar.createdAt})`,
      count: count(),
    })
    .from(suratKeluar)
    .where(
      and(
        gte(suratKeluar.createdAt, startDate),
        lte(suratKeluar.createdAt, endDate)
      )
    )
    .groupBy(sql`DATE(${suratKeluar.createdAt})`)
    .orderBy(sql`DATE(${suratKeluar.createdAt})`);

  return result;
}

export async function getDivisiStats() {
  const result = await db
    .select({
      divisiId: users.divisiId,
      divisiName: divisi.nama,
      count: count(),
    })
    .from(users)
    .leftJoin(divisi, eq(users.divisiId, divisi.id))
    .where(eq(users.isActive, true))
    .groupBy(users.divisiId, divisi.nama);

  return result;
}
