"use server";

import { and, asc, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/server/actions/auth";
import { db } from "@/server/db";
import {
  classSessions,
  honorariumAuditLogs,
  honorariumBatches,
  honorariumItems,
  honorariumRateRules,
  instructorExpertise,
  instructorRates,
  instructors,
  kelasPelatihan,
  programs,
  sessionAssignments,
} from "@/server/db/schema";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const upsertRateSchema = z.object({
  instructorId: z.string().min(1),
  programId: z.string().min(1),
  materiBlock: z.string().trim().min(1).max(100),
  rateAmount: z.number().finite().min(0),
});

const upsertRateRuleSchema = z.object({
  id: z.string().optional(),
  programId: z.string().min(1),
  level: z.enum(["basic", "middle", "senior"]),
  mode: z.enum(["online", "offline"]),
  honorPerSession: z.number().finite().min(0),
  transportAmount: z.number().finite().min(0),
  effectiveFrom: dateSchema,
  effectiveTo: dateSchema.optional().or(z.literal("")),
  locationScope: z.string().trim().max(200).optional().or(z.literal("")),
  notes: z.string().trim().max(300).optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

const reportFilterSchema = z.object({
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
  instructorId: z.string().optional(),
  programId: z.string().optional(),
});

const generateBatchSchema = z.object({
  startDate: dateSchema,
  endDate: dateSchema,
  internalNotes: z.string().trim().max(500).optional().or(z.literal("")),
});

type ExpertiseLevel = "basic" | "middle" | "senior";

function toNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function formatDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function defaultDateRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    startDate: formatDateOnly(start),
    endDate: formatDateOnly(now),
  };
}

function normalizeMode(mode: string | null): "online" | "offline" {
  return mode === "online" ? "online" : "offline";
}

type RateRuleCandidate = {
  programId: string;
  level: string;
  mode: string;
  honorPerSession: unknown;
  transportAmount: unknown;
  effectiveFrom: string;
  effectiveTo: string | null;
  locationScope: string;
};

function isDateWithinRange(dateValue: string, start: string, end: string | null) {
  if (dateValue < start) return false;
  if (end && dateValue > end) return false;
  return true;
}

function matchLocationScope(location: string | null, scope: string) {
  const normalizedScope = scope.trim().toLowerCase();
  if (!normalizedScope) return true;
  if (!location) return false;
  return location.toLowerCase().includes(normalizedScope);
}

function pickRateRule(
  rules: RateRuleCandidate[],
  params: {
    programId: string;
    level: ExpertiseLevel;
    mode: "online" | "offline";
    scheduledDate: string;
    lokasi: string | null;
  },
) {
  const filtered = rules.filter((rule) => {
    if (rule.programId !== params.programId) return false;
    if (normalizeExpertiseLevel(rule.level) !== params.level) return false;
    if (rule.mode !== params.mode) return false;
    if (!isDateWithinRange(params.scheduledDate, rule.effectiveFrom, rule.effectiveTo)) return false;
    return matchLocationScope(params.lokasi, rule.locationScope);
  });

  if (filtered.length === 0) return null;

  const sorted = filtered.sort((a, b) => {
    const aHasScope = a.locationScope.trim().length > 0 ? 1 : 0;
    const bHasScope = b.locationScope.trim().length > 0 ? 1 : 0;
    if (aHasScope !== bHasScope) return bHasScope - aHasScope;
    return b.effectiveFrom.localeCompare(a.effectiveFrom);
  });

  return sorted[0] ?? null;
}

export async function listInstructorRates(instructorId: string) {
  await requirePermission("jadwalUjian", "view");

  if (!instructorId) return [];

  return db
    .select({
      id: instructorRates.id,
      instructorId: instructorRates.instructorId,
      programId: instructorRates.programId,
      programName: programs.name,
      materiBlock: instructorRates.materiBlock,
      rateAmount: instructorRates.rateAmount,
      updatedAt: instructorRates.updatedAt,
    })
    .from(instructorRates)
    .innerJoin(programs, eq(instructorRates.programId, programs.id))
    .where(eq(instructorRates.instructorId, instructorId))
    .orderBy(asc(programs.name), asc(instructorRates.materiBlock));
}

export async function upsertInstructorRate(data: z.infer<typeof upsertRateSchema>) {
  await requirePermission("jadwalUjian", "manage");
  const parsed = upsertRateSchema.parse(data);

  const existing = await db
    .select({ id: instructorRates.id })
    .from(instructorRates)
    .where(
      and(
        eq(instructorRates.instructorId, parsed.instructorId),
        eq(instructorRates.programId, parsed.programId),
        eq(instructorRates.materiBlock, parsed.materiBlock),
      ),
    )
    .limit(1);

  if (existing[0]) {
    await db
      .update(instructorRates)
      .set({
        rateAmount: parsed.rateAmount.toFixed(2),
        updatedAt: new Date(),
      })
      .where(eq(instructorRates.id, existing[0].id));
  } else {
    await db.insert(instructorRates).values({
      id: nanoid(),
      instructorId: parsed.instructorId,
      programId: parsed.programId,
      materiBlock: parsed.materiBlock,
      rateAmount: parsed.rateAmount.toFixed(2),
    });
  }

  revalidatePath("/jadwal-otomatis/instruktur");
  return { ok: true as const };
}

export async function removeInstructorRate(id: string) {
  await requirePermission("jadwalUjian", "manage");

  await db.delete(instructorRates).where(eq(instructorRates.id, id));

  revalidatePath("/jadwal-otomatis/instruktur");
  return { ok: true as const };
}

export async function listHonorariumRateRules(programId?: string) {
  await requirePermission("jadwalUjian", "view");

  const rows = await db
    .select({
      id: honorariumRateRules.id,
      programId: honorariumRateRules.programId,
      programName: programs.name,
      level: honorariumRateRules.level,
      mode: honorariumRateRules.mode,
      honorPerSession: honorariumRateRules.honorPerSession,
      transportAmount: honorariumRateRules.transportAmount,
      effectiveFrom: honorariumRateRules.effectiveFrom,
      effectiveTo: honorariumRateRules.effectiveTo,
      locationScope: honorariumRateRules.locationScope,
      isActive: honorariumRateRules.isActive,
      notes: honorariumRateRules.notes,
      updatedAt: honorariumRateRules.updatedAt,
    })
    .from(honorariumRateRules)
    .innerJoin(programs, eq(honorariumRateRules.programId, programs.id))
    .where(
      programId
        ? and(
            eq(honorariumRateRules.programId, programId),
            eq(honorariumRateRules.isActive, true),
          )
        : eq(honorariumRateRules.isActive, true),
    )
    .orderBy(
      asc(programs.name),
      asc(honorariumRateRules.level),
      asc(honorariumRateRules.mode),
      desc(honorariumRateRules.effectiveFrom),
    );

  return rows.map((row) => ({
    ...row,
    honorPerSession: toNumber(row.honorPerSession),
    transportAmount: toNumber(row.transportAmount),
  }));
}

export async function upsertHonorariumRateRule(data: z.infer<typeof upsertRateRuleSchema>) {
  await requirePermission("jadwalUjian", "manage");
  const parsed = upsertRateRuleSchema.parse(data);

  if (parsed.effectiveTo && parsed.effectiveTo < parsed.effectiveFrom) {
    throw new Error("effective_to harus >= effective_from.");
  }

  if (parsed.id) {
    await db
      .update(honorariumRateRules)
      .set({
        programId: parsed.programId,
        level: parsed.level,
        mode: parsed.mode,
        honorPerSession: parsed.honorPerSession.toFixed(2),
        transportAmount: parsed.transportAmount.toFixed(2),
        effectiveFrom: parsed.effectiveFrom,
        effectiveTo: parsed.effectiveTo || null,
        locationScope: parsed.locationScope || "",
        notes: parsed.notes || null,
        isActive: parsed.isActive,
        updatedAt: new Date(),
      })
      .where(eq(honorariumRateRules.id, parsed.id));
  } else {
    await db.insert(honorariumRateRules).values({
      id: nanoid(),
      programId: parsed.programId,
      level: parsed.level,
      mode: parsed.mode,
      honorPerSession: parsed.honorPerSession.toFixed(2),
      transportAmount: parsed.transportAmount.toFixed(2),
      effectiveFrom: parsed.effectiveFrom,
      effectiveTo: parsed.effectiveTo || null,
      locationScope: parsed.locationScope || "",
      notes: parsed.notes || null,
      isActive: parsed.isActive,
    });
  }

  revalidatePath("/jadwal-otomatis/honorarium");
  return { ok: true as const };
}

export async function removeHonorariumRateRule(id: string) {
  await requirePermission("jadwalUjian", "manage");

  await db
    .update(honorariumRateRules)
    .set({
      isActive: false,
      updatedAt: new Date(),
    })
    .where(eq(honorariumRateRules.id, id));

  revalidatePath("/jadwal-otomatis/honorarium");
  return { ok: true as const };
}

export type HonorariumReportRow = {
  assignmentId: string;
  sessionId: string;
  kelasId: string;
  scheduledDate: string;
  namaKelas: string;
  programId: string;
  programName: string;
  materiBlock: string;
  sessionStatus: string;
  paidInstructorId: string;
  paidInstructorName: string;
  source: "planned" | "actual";
  availabilityStatus: "pending_wa_confirmation" | "accepted" | "rejected" | "no_response";
  kelasMode: "online" | "offline";
  expertiseLevel: ExpertiseLevel;
  rateSource: "override_instructor" | "matrix_standard" | "missing";
  honorAmount: number;
  transportAmount: number;
  rateAmount: number;
  totalAmount: number;
};

export type HonorariumSummaryRow = {
  key: string;
  label: string;
  sessionCount: number;
  totalAmount: number;
};

export async function getHonorariumReport(filters?: z.infer<typeof reportFilterSchema>) {
  await requirePermission("jadwalUjian", "view");

  const parsed = reportFilterSchema.parse(filters ?? {});
  const defaults = defaultDateRange();

  const startDate = parsed.startDate ?? defaults.startDate;
  const endDate = parsed.endDate ?? defaults.endDate;

  const assignmentRows = await db
    .select({
      assignmentId: sessionAssignments.id,
      sessionId: sessionAssignments.sessionId,
      kelasId: classSessions.kelasId,
      plannedInstructorId: sessionAssignments.plannedInstructorId,
      actualInstructorId: sessionAssignments.actualInstructorId,
      scheduledDate: classSessions.scheduledDate,
      materiBlock: classSessions.materiName,
      sessionStatus: classSessions.status,
      namaKelas: kelasPelatihan.namaKelas,
      kelasMode: kelasPelatihan.mode,
      lokasi: kelasPelatihan.lokasi,
      programId: programs.id,
      programName: programs.name,
      availabilityStatus: sessionAssignments.availabilityStatus,
    })
    .from(sessionAssignments)
    .innerJoin(classSessions, eq(sessionAssignments.sessionId, classSessions.id))
    .innerJoin(kelasPelatihan, eq(classSessions.kelasId, kelasPelatihan.id))
    .innerJoin(programs, eq(kelasPelatihan.programId, programs.id))
    .where(
      and(
        eq(classSessions.isExamDay, false),
        gte(classSessions.scheduledDate, startDate),
        lte(classSessions.scheduledDate, endDate),
      ),
    )
    .orderBy(asc(classSessions.scheduledDate), asc(kelasPelatihan.namaKelas));

  const filteredAssignments = assignmentRows.filter((row) => {
    if (!row.materiBlock) return false;
    if (row.sessionStatus === "cancelled") return false;

    const paidInstructorId = row.actualInstructorId ?? row.plannedInstructorId;
    if (parsed.instructorId && paidInstructorId !== parsed.instructorId) return false;
    if (parsed.programId && row.programId !== parsed.programId) return false;
    return true;
  });

  if (filteredAssignments.length === 0) {
    return {
      appliedFilters: {
        startDate,
        endDate,
        instructorId: parsed.instructorId ?? "",
        programId: parsed.programId ?? "",
      },
      rows: [] as HonorariumReportRow[],
      summaryByInstructor: [] as HonorariumSummaryRow[],
      summaryByProgram: [] as HonorariumSummaryRow[],
      totals: { sessionCount: 0, totalAmount: 0 },
    };
  }

  const instructorIds = Array.from(
    new Set(
      filteredAssignments.flatMap((row) =>
        row.actualInstructorId
          ? [row.plannedInstructorId, row.actualInstructorId]
          : [row.plannedInstructorId],
      ),
    ),
  );

  const programIds = Array.from(new Set(filteredAssignments.map((row) => row.programId)));

  const [instructorRows, rateRows, expertiseRows, standardRateRows] = await Promise.all([
    db
      .select({ id: instructors.id, name: instructors.name })
      .from(instructors)
      .where(inArray(instructors.id, instructorIds)),
    db
      .select({
        instructorId: instructorRates.instructorId,
        programId: instructorRates.programId,
        materiBlock: instructorRates.materiBlock,
        rateAmount: instructorRates.rateAmount,
      })
      .from(instructorRates)
      .where(
        and(
          inArray(instructorRates.instructorId, instructorIds),
          inArray(instructorRates.programId, programIds),
        ),
      ),
    db
      .select({
        instructorId: instructorExpertise.instructorId,
        programId: instructorExpertise.programId,
        materiBlock: instructorExpertise.materiBlock,
        level: instructorExpertise.level,
      })
      .from(instructorExpertise)
      .where(
        and(
          inArray(instructorExpertise.instructorId, instructorIds),
          inArray(instructorExpertise.programId, programIds),
        ),
      ),
    db
      .select({
        programId: honorariumRateRules.programId,
        level: honorariumRateRules.level,
        mode: honorariumRateRules.mode,
        honorPerSession: honorariumRateRules.honorPerSession,
        transportAmount: honorariumRateRules.transportAmount,
        effectiveFrom: honorariumRateRules.effectiveFrom,
        effectiveTo: honorariumRateRules.effectiveTo,
        locationScope: honorariumRateRules.locationScope,
      })
      .from(honorariumRateRules)
      .where(
        and(
          inArray(honorariumRateRules.programId, programIds),
          eq(honorariumRateRules.isActive, true),
        ),
      ),
  ]);

  const instructorNameById = new Map(instructorRows.map((row) => [row.id, row.name]));
  const rateByKey = new Map(
    rateRows.map((row) => [
      `${row.instructorId}::${row.programId}::${row.materiBlock}`,
      toNumber(row.rateAmount),
    ]),
  );

  const expertiseByKey = new Map<string, ExpertiseLevel>();
  for (const row of expertiseRows) {
    expertiseByKey.set(
      `${row.instructorId}::${row.programId}::${row.materiBlock}`,
      normalizeExpertiseLevel(row.level),
    );
  }

  const rows: HonorariumReportRow[] = filteredAssignments.map((row) => {
    const paidInstructorId = row.actualInstructorId ?? row.plannedInstructorId;
    const source: "planned" | "actual" = row.actualInstructorId ? "actual" : "planned";
    const materiBlock = row.materiBlock ?? "";
    const kelasMode = normalizeMode(row.kelasMode);
    const expertiseLevel =
      expertiseByKey.get(`${paidInstructorId}::${row.programId}::${materiBlock}`) ?? "middle";

    const overrideRate = rateByKey.get(`${paidInstructorId}::${row.programId}::${materiBlock}`);

    let honorAmount = 0;
    let transportAmount = 0;
    let rateSource: HonorariumReportRow["rateSource"] = "missing";

    if (overrideRate !== undefined) {
      honorAmount = overrideRate;
      transportAmount = 0;
      rateSource = "override_instructor";
    } else {
      const matchedRule = pickRateRule(standardRateRows, {
        programId: row.programId,
        level: expertiseLevel,
        mode: kelasMode,
        scheduledDate: row.scheduledDate,
        lokasi: row.lokasi,
      });

      if (matchedRule) {
        honorAmount = toNumber(matchedRule.honorPerSession);
        transportAmount = toNumber(matchedRule.transportAmount);
        rateSource = "matrix_standard";
      }
    }

    const rateAmount = honorAmount + transportAmount;

    return {
      assignmentId: row.assignmentId,
      sessionId: row.sessionId,
      kelasId: row.kelasId,
      scheduledDate: row.scheduledDate,
      namaKelas: row.namaKelas,
      programId: row.programId,
      programName: row.programName,
      materiBlock,
      sessionStatus: row.sessionStatus,
      paidInstructorId,
      paidInstructorName:
        instructorNameById.get(paidInstructorId) ?? "Instruktur tidak ditemukan",
      source,
      kelasMode,
      expertiseLevel,
      rateSource,
      honorAmount,
      transportAmount,
      availabilityStatus:
        row.availabilityStatus === "accepted" ||
        row.availabilityStatus === "rejected" ||
        row.availabilityStatus === "no_response"
          ? row.availabilityStatus
          : "pending_wa_confirmation",
      rateAmount,
      totalAmount: rateAmount,
    };
  });

  const byInstructor = new Map<string, HonorariumSummaryRow>();
  const byProgram = new Map<string, HonorariumSummaryRow>();

  for (const row of rows) {
    const instKey = row.paidInstructorId;
    const progKey = row.programId;

    if (!byInstructor.has(instKey)) {
      byInstructor.set(instKey, {
        key: instKey,
        label: row.paidInstructorName,
        sessionCount: 0,
        totalAmount: 0,
      });
    }
    if (!byProgram.has(progKey)) {
      byProgram.set(progKey, {
        key: progKey,
        label: row.programName,
        sessionCount: 0,
        totalAmount: 0,
      });
    }

    const inst = byInstructor.get(instKey);
    if (inst) {
      inst.sessionCount += 1;
      inst.totalAmount += row.totalAmount;
    }

    const prog = byProgram.get(progKey);
    if (prog) {
      prog.sessionCount += 1;
      prog.totalAmount += row.totalAmount;
    }
  }

  const sessionCount = rows.length;
  const totalAmount = rows.reduce((sum, row) => sum + row.totalAmount, 0);

  return {
    appliedFilters: {
      startDate,
      endDate,
      instructorId: parsed.instructorId ?? "",
      programId: parsed.programId ?? "",
    },
    rows,
    summaryByInstructor: Array.from(byInstructor.values()).sort((a, b) =>
      a.label.localeCompare(b.label),
    ),
    summaryByProgram: Array.from(byProgram.values()).sort((a, b) =>
      a.label.localeCompare(b.label),
    ),
    totals: {
      sessionCount,
      totalAmount,
    },
  };
}

function normalizeExpertiseLevel(level: string | null): ExpertiseLevel {
  if (level === "basic" || level === "middle" || level === "senior") return level;
  if (level === "intermediate") return "middle";
  if (level === "expert") return "senior";
  return "middle";
}

function nextHonorariumDocumentNumber() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `HON-${yyyy}${mm}${dd}-${nanoid(6).toUpperCase()}`;
}

