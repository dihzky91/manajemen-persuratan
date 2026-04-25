"use server";

import { db } from "@/server/db";
import { calendarEvents, type CalendarEvent, disposisi, suratKeluar } from "@/server/db/schema";
import { eq, and, gte, lte, desc, or } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { startOfMonth, endOfMonth } from "date-fns";

export interface CalendarEventInput {
  title: string;
  description?: string;
  eventType: typeof calendarEvents.$inferInsert.eventType;
  entitasType?: string;
  entitasId?: string;
  startDate: Date;
  endDate?: Date;
  allDay?: boolean;
  userId?: string;
  isPublic?: boolean;
}

export async function createCalendarEvent(input: CalendarEventInput): Promise<CalendarEvent> {
  const result = await db
    .insert(calendarEvents)
    .values({
      id: nanoid(),
      title: input.title,
      description: input.description ?? null,
      eventType: input.eventType,
      entitasType: input.entitasType ?? null,
      entitasId: input.entitasId ?? null,
      startDate: input.startDate,
      endDate: input.endDate ?? null,
      allDay: input.allDay ?? false,
      userId: input.userId ?? null,
      isPublic: input.isPublic ?? false,
    })
    .returning();

  if (!result[0]) {
    throw new Error("Failed to create calendar event");
  }

  revalidatePath("/kalender");
  return result[0];
}

export async function getCalendarEvents(options?: {
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  eventType?: string;
  includePublic?: boolean;
}): Promise<CalendarEvent[]> {
  const conditions: ReturnType<typeof eq>[] = [];

  if (options?.userId) {
    if (options.includePublic) {
      conditions.push(
        or(
          eq(calendarEvents.userId, options.userId),
          eq(calendarEvents.isPublic, true)
        ) as ReturnType<typeof eq>
      );
    } else {
      conditions.push(eq(calendarEvents.userId, options.userId));
    }
  }

  if (options?.startDate) {
    conditions.push(gte(calendarEvents.startDate, options.startDate));
  }

  if (options?.endDate) {
    conditions.push(lte(calendarEvents.startDate, options.endDate));
  }

  if (options?.eventType) {
    conditions.push(eq(calendarEvents.eventType, options.eventType as typeof calendarEvents.$inferInsert.eventType));
  }

  const results = await db
    .select()
    .from(calendarEvents)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(calendarEvents.startDate));

  return results;
}

export async function getCalendarEventsByMonth(
  year: number,
  month: number,
  userId?: string
): Promise<CalendarEvent[]> {
  const start = startOfMonth(new Date(year, month - 1));
  const end = endOfMonth(new Date(year, month - 1));

  return getCalendarEvents({
    userId,
    startDate: start,
    endDate: end,
    includePublic: true,
  });
}

export async function updateCalendarEvent(
  eventId: string,
  input: Partial<CalendarEventInput>,
  userId: string
): Promise<CalendarEvent> {
  const updateData: Partial<typeof calendarEvents.$inferInsert> = {};

  if (input.title !== undefined) updateData.title = input.title;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.eventType !== undefined) updateData.eventType = input.eventType;
  if (input.startDate !== undefined) updateData.startDate = input.startDate;
  if (input.endDate !== undefined) updateData.endDate = input.endDate;
  if (input.allDay !== undefined) updateData.allDay = input.allDay;
  if (input.isPublic !== undefined) updateData.isPublic = input.isPublic;

  updateData.updatedAt = new Date();

  const result = await db
    .update(calendarEvents)
    .set(updateData)
    .where(and(eq(calendarEvents.id, eventId), eq(calendarEvents.userId, userId)))
    .returning();

  if (!result[0]) {
    throw new Error("Failed to update calendar event");
  }

  revalidatePath("/kalender");
  return result[0];
}

export async function deleteCalendarEvent(eventId: string, userId: string): Promise<void> {
  await db
    .delete(calendarEvents)
    .where(and(eq(calendarEvents.id, eventId), eq(calendarEvents.userId, userId)));

  revalidatePath("/kalender");
}

// Sync disposisi deadline to calendar
export async function syncDisposisiDeadline(
  disposisiId: string,
  suratPerihal: string,
  batasWaktu: Date,
  userId: string
): Promise<void> {
  // Check if event already exists
  const existing = await db
    .select()
    .from(calendarEvents)
    .where(
      and(
        eq(calendarEvents.entitasType, "disposisi"),
        eq(calendarEvents.entitasId, disposisiId),
        eq(calendarEvents.eventType, "disposisi_deadline")
      )
    );

  const existingEvent = existing[0];
  if (existingEvent) {
    // Update existing event
    await db
      .update(calendarEvents)
      .set({
        startDate: batasWaktu,
        title: `Deadline: ${suratPerihal}`,
        updatedAt: new Date(),
      })
      .where(eq(calendarEvents.id, existingEvent.id));
  } else {
    // Create new event
    await createCalendarEvent({
      title: `Deadline: ${suratPerihal}`,
      description: `Batas waktu menyelesaikan disposisi untuk surat: ${suratPerihal}`,
      eventType: "disposisi_deadline",
      entitasType: "disposisi",
      entitasId: disposisiId,
      startDate: batasWaktu,
      allDay: true,
      userId,
      isPublic: false,
    });
  }
}

// Sync surat keluar workflow to calendar
export async function syncSuratKeluarEvent(
  suratId: string,
  perihal: string,
  status: string,
  userId: string
): Promise<void> {
  const eventTitle = `Surat Keluar: ${perihal}`;

  // Check if event already exists
  const existing = await db
    .select()
    .from(calendarEvents)
    .where(
      and(
        eq(calendarEvents.entitasType, "surat_keluar"),
        eq(calendarEvents.entitasId, suratId)
      )
    );

  const existingEvent = existing[0];
  if (existingEvent) {
    // Update existing event
    await db
      .update(calendarEvents)
      .set({
        title: eventTitle,
        description: `Status: ${status}`,
        updatedAt: new Date(),
      })
      .where(eq(calendarEvents.id, existingEvent.id));
  } else {
    // Create new event
    await createCalendarEvent({
      title: eventTitle,
      description: `Surat keluar dalam proses. Status: ${status}`,
      eventType: "surat_deadline",
      entitasType: "surat_keluar",
      entitasId: suratId,
      startDate: new Date(),
      allDay: true,
      userId,
      isPublic: false,
    });
  }
}

// Get upcoming deadlines
export async function getUpcomingDeadlines(
  userId: string,
  daysAhead: number = 7
): Promise<CalendarEvent[]> {
  const now = new Date();
  const future = new Date();
  future.setDate(now.getDate() + daysAhead);

  return db
    .select()
    .from(calendarEvents)
    .where(
      and(
        eq(calendarEvents.userId, userId),
        gte(calendarEvents.startDate, now),
        lte(calendarEvents.startDate, future),
        eq(calendarEvents.eventType, "disposisi_deadline")
      )
    )
    .orderBy(calendarEvents.startDate);
}
