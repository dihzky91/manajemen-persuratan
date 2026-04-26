"use server";

import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/server/db";
import {
  eventSignatories,
  events,
  participants,
  signatories,
} from "@/server/db/schema";

export type VerificationResult =
  | { found: false }
  | {
      found: true;
      data: {
        noSertifikat: string;
        nama: string;
        role: string;
        kegiatan: {
          id: number;
          namaKegiatan: string;
          kategori: string;
          tanggalMulai: string;
          tanggalSelesai: string;
          lokasi: string | null;
          skp: string | null;
          keterangan: string | null;
        };
        signatories: {
          id: number;
          nama: string;
          jabatan: string | null;
          urutan: number;
        }[];
      };
    };

export async function verifyByNoSertifikat(noSertifikat: string): Promise<VerificationResult> {
  const no = decodeURIComponent(noSertifikat).trim();
  if (!no) return { found: false };

  const [row] = await db
    .select({
      noSertifikat: participants.noSertifikat,
      nama: participants.nama,
      role: participants.role,
      statusPeserta: participants.statusPeserta,
      eventId: events.id,
      namaKegiatan: events.namaKegiatan,
      kategori: events.kategori,
      tanggalMulai: events.tanggalMulai,
      tanggalSelesai: events.tanggalSelesai,
      lokasi: events.lokasi,
      skp: events.skp,
      keterangan: events.keterangan,
    })
    .from(participants)
    .innerJoin(events, eq(participants.eventId, events.id))
    .where(
      and(
        eq(participants.noSertifikat, no),
        sql`${participants.deletedAt} IS NULL`,
        eq(participants.statusPeserta, "aktif"),
      ),
    )
    .limit(1);

  if (!row) return { found: false };

  const signatureRows = await db
    .select({
      id: signatories.id,
      nama: signatories.nama,
      jabatan: signatories.jabatan,
      urutan: eventSignatories.urutan,
    })
    .from(eventSignatories)
    .innerJoin(signatories, eq(eventSignatories.signatoryId, signatories.id))
    .where(eq(eventSignatories.eventId, row.eventId))
    .orderBy(asc(eventSignatories.urutan), asc(signatories.nama));

  return {
    found: true,
    data: {
      noSertifikat: row.noSertifikat,
      nama: row.nama,
      role: row.role,
      kegiatan: {
        id: row.eventId,
        namaKegiatan: row.namaKegiatan,
        kategori: row.kategori,
        tanggalMulai: row.tanggalMulai,
        tanggalSelesai: row.tanggalSelesai,
        lokasi: row.lokasi,
        skp: row.skp,
        keterangan: row.keterangan,
      },
      signatories: signatureRows,
    },
  };
}
