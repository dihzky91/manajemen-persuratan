"use server";

import { asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { readFile } from "node:fs/promises";
import path from "node:path";
import QRCode from "qrcode";
import JSZip from "jszip";
import { buildCertificatePdf } from "@/lib/pdf/certificate";
import { sendEmail } from "@/lib/email/mailjet";
import { db } from "@/server/db";
import {
  auditLog,
  certificateTemplates,
  eventSignatories,
  events,
  participants,
  signatories,
  type TemplateFieldMap,
} from "@/server/db/schema";
import { requireRole } from "../auth";

type TemplateKategori = typeof certificateTemplates.$inferSelect["kategori"];

type PdfResult = {
  fileName: string;
  pdfBase64: string;
  eventId: number;
  participantId: number;
  noSertifikat: string;
  namaPeserta: string;
  email: string | null;
  namaKegiatan: string;
  tanggalKegiatan: string;
};

function sanitizeFileName(value: string) {
  return value.replace(/[\\/:*?"<>|]/g, "-");
}

function formatTanggalIndonesia(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(`${value}T00:00:00+07:00`));
}

function buildVerificationUrl(noSertifikat: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "";
  return `${baseUrl}/verifikasi/${encodeURIComponent(noSertifikat)}`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function loadTemplateImage(imageUrl: string) {
  if (imageUrl.startsWith("/templates/")) {
    const bytes = await readFile(path.join(process.cwd(), "public", imageUrl));
    const mime = imageUrl.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
    return { bytes: new Uint8Array(bytes), mime: mime as "image/png" | "image/jpeg" };
  }

  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error("Gagal membaca gambar template.");
    const contentType = response.headers.get("content-type") ?? "";
    const mime = contentType.includes("png") ? "image/png" : "image/jpeg";
    return { bytes: new Uint8Array(await response.arrayBuffer()), mime: mime as "image/png" | "image/jpeg" };
  }

  throw new Error("Lokasi gambar template tidak valid.");
}

async function resolveTemplate(event: {
  certificateTemplateId: number | null;
  kategori: TemplateKategori;
}) {
  if (event.certificateTemplateId) {
    const [selected] = await db
      .select()
      .from(certificateTemplates)
      .where(eq(certificateTemplates.id, event.certificateTemplateId))
      .limit(1);
    if (selected?.isActive) return selected;
  }

  const [fallback] = await db
    .select()
    .from(certificateTemplates)
    .where(eq(certificateTemplates.kategori, event.kategori))
    .orderBy(asc(certificateTemplates.id))
    .limit(20);

  if (fallback?.isActive && fallback.isDefault) return fallback;

  const templates = await db
    .select()
    .from(certificateTemplates)
    .where(eq(certificateTemplates.kategori, event.kategori))
    .orderBy(asc(certificateTemplates.id));

  return templates.find((template) => template.isActive && template.isDefault) ?? null;
}

async function buildParticipantCertificate(participantId: number): Promise<PdfResult> {
  const [row] = await db
    .select({
      participantId: participants.id,
      eventId: participants.eventId,
      noSertifikat: participants.noSertifikat,
      namaPeserta: participants.nama,
      email: participants.email,
      namaKegiatan: events.namaKegiatan,
      kategori: events.kategori,
      tanggalMulai: events.tanggalMulai,
      tanggalSelesai: events.tanggalSelesai,
      lokasi: events.lokasi,
      skp: events.skp,
      certificateTemplateId: events.certificateTemplateId,
    })
    .from(participants)
    .innerJoin(events, eq(participants.eventId, events.id))
    .where(eq(participants.id, participantId))
    .limit(1);

  if (!row) throw new Error("Peserta tidak ditemukan.");

  const template = await resolveTemplate(row);
  if (!template) {
    throw new Error("Belum ada template untuk kategori ini. Silakan upload template di /sertifikat/template.");
  }

  const signatureRows = await db
    .select({
      nama: signatories.nama,
      jabatan: signatories.jabatan,
    })
    .from(eventSignatories)
    .innerJoin(signatories, eq(eventSignatories.signatoryId, signatories.id))
    .where(eq(eventSignatories.eventId, row.eventId))
    .orderBy(asc(eventSignatories.urutan));

  const image = await loadTemplateImage(template.imageUrl);
  const qrCodeDataUrl = await QRCode.toDataURL(buildVerificationUrl(row.noSertifikat), {
    width: 512,
    margin: 1,
  });
  const tanggalKegiatan =
    row.tanggalMulai === row.tanggalSelesai
      ? formatTanggalIndonesia(row.tanggalMulai)
      : `${formatTanggalIndonesia(row.tanggalMulai)} - ${formatTanggalIndonesia(row.tanggalSelesai)}`;

  const pdf = await buildCertificatePdf({
    templateImageBytes: image.bytes,
    imageMimeType: image.mime,
    imageWidthPx: template.imageWidth,
    imageHeightPx: template.imageHeight,
    fieldPositions: template.fieldPositions as TemplateFieldMap,
    data: {
      namaPeserta: row.namaPeserta,
      noSertifikat: row.noSertifikat,
      namaKegiatan: row.namaKegiatan,
      kategori: row.kategori,
      tanggalKegiatan,
      lokasi: row.lokasi,
      skp: row.skp,
      qrCodeDataUrl,
      signatures: signatureRows.map((signature) => ({
        nama: signature.nama,
        jabatan: signature.jabatan ?? "",
      })),
    },
  });

  return {
    fileName: `Sertifikat-${sanitizeFileName(row.noSertifikat)}.pdf`,
    pdfBase64: Buffer.from(pdf).toString("base64"),
    eventId: row.eventId,
    participantId: row.participantId,
    noSertifikat: row.noSertifikat,
    namaPeserta: row.namaPeserta,
    email: row.email,
    namaKegiatan: row.namaKegiatan,
    tanggalKegiatan,
  };
}

export async function generateCertificatePdf(participantId: number): Promise<
  { ok: true; data: { fileName: string; pdfBase64: string } } | { ok: false; error: string }
> {
  const session = await requireRole(["admin", "staff"]);

  try {
    const result = await buildParticipantCertificate(participantId);
    await db.insert(auditLog).values({
      userId: session.user.id,
      aksi: "GENERATE_CERTIFICATE_PDF",
      entitasType: "sertifikat_participant",
      entitasId: String(result.participantId),
      detail: { noSertifikat: result.noSertifikat },
    });
    return { ok: true, data: { fileName: result.fileName, pdfBase64: result.pdfBase64 } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Gagal membuat PDF." };
  }
}

export async function generateBulkCertificatesZip(eventId: number): Promise<
  { ok: true; data: { fileName: string; zipBase64: string } } | { ok: false; error: string }
> {
  const session = await requireRole(["admin", "staff"]);

  try {
    const rows = await db
      .select({ id: participants.id, namaKegiatan: events.namaKegiatan })
      .from(participants)
      .innerJoin(events, eq(participants.eventId, events.id))
      .where(eq(participants.eventId, eventId))
      .orderBy(asc(participants.id));

    const zip = new JSZip();
    for (const row of rows) {
      const certificate = await buildParticipantCertificate(row.id);
      zip.file(certificate.fileName, certificate.pdfBase64, { base64: true });
    }

    const zipBase64 = await zip.generateAsync({ type: "base64" });
    await db.insert(auditLog).values({
      userId: session.user.id,
      aksi: "GENERATE_BULK_CERTIFICATES",
      entitasType: "sertifikat_event",
      entitasId: String(eventId),
      detail: { total: rows.length },
    });

    return {
      ok: true,
      data: {
        fileName: `Sertifikat-${eventId}.zip`,
        zipBase64,
      },
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Gagal membuat ZIP." };
  }
}

export async function sendCertificateEmail(participantId: number): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await requireRole(["admin", "staff"]);

  try {
    const certificate = await buildParticipantCertificate(participantId);
    if (!certificate.email) return { ok: false, error: "Peserta belum punya email." };

    const verificationUrl = buildVerificationUrl(certificate.noSertifikat);
    const escapedName = escapeHtml(certificate.namaPeserta);
    const escapedEvent = escapeHtml(certificate.namaKegiatan);
    const escapedNo = escapeHtml(certificate.noSertifikat);

    await sendEmail({
      to: certificate.email,
      toName: certificate.namaPeserta,
      subject: `Sertifikat ${certificate.namaKegiatan}`,
      htmlBody: `
        <p>Yth. ${escapedName},</p>
        <p>Terlampir sertifikat untuk kegiatan <strong>${escapedEvent}</strong> yang diselenggarakan pada ${escapeHtml(certificate.tanggalKegiatan)}.</p>
        <p><strong>Nomor sertifikat:</strong> ${escapedNo}</p>
        <p>Verifikasi sertifikat dapat dilakukan melalui tautan berikut:<br/><a href="${verificationUrl}">${verificationUrl}</a></p>
        <p>Hormat kami,<br/>IAI Wilayah DKI Jakarta</p>
      `,
      textBody: [
        `Yth. ${certificate.namaPeserta},`,
        `Terlampir sertifikat untuk kegiatan ${certificate.namaKegiatan}.`,
        `Nomor sertifikat: ${certificate.noSertifikat}`,
        `Verifikasi: ${verificationUrl}`,
        `IAI Wilayah DKI Jakarta`,
      ].join("\n"),
      attachments: [
        {
          contentType: "application/pdf",
          filename: certificate.fileName,
          base64Content: certificate.pdfBase64,
        },
      ],
    });

    await db
      .update(participants)
      .set({ emailSentAt: new Date(), updatedAt: new Date() })
      .where(eq(participants.id, participantId));

    await db.insert(auditLog).values({
      userId: session.user.id,
      aksi: "SEND_CERTIFICATE_EMAIL",
      entitasType: "sertifikat_participant",
      entitasId: String(participantId),
      detail: { noSertifikat: certificate.noSertifikat, email: certificate.email },
    });

    revalidatePath(`/sertifikat/kegiatan/${certificate.eventId}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Gagal mengirim email." };
  }
}

export async function sendBulkCertificateEmails(eventId: number): Promise<
  { ok: true; data: { sent: number; skipped: number; failed: number } } | { ok: false; error: string }
> {
  const session = await requireRole(["admin", "staff"]);
  const rows = await db
    .select({ id: participants.id, email: participants.email })
    .from(participants)
    .where(eq(participants.eventId, eventId))
    .orderBy(asc(participants.id));

  let sent = 0;
  const skipped = rows.filter((row) => !row.email).length;
  let failed = 0;

  for (const row of rows.filter((item) => item.email)) {
    const result = await sendCertificateEmail(row.id);
    if (result.ok) sent += 1;
    else failed += 1;
  }

  await db.insert(auditLog).values({
    userId: session.user.id,
    aksi: "SEND_BULK_CERTIFICATE_EMAILS",
    entitasType: "sertifikat_event",
    entitasId: String(eventId),
    detail: { sent, skipped, failed },
  });

  revalidatePath(`/sertifikat/kegiatan/${eventId}`);
  return { ok: true, data: { sent, skipped, failed } };
}
