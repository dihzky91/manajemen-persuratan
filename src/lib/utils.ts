import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Bulan Romawi ────────────────────────────────────────────────────────────
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

// ─── Tanggal ─────────────────────────────────────────────────────────────────
// Tampilkan tanggal apa adanya dari DB (tidak ada normalisasi timezone)
export function formatTanggal(iso: string | Date | null | undefined): string {
  if (!iso) return "-";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function formatTanggalPendek(iso: string | Date | null | undefined): string {
  if (!iso) return "-";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}
