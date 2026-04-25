"use server";

import { db } from "@/server/db";
import { notifications, type Notification } from "@/server/db/schema";
import { eq, and, desc, count, gte, lte } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";

export interface NotificationInput {
  userId: string;
  type: typeof notifications.$inferInsert.type;
  title: string;
  message: string;
  entitasType?: string;
  entitasId?: string;
}

export async function createNotification(input: NotificationInput): Promise<Notification> {
  const result = await db
    .insert(notifications)
    .values({
      id: nanoid(),
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      entitasType: input.entitasType ?? null,
      entitasId: input.entitasId ?? null,
      isRead: false,
      isEmailSent: false,
    })
    .returning();

  if (!result[0]) {
    throw new Error("Failed to create notification");
  }

  revalidatePath("/dashboard");
  return result[0];
}

export async function getNotifications(userId: string, options?: {
  unreadOnly?: boolean;
  limit?: number;
}): Promise<Notification[]> {
  const conditions = [eq(notifications.userId, userId)];

  if (options?.unreadOnly) {
    conditions.push(eq(notifications.isRead, false));
  }

  const results = await db
    .select()
    .from(notifications)
    .where(conditions.length > 1 ? and(...conditions) : conditions[0])
    .orderBy(desc(notifications.createdAt))
    .limit(options?.limit ?? 50);

  return results;
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const result = await db
    .select({ count: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

  return result[0]?.count || 0;
}

export async function markNotificationAsRead(
  notificationId: string,
  userId: string
): Promise<void> {
  await db
    .update(notifications)
    .set({
      isRead: true,
      readAt: new Date(),
    })
    .where(
      and(eq(notifications.id, notificationId), eq(notifications.userId, userId))
    );

  revalidatePath("/dashboard");
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  await db
    .update(notifications)
    .set({
      isRead: true,
      readAt: new Date(),
    })
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

  revalidatePath("/dashboard");
}

export async function deleteNotification(
  notificationId: string,
  userId: string
): Promise<void> {
  await db
    .delete(notifications)
    .where(
      and(eq(notifications.id, notificationId), eq(notifications.userId, userId))
    );

  revalidatePath("/dashboard");
}

// Helper function to create notification for disposisi
export async function notifyDisposisiBaru(
  kepadaUserId: string,
  dariNama: string,
  suratPerihal: string,
  disposisiId: string
): Promise<void> {
  await createNotification({
    userId: kepadaUserId,
    type: "disposisi_baru",
    title: "Disposisi Baru",
    message: `Anda menerima disposisi dari ${dariNama} untuk surat: ${suratPerihal}`,
    entitasType: "disposisi",
    entitasId: disposisiId,
  });
}

// Helper function to notify deadline approaching
export async function notifyDisposisiDeadline(
  userId: string,
  suratPerihal: string,
  batasWaktu: Date,
  disposisiId: string
): Promise<void> {
  const daysLeft = Math.ceil(
    (batasWaktu.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  await createNotification({
    userId,
    type: "disposisi_deadline",
    title: "Deadline Disposisi Mendekati",
    message: `Disposisi untuk "${suratPerihal}" akan berakhir dalam ${daysLeft} hari`,
    entitasType: "disposisi",
    entitasId: disposisiId,
  });
}

// Helper function to notify surat keluar approval needed
export async function notifySuratKeluarApproval(
  pejabatId: string,
  pengirimNama: string,
  perihal: string,
  suratId: string
): Promise<void> {
  await createNotification({
    userId: pejabatId,
    type: "surat_keluar_approval",
    title: "Persetujuan Surat Keluar",
    message: `${pengirimNama} meminta persetujuan untuk surat: ${perihal}`,
    entitasType: "surat_keluar",
    entitasId: suratId,
  });
}

// Helper function to notify surat keluar revisi
export async function notifySuratKeluarRevisi(
  creatorId: string,
  pejabatNama: string,
  perihal: string,
  catatan: string,
  suratId: string
): Promise<void> {
  await createNotification({
    userId: creatorId,
    type: "surat_keluar_revisi",
    title: "Revisi Surat Keluar Diperlukan",
    message: `${pejabatNama} meminta revisi untuk "${perihal}". Catatan: ${catatan}`,
    entitasType: "surat_keluar",
    entitasId: suratId,
  });
}

// Helper function to notify surat keluar selesai
export async function notifySuratKeluarSelesai(
  creatorId: string,
  perihal: string,
  nomorSurat: string | null,
  suratId: string
): Promise<void> {
  await createNotification({
    userId: creatorId,
    type: "surat_keluar_selesai",
    title: "Surat Keluar Selesai",
    message: `Surat "${perihal}" telah selesai${nomorSurat ? ` dengan nomor ${nomorSurat}` : ""}`,
    entitasType: "surat_keluar",
    entitasId: suratId,
  });
}