function getEligibleRows(rows: HonorariumReportRow[]) {
  return rows.filter(
    (row) => row.sessionStatus === "completed" && row.availabilityStatus === "accepted",
  );
}

export type HonorariumBatchRow = {
  id: string;
  documentNumber: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  generatedBy: string | null;
  submittedAt: Date | null;
  approvedAt: Date | null;
  paidAt: Date | null;
  lockedAt: Date | null;
  createdAt: Date;
  itemCount: number;
  totalAmount: number;
};

export async function listHonorariumBatches(): Promise<HonorariumBatchRow[]> {
  await requirePermission("jadwalUjian", "view");

  const batchRows = await db
    .select({
      id: honorariumBatches.id,
      documentNumber: honorariumBatches.documentNumber,
      periodStart: honorariumBatches.periodStart,
      periodEnd: honorariumBatches.periodEnd,
      status: honorariumBatches.status,
      generatedBy: honorariumBatches.generatedBy,
      submittedAt: honorariumBatches.submittedAt,
      approvedAt: honorariumBatches.approvedAt,
      paidAt: honorariumBatches.paidAt,
      lockedAt: honorariumBatches.lockedAt,
      createdAt: honorariumBatches.createdAt,
    })
    .from(honorariumBatches)
    .orderBy(desc(honorariumBatches.createdAt))
    .limit(50);

  if (batchRows.length === 0) return [];

  const batchIds = batchRows.map((row) => row.id);
  const aggregateRows = await db
    .select({
      batchId: honorariumItems.batchId,
      itemCount: sql<number>`COUNT(*)::int`,
      totalAmount: sql<string>`COALESCE(SUM(${honorariumItems.amount}), 0)::text`,
    })
    .from(honorariumItems)
    .where(inArray(honorariumItems.batchId, batchIds))
    .groupBy(honorariumItems.batchId);

  const aggregateByBatch = new Map(
    aggregateRows.map((row) => [
      row.batchId,
      {
        itemCount: row.itemCount,
        totalAmount: toNumber(row.totalAmount),
      },
    ]),
  );

  return batchRows.map((row) => {
    const aggregate = aggregateByBatch.get(row.id);
    return {
      ...row,
      itemCount: aggregate?.itemCount ?? 0,
      totalAmount: aggregate?.totalAmount ?? 0,
    };
  });
}

