import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const APP_TIME_ZONE = "Asia/Jakarta";

// Untuk format nomor surat: {counter}/{prefix}/{bulanRomawi}/{tahun}
const ROMAWI = [
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
] as const;

export function formatBulanRomawi(bulan: number): string {
  if (bulan < 1 || bulan > 12) {
    throw new Error(`Bulan harus 1-12, dapat: ${bulan}`);
  }
  return ROMAWI[bulan - 1]!;
}

function getJakartaDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Gagal membaca tanggal Asia/Jakarta.");
  }

  return { year, month, day };
}

export function getTodayIsoInJakarta(date = new Date()): string {
  const { year, month, day } = getJakartaDateParts(date);
  return `${year}-${month}-${day}`;
}

export function getCurrentMonthInJakarta(date = new Date()): number {
  return Number(getJakartaDateParts(date).month);
}

export function getCurrentYearInJakarta(date = new Date()): number {
  return Number(getJakartaDateParts(date).year);
}

// Tampilkan tanggal mengikuti Asia/Jakarta agar konsisten lintas server/client.
export function formatTanggal(iso: string | Date | null | undefined): string {
  if (!iso) return "-";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: APP_TIME_ZONE,
  }).format(d);
}

export function formatTanggalPendek(
  iso: string | Date | null | undefined,
): string {
  if (!iso) return "-";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: APP_TIME_ZONE,
  }).format(d);
}

export function formatTanggalLengkapJakarta(
  iso: string | Date | null | undefined,
): string {
  if (!iso) return "-";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: APP_TIME_ZONE,
  }).format(d);
}
