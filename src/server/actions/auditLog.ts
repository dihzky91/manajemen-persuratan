"use server";

import { desc, eq, and, gte, lte, like, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { auditLog, users } from "@/server/db/schema";
import { requireRole } from "./auth";

export type AuditLogRow = {
  id: number;
  userId: string | null;
  namaUser: string | null;
  emailUser: string | null;
  aksi: string | null;
  entitasType: string | null;
  entitasId: string | null;
  detail: unknown;
  ipAddress: string | null;
  createdAt: Date | null;
};

export type AuditLogFilter = {
  search?: string;
  entitasType?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  page?: number;
  pageSize?: number;
};

export type AuditLogResult = {
  rows: AuditLogRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function listAuditLog(filter: AuditLogFilter = {}): Promise<AuditLogResult> {
  await requireRole(["admin"]);

  const page = Math.max(1, filter.page ?? 1);
  const pageSize = [10, 25, 50].includes(filter.pageSize ?? 25) ? (filter.pageSize ?? 25) : 25;
  const offset = (page - 1) * pageSize;

  const conditions = [];

  if (filter.entitasType && filter.entitasType !== "__all__") {
    conditions.push(eq(auditLog.entitasType, filter.entitasType));
  }

  if (filter.startDate) {
    conditions.push(gte(auditLog.createdAt, new Date(filter.startDate)));
  }

  if (filter.endDate) {
    // Akhir hari
    const end = new Date(filter.endDate);
    end.setHours(23, 59, 59, 999);
    conditions.push(lte(auditLog.createdAt, end));
  }

  if (filter.search) {
    conditions.push(like(auditLog.aksi, `%${filter.search}%`));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalRow, rows] = await Promise.all([
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(auditLog)
      .where(where),
    db
      .select({
        id: auditLog.id,
        userId: auditLog.userId,
        namaUser: users.namaLengkap,
        emailUser: users.email,
        aksi: auditLog.aksi,
        entitasType: auditLog.entitasType,
        entitasId: auditLog.entitasId,
        detail: auditLog.detail,
        ipAddress: auditLog.ipAddress,
        createdAt: auditLog.createdAt,
      })
      .from(auditLog)
      .leftJoin(users, eq(auditLog.userId, users.id))
      .where(where)
      .orderBy(desc(auditLog.createdAt))
      .limit(pageSize)
      .offset(offset),
  ]);

  const total = totalRow[0]?.total ?? 0;

  return {
    rows,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

// Daftar entitas unik untuk filter dropdown
export async function listAuditEntitasTypes(): Promise<string[]> {
  await requireRole(["admin"]);
  const rows = await db
    .selectDistinct({ entitasType: auditLog.entitasType })
    .from(auditLog)
    .where(sql`${auditLog.entitasType} IS NOT NULL`)
    .orderBy(auditLog.entitasType);
  return rows.map((r) => r.entitasType!);
}