export async function generateHonorariumBatch(data: z.infer<typeof generateBatchSchema>) {
  const session = await requirePermission("jadwalUjian", "manage");
  const parsed = generateBatchSchema.parse(data);

  if (parsed.startDate > parsed.endDate) {
    throw new Error("Tanggal mulai harus <= tanggal akhir.");
  }

  const report = await getHonorariumReport({
    startDate: parsed.startDate,
    endDate: parsed.endDate,
  });

  const eligibleRows = getEligibleRows(report.rows);
  if (eligibleRows.length === 0) {
    return {
      ok: false as const,
      message: "Tidak ada sesi layak bayar (completed + accepted) pada periode ini.",
    };
  }

  const missingRateRows = eligibleRows.filter((row) => row.rateSource === "missing");
  if (missingRateRows.length > 0) {
    return {
      ok: false as const,
      message:
        "Draft gagal dibuat karena ada sesi tanpa tarif. Lengkapi master tarif/override instruktur terlebih dahulu.",
    };
  }

  const batchId = nanoid();
  const documentNumber = nextHonorariumDocumentNumber();

  await db.insert(honorariumBatches).values({
    id: batchId,
    documentNumber,
    periodStart: parsed.startDate,
    periodEnd: parsed.endDate,
    status: "draft",
    generatedBy: session.user.id,
    internalNotes: parsed.internalNotes || null,
  });

  try {
    await db.insert(honorariumItems).values(
      eligibleRows.map((row) => ({
        id: nanoid(),
        batchId,
        assignmentId: row.assignmentId,
        sessionId: row.sessionId,
        kelasId: row.kelasId,
        programId: row.programId,
        scheduledDate: row.scheduledDate,
        paidInstructorId: row.paidInstructorId,
        paidInstructorName: row.paidInstructorName,
        source: row.source,
        materiBlock: row.materiBlock,
        expertiseLevelSnapshot: row.expertiseLevel,
        rateSnapshot: row.rateAmount.toFixed(2),
        amount: row.totalAmount.toFixed(2),
      })),
    );
  } catch (error) {
    await db.delete(honorariumBatches).where(eq(honorariumBatches.id, batchId));
    throw error;
  }

  await db.insert(honorariumAuditLogs).values({
    id: nanoid(),
    batchId,
    actorId: session.user.id,
    action: "generated_draft",
    payload: {
      periodStart: parsed.startDate,
      periodEnd: parsed.endDate,
      eligibleItemCount: eligibleRows.length,
      totalAmount: eligibleRows.reduce((sum, row) => sum + row.totalAmount, 0),
    },
  });

  revalidatePath("/jadwal-otomatis/honorarium");
  return {
    ok: true as const,
    batchId,
    documentNumber,
    itemCount: eligibleRows.length,
    totalAmount: eligibleRows.reduce((sum, row) => sum + row.totalAmount, 0),
  };
}
