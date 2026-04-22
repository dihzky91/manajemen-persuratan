# SYSTEM.md — Sistem Manajemen Surat & Kepegawaian IAI Wilayah DKI Jakarta

> Dokumen ini adalah **panduan arsitektur lengkap** untuk membangun sistem manajemen persuratan dan kepegawaian internal IAI Wilayah DKI Jakarta. Dirancang agar bisa dibaca dan langsung dieksekusi oleh agent manapun (Cursor, Windsurf, Claude Code, dsb.) tanpa konteks tambahan dari developer.

---

## 1. Ringkasan Proyek

| Atribut | Detail |
|---|---|
| **Nama Sistem** | *(belum diputuskan — gunakan env `NEXT_PUBLIC_APP_NAME` sebagai placeholder)* |
| **Organisasi** | Ikatan Akuntan Indonesia (IAI) Wilayah DKI Jakarta |
| **Domain / URL** | *(belum diputuskan — gunakan env `NEXT_PUBLIC_APP_URL` sebagai placeholder bila mulai dibutuhkan di UI/client)* |
| **Tujuan** | Digitalisasi pengelolaan surat masuk, surat keluar, disposisi, dan data kepegawaian internal |
| **Pengguna** | Admin, Pejabat Penandatangan, Staff Divisi (semua internal IAI Jakarta) |
| **Bahasa UI** | Bahasa Indonesia Formal (baku) |
| **Akses** | **Internal only** — semua route di-protect autentikasi, tidak ada halaman publik |

---

## 2. Tech Stack

### 2.1 Core Stack

| Layer | Teknologi | Alasan Pemilihan |
|---|---|---|
| **Framework** | [Next.js App Router](https://nextjs.org/docs/app) | Full-stack React, nested layout, Server/Client Components, SSR/streaming |
| **Routing** | Next.js file-based routing | Selaras dengan struktur repo `src/app`, route groups, layout bertingkat |
| **Server State** | Server Components + revalidation path-based | Sederhana untuk internal app, cocok dengan bentuk data CRUD saat ini |
| **Table** | [TanStack Table](https://tanstack.com/table) | Headless table untuk arsip surat — sorting, filter, pagination |
| **Form** | [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev) | Validasi type-safe, sudah terpasang di codebase saat ini |
| **ORM** | [Drizzle ORM](https://orm.drizzle.team) | Lightweight, type-safe, cocok dengan pola Server Actions di Next.js |
| **Database** | [PostgreSQL](https://postgresql.org) via [Neon](https://neon.tech) | Serverless-friendly, free tier tersedia |
| **Auth** | [Better Auth](https://better-auth.com) | Session auth modern, terintegrasi dengan route handler dan guard helper |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com) | Utility-first, iteration cepat |
| **UI Components** | [shadcn/ui](https://ui.shadcn.com) | Composable, accessible, mudah dikustomisasi |
| **File Storage** | [Cloudinary](https://cloudinary.com) | Upload scan surat PDF/gambar, transformasi otomatis |
| **PDF Generator** | [@react-pdf/renderer](https://react-pdf.org) | Generate dokumen surat + embed QR code |
| **QR Code** | [qrcode](https://www.npmjs.com/package/qrcode) | Generate QR verifikasi surat & QR Contact pegawai |
| **Email Notifikasi** | [Mailjet](https://mailjet.com) | Notifikasi disposisi (familiar di tim) |
| **Deployment** | [Vercel](https://vercel.com) | CI/CD otomatis dari GitHub |
| **Repo** | GitHub | Version control |

### 2.2 Dev Tooling

```
- TypeScript (strict mode)
- ESLint + Prettier
- Drizzle Kit (generate / push / migrate schema)
- Zod (schema validation di form & server action)
- next lint + tsc --noEmit sebagai baseline verification
```

---

## 3. Struktur Folder Proyek

```
[nama-repo]/
├── src/
│   ├── app/
│   │   ├── layout.tsx                      # Root layout + global styles + toaster
│   │   ├── page.tsx                        # Entry page (jika dipakai)
│   │   ├── api/
│   │   │   └── auth/[...all]/route.ts      # Better Auth route handler
│   │   ├── (auth)/
│   │   │   └── login/page.tsx              # Halaman login
│   │   └── (dashboard)/
│   │       ├── layout.tsx                  # Auth guard server-side + shell dashboard
│   │       ├── dashboard/page.tsx
│   │       ├── divisi/page.tsx
│   │       ├── pegawai/page.tsx
│   │       ├── surat-masuk/page.tsx
│   │       ├── surat-keluar/page.tsx
│   │       ├── disposisi/page.tsx
│   │       ├── nomor-surat/page.tsx
│   │       ├── surat-keputusan/page.tsx
│   │       ├── surat-mou/page.tsx
│   │       └── pejabat/page.tsx
│   ├── components/
│   │   ├── ui/                             # shadcn/ui primitives
│   │   ├── layout/                         # Sidebar, Header, PageWrapper
│   │   └── divisi/                         # Manager/Form modul divisi
│   ├── server/
│   │   ├── actions/                        # Server Actions per domain
│   │   ├── auth.ts                         # Better Auth config
│   │   └── db/                             # Drizzle schema + koneksi DB
│   ├── lib/
│   │   ├── validators/
│   │   ├── pdf/
│   │   ├── qr/
│   │   ├── email/
│   │   ├── env.ts
│   │   └── utils.ts
│   ├── styles/
│   │   └── globals.css
│   └── proxy.ts                            # Route protection berbasis cookie
├── scripts/
│   ├── apply-schema.ts
│   └── seed-admin.ts
├── drizzle/
│   └── migrations/
├── public/
├── .env.local                              # Lihat Bagian 8
├── drizzle.config.ts
├── next.config.ts
├── tsconfig.json
└── package.json
```

---

## 4. Database Schema (Drizzle ORM)

### 4.1 ERD Overview

```
divisi ◄──────────────────── users (pegawai)
                                   │
              ┌────────────────────┼──────────────────────┐
              │                    │                       │
         surat_masuk         surat_keluar           pegawai_biodata
              │                    │                pegawai_keluarga
         disposisi           nomor_surat_counter    pegawai_pendidikan
         (chain/tree)        pejabat_penandatangan  pegawai_riwayat_pekerjaan
                                                    pegawai_kesehatan
                                                    pegawai_pernyataan_integritas

surat_keputusan ──► pejabat_penandatangan
surat_mou       ──► pejabat_penandatangan
audit_log       ──► users
```

### 4.2 Drizzle Schema Lengkap

```typescript
// app/server/db/schema.ts

import {
  pgTable, text, timestamp, boolean, date,
  integer, serial, pgEnum, varchar, uuid, jsonb
} from "drizzle-orm/pg-core";

// ─── ENUMS ───────────────────────────────────────────────────────────────────

export const roleEnum = pgEnum("role", ["admin", "staff", "pejabat", "viewer"]);

// Status workflow surat keluar (stepper 5 tahap)
export const statusSuratKeluarEnum = pgEnum("status_surat_keluar", [
  "draft",                    // Step 1: Upload Draft Surat
  "permohonan_persetujuan",   // Step 2: Permohonan Persetujuan
  "reviu",                    // Step 3: Proses Reviu
  "pengarsipan",              // Step 4: Pengarsipan (generate nomor + QR + upload final)
  "selesai",                  // Step 5: Selesai
  "dibatalkan",
]);

export const statusSuratMasukEnum = pgEnum("status_surat_masuk", [
  "diterima", "diproses", "diarsip", "dibatalkan"
]);

export const statusDisposisiEnum = pgEnum("status_disposisi", [
  "belum_dibaca", "dibaca", "diproses", "selesai"
]);

export const jenisSuratEnum = pgEnum("jenis_surat", [
  "undangan", "pemberitahuan", "permohonan", "keputusan",
  "mou", "balasan", "edaran", "keterangan", "tugas", "lainnya"
]);

export const statusPernikahanEnum = pgEnum("status_pernikahan", [
  "BM",  // Belum Menikah
  "M",   // Menikah
  "C",   // Cerai
  "D",   // Duda
  "J",   // Janda
]);

export const genderEnum = pgEnum("gender", ["Laki-laki", "Perempuan"]);
export const jenisPegawaiEnum = pgEnum("jenis_pegawai", [
  "Tetap", "Kontrak", "Magang", "Paruh Waktu"
]);

// ─── DIVISI ──────────────────────────────────────────────────────────────────

export const divisi = pgTable("divisi", {
  id: serial("id").primaryKey(),
  nama: varchar("nama", { length: 150 }).notNull(),
  kode: varchar("kode", { length: 20 }).unique(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── USERS (akun login + data dasar pegawai) ─────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  namaLengkap: varchar("nama_lengkap", { length: 200 }).notNull(),
  email: varchar("email", { length: 150 }).unique().notNull(),     // email kantor (login)
  emailPribadi: varchar("email_pribadi", { length: 150 }),
  noHp: varchar("no_hp", { length: 20 }),
  role: roleEnum("role").default("staff"),
  divisiId: integer("divisi_id").references(() => divisi.id),
  jabatan: varchar("jabatan", { length: 150 }),
  levelJabatan: varchar("level_jabatan", { length: 50 }),          // Staff / Manager / dll
  jenisPegawai: jenisPegawaiEnum("jenis_pegawai").default("Tetap"),
  tanggalMasuk: date("tanggal_masuk"),
  avatarUrl: text("avatar_url"),
  qrContactUrl: text("qr_contact_url"),  // URL QR vCard yang sudah digenerate
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── PEGAWAI DETAIL — Tab 1: Biodata ────────────────────────────────────────

export const pegawaiBiodata = pgTable("pegawai_biodata", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull().unique(),
  noKtp: varchar("no_ktp", { length: 20 }),
  gender: genderEnum("gender"),
  statusPernikahan: statusPernikahanEnum("status_pernikahan"),
  tempatLahir: varchar("tempat_lahir", { length: 100 }),
  tanggalLahir: date("tanggal_lahir"),
  alamatTinggal: text("alamat_tinggal"),
  kodePos: varchar("kode_pos", { length: 10 }),
  provinsi: varchar("provinsi", { length: 100 }),
  kotaKabupaten: varchar("kota_kabupaten", { length: 100 }),
  alamatKtp: text("alamat_ktp"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── PEGAWAI DETAIL — Tab 2: Kelengkapan Karyawan ───────────────────────────

export const pegawaiKelengkapan = pgTable("pegawai_kelengkapan", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull().unique(),
  fotoUrl: text("foto_url"),
  ktpUrl: text("ktp_url"),
  npwpUrl: text("npwp_url"),
  bpjsUrl: text("bpjs_url"),
  ijazahUrl: text("ijazah_url"),
  dokumenLainUrl: text("dokumen_lain_url"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── PEGAWAI DETAIL — Tab 3: Data Keluarga ──────────────────────────────────

export const pegawaiKeluarga = pgTable("pegawai_keluarga", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  hubungan: varchar("hubungan", { length: 50 }),  // Suami/Istri/Anak/Orang Tua
  namaAnggota: varchar("nama_anggota", { length: 200 }).notNull(),
  tempatLahir: varchar("tempat_lahir", { length: 100 }),
  tanggalLahir: date("tanggal_lahir"),
  pekerjaan: varchar("pekerjaan", { length: 150 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── PEGAWAI DETAIL — Tab 4: Riwayat Pendidikan ─────────────────────────────

export const pegawaiPendidikan = pgTable("pegawai_pendidikan", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  jenjang: varchar("jenjang", { length: 20 }),    // SD/SMP/SMA/D3/S1/S2/S3
  namaInstitusi: varchar("nama_institusi", { length: 200 }),
  jurusan: varchar("jurusan", { length: 150 }),
  tahunMasuk: integer("tahun_masuk"),
  tahunLulus: integer("tahun_lulus"),
  ijazahUrl: text("ijazah_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── PEGAWAI DETAIL — Tab 5: Riwayat Pekerjaan ──────────────────────────────

export const pegawaiRiwayatPekerjaan = pgTable("pegawai_riwayat_pekerjaan", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  namaPerusahaan: varchar("nama_perusahaan", { length: 200 }),
  jabatan: varchar("jabatan", { length: 150 }),
  tanggalMulai: date("tanggal_mulai"),
  tanggalSelesai: date("tanggal_selesai"),         // null = masih aktif
  keterangan: text("keterangan"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── PEGAWAI DETAIL — Tab 6: Riwayat Kesehatan ──────────────────────────────

export const pegawaiKesehatan = pgTable("pegawai_kesehatan", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull().unique(),
  golonganDarah: varchar("golongan_darah", { length: 5 }),
  tinggiBadan: integer("tinggi_badan"),
  beratBadan: integer("berat_badan"),
  riwayatPenyakit: text("riwayat_penyakit"),
  alergi: text("alergi"),
  catatanKesehatan: text("catatan_kesehatan"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── PEGAWAI DETAIL — Tab 7: Pernyataan Integritas ──────────────────────────

export const pegawaiPernyataanIntegritas = pgTable("pegawai_pernyataan_integritas", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull().unique(),
  tanggalPernyataan: date("tanggal_pernyataan"),
  fileUrl: text("file_url"),
  statusTandaTangan: boolean("status_tanda_tangan").default(false),
  catatan: text("catatan"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── PEJABAT PENANDATANGAN ───────────────────────────────────────────────────

export const pejabatPenandatangan = pgTable("pejabat_penandatangan", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  namaJabatan: varchar("nama_jabatan", { length: 200 }).notNull(),
  // Contoh dari data existing: "Direktur Eksekutif IAI Wilayah DKI Jakarta"
  wilayah: varchar("wilayah", { length: 100 }),
  ttdUrl: text("ttd_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── NOMOR SURAT COUNTER ─────────────────────────────────────────────────────

export const nomorSuratCounter = pgTable("nomor_surat_counter", {
  id: serial("id").primaryKey(),
  tahun: integer("tahun").notNull(),
  bulan: integer("bulan").notNull(),
  jenisSurat: jenisSuratEnum("jenis_surat").notNull(),
  counter: integer("counter").default(0).notNull(),
  prefix: varchar("prefix", { length: 80 }),
  // Contoh prefix dari data existing: "IAI-DKIJKT", "DE/IAI-DKIJKT", "PPL/IAI-DKIJKT"
  updatedAt: timestamp("updated_at").defaultNow(),
  // UNIQUE constraint: (tahun, bulan, jenis_surat) — di migration
});

// Format final: {counter}/{prefix}/{bulan_romawi}/{tahun}
// Contoh actual: 19.1-7/DE/IAI-DKIJKT/IV/2026  |  17/PPL/IAI-DKIJKT/IV/26

// ─── SURAT KELUAR ────────────────────────────────────────────────────────────

export const suratKeluar = pgTable("surat_keluar", {
  id: uuid("id").defaultRandom().primaryKey(),

  // nomorSurat: NULL saat pertama dibuat, terisi setelah step "Generate No."
  nomorSurat: varchar("nomor_surat", { length: 200 }).unique(),

  perihal: text("perihal").notNull(),
  tujuan: varchar("tujuan", { length: 300 }).notNull(),
  tujuanAlamat: text("tujuan_alamat"),

  // ⚠️ BACKDATE: tanggalSurat adalah input MANUAL BEBAS — tidak ada validasi range
  // Bisa masa lalu (backdate), hari ini, atau masa depan
  tanggalSurat: date("tanggal_surat").notNull(),

  jenisSurat: jenisSuratEnum("jenis_surat").notNull(),
  isiSingkat: text("isi_singkat"),

  // Stepper workflow status
  status: statusSuratKeluarEnum("status").default("draft"),

  // Files
  fileDraftUrl: text("file_draft_url"),     // Upload awal (draft)
  fileFinalUrl: text("file_final_url"),     // Upload final (setelah diberi nomor + QR)
  lampiranUrl: text("lampiran_url"),

  // QR Code verifikasi surat
  qrCodeUrl: text("qr_code_url"),

  // Relasi
  pejabatId: integer("pejabat_id").references(() => pejabatPenandatangan.id),
  dibuatOleh: uuid("dibuat_oleh").references(() => users.id),
  divisiId: integer("divisi_id").references(() => divisi.id),

  // Approval
  disetujuiOleh: uuid("disetujui_oleh").references(() => users.id),
  tanggalDisetujui: timestamp("tanggal_disetujui"),
  catatanReviu: text("catatan_reviu"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── SURAT MASUK ─────────────────────────────────────────────────────────────

export const suratMasuk = pgTable("surat_masuk", {
  id: uuid("id").defaultRandom().primaryKey(),
  nomorAgenda: varchar("nomor_agenda", { length: 50 }),
  nomorSuratAsal: varchar("nomor_surat_asal", { length: 200 }),
  perihal: text("perihal").notNull(),
  pengirim: varchar("pengirim", { length: 200 }).notNull(),
  pengirimAlamat: text("pengirim_alamat"),

  // ⚠️ BACKDATE: keduanya input manual, tidak ada validasi range tanggal
  tanggalSurat: date("tanggal_surat").notNull(),
  tanggalDiterima: date("tanggal_diterima").notNull(),

  jenisSurat: jenisSuratEnum("jenis_surat").notNull(),
  status: statusSuratMasukEnum("status").default("diterima"),
  isiSingkat: text("isi_singkat"),
  fileUrl: text("file_url"),
  dicatatOleh: uuid("dicatat_oleh").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── DISPOSISI ───────────────────────────────────────────────────────────────

export const disposisi = pgTable("disposisi", {
  id: uuid("id").defaultRandom().primaryKey(),
  suratMasukId: uuid("surat_masuk_id").references(() => suratMasuk.id).notNull(),
  dariUserId: uuid("dari_user_id").references(() => users.id).notNull(),
  kepadaUserId: uuid("kepada_user_id").references(() => users.id).notNull(),
  catatan: text("catatan"),
  instruksi: text("instruksi"),
  batasWaktu: date("batas_waktu"),
  status: statusDisposisiEnum("status").default("belum_dibaca"),
  tanggalDisposisi: timestamp("tanggal_disposisi").defaultNow(),
  tanggalDibaca: timestamp("tanggal_dibaca"),
  tanggalSelesai: timestamp("tanggal_selesai"),
  parentDisposisiId: uuid("parent_disposisi_id"),
  // Self-reference untuk chain disposisi. Tidak pakai .references() agar tidak circular.
});

// ─── SURAT KEPUTUSAN ─────────────────────────────────────────────────────────

export const suratKeputusan = pgTable("surat_keputusan", {
  id: uuid("id").defaultRandom().primaryKey(),
  nomorSK: varchar("nomor_sk", { length: 200 }).unique().notNull(),
  perihal: text("perihal").notNull(),
  tentang: text("tentang").notNull(),
  tanggalSK: date("tanggal_sk").notNull(),         // ⚠️ BACKDATE: input manual bebas
  tanggalBerlaku: date("tanggal_berlaku"),
  tanggalBerakhir: date("tanggal_berakhir"),
  pejabatId: integer("pejabat_id").references(() => pejabatPenandatangan.id),
  fileUrl: text("file_url"),
  qrCodeUrl: text("qr_code_url"),
  dibuatOleh: uuid("dibuat_oleh").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── SURAT MOU ───────────────────────────────────────────────────────────────

export const suratMou = pgTable("surat_mou", {
  id: uuid("id").defaultRandom().primaryKey(),
  nomorMOU: varchar("nomor_mou", { length: 200 }).unique().notNull(),
  perihal: text("perihal").notNull(),
  pihakKedua: varchar("pihak_kedua", { length: 200 }).notNull(),
  pihakKeduaAlamat: text("pihak_kedua_alamat"),
  tanggalMOU: date("tanggal_mou").notNull(),        // ⚠️ BACKDATE: input manual bebas
  tanggalBerlaku: date("tanggal_berlaku"),
  tanggalBerakhir: date("tanggal_berakhir"),
  nilaiKerjasama: text("nilai_kerjasama"),
  fileUrl: text("file_url"),
  qrCodeUrl: text("qr_code_url"),
  pejabatId: integer("pejabat_id").references(() => pejabatPenandatangan.id),
  dibuatOleh: uuid("dibuat_oleh").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── AUDIT LOG ───────────────────────────────────────────────────────────────

export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  aksi: varchar("aksi", { length: 100 }),
  // Contoh: "CREATE_SURAT_KELUAR", "UPDATE_STATUS_SURAT", "GENERATE_NOMOR"
  entitasType: varchar("entitas_type", { length: 50 }),
  entitasId: varchar("entitas_id", { length: 100 }),
  detail: jsonb("detail"),                          // { before: {...}, after: {...} }
  ipAddress: varchar("ip_address", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
});
```

---

## 5. Arsitektur Aplikasi

### 5.1 Diagram Alur

```
Browser
    │
    ├── Request halaman ──► Next.js App Router
    │                       ├── Root Layout (`src/app/layout.tsx`)
    │                       ├── Route Group `(auth)` untuk login
    │                       └── Route Group `(dashboard)` untuk area internal
    │
    ├── Route protection ringan ──► `src/proxy.ts`
    │                               └── cek cookie session lalu redirect ke `/login?redirect=...`
    │
    ├── Server Component ──► baca data awal / validasi session
    └── Client Component ──► interaksi tabel, dialog, form submit

Server Actions / Route Handler
    │
    ├── 1. Zod validation (input)
    ├── 2. Better Auth session + role check
    ├── 3. Drizzle ORM → Neon PostgreSQL
    ├── 4. `revalidatePath()` untuk sinkronisasi UI setelah mutasi
    └── 5. Side effects:
            ├── Mailjet    → notifikasi disposisi via email
            ├── Cloudinary → upload/retrieve file PDF/gambar
            ├── qrcode     → generate QR surat & QR contact pegawai
            └── auditLog   → catat semua aksi penting
```

### 5.2 Workflow Surat Keluar — Stepper 5 Tahap

```
┌──────────────┬──────────────────────────┬────────────────┬──────────────┬─────────┐
│   Step 1     │         Step 2           │    Step 3      │   Step 4     │ Step 5  │
│ Upload Draft │ Permohonan Persetujuan   │ Proses Reviu   │ Pengarsipan  │ Selesai │
└──────────────┴──────────────────────────┴────────────────┴──────────────┴─────────┘

Detail per step:

Step 1 — Upload Draft Surat (status: "draft")
  - Isi form: tujuan, perihal, jenis surat, tanggal surat (bebas/backdate), divisi pengirim
  - Upload file draft PDF → Cloudinary (fileDraftUrl)
  - nomorSurat masih NULL → badge "Generate No. Surat Keluar" muncul di list

Step 2 — Permohonan Persetujuan (status: "permohonan_persetujuan")
  - Klik tombol "Ajukan Persetujuan"
  - Sistem kirim email notifikasi ke Pejabat via Mailjet

Step 3 — Proses Reviu (status: "reviu")
  - Pejabat review surat
  - Jika minta revisi → status kembali ke "draft", catatanReviu terisi
  - Jika disetujui → status "reviu", disetujuiOleh + tanggalDisetujui terisi

Step 4 — Pengarsipan (status: "pengarsipan")
  a. Generate Nomor Surat
     - Klik "Generate No. Surat Keluar"
     - generateNomorSurat() → atomic counter (DB transaction)
     - nomorSurat terisi, ditampilkan sebagai badge bernomor di list
  b. Generate QR Code
     - QR berisi data verifikasi surat (URL atau data ringkas surat)
     - Disimpan ke qrCodeUrl, bisa di-copy sebagai gambar
  c. Upload Dokumen Final
     - User download draft, tambahkan nomor + QR secara manual ke PDF
     - Re-upload PDF final → disimpan ke fileFinalUrl

Step 5 — Selesai (status: "selesai")
  - Konfirmasi pengarsipan selesai
  - Muncul badge "Selesai" hijau di list surat keluar
```

### 5.3 Aturan Backdate — WAJIB DIBACA

```
⚠️ PERHATIAN UNTUK SEMUA AGENT/DEVELOPER:

Semua field tanggal surat berikut adalah INPUT MANUAL BEBAS:
  - suratKeluar.tanggalSurat
  - suratMasuk.tanggalSurat
  - suratMasuk.tanggalDiterima
  - suratKeputusan.tanggalSK
  - suratMou.tanggalMOU

✅ DIIZINKAN: Tanggal masa lalu (backdate)
✅ DIIZINKAN: Tanggal hari ini
✅ DIIZINKAN: Tanggal masa depan (untuk keperluan antedating)

❌ DILARANG menambahkan validasi berikut:
  - "Tanggal tidak boleh sebelum hari ini"
  - "Tanggal surat harus >= tanggal input sistem"
  - "Tanggal tidak boleh lebih dari N hari yang lalu"

Satu-satunya validasi tanggal yang boleh: required (wajib diisi).

ALASAN: Praktik persuratan organisasi sering memerlukan backdate
untuk kebutuhan administrasi yang sah — misalnya surat menyusul,
koreksi arsip, atau dokumen yang dibuat setelah kejadian.
```

### 5.4 Logika Nomor Surat Otomatis

```
Format dari data nyata sistem existing:
  No: 19.1-7/DE/IAI-DKIJKT/IV/2026
  17/PPL/IAI-DKIJKT/IV/26
  Nomor : 18/DE/IAI-DKIJKT/IV/2026
  13/IAI-DKIJKT/IV/2026

Bulan Romawi: I II III IV V VI VII VIII IX X XI XII

Prefix dikonfigurasi per jenis surat (tabel nomor_surat_counter.prefix)
  Contoh: "DE/IAI-DKIJKT", "PPL/IAI-DKIJKT", "IAI-DKIJKT"

Server Action: generateNomorSurat({ jenisSurat, bulan, tahun })
  1. BEGIN TRANSACTION
  2. SELECT ... FOR UPDATE WHERE tahun=? AND bulan=? AND jenis_surat=?
  3. Jika tidak ada → INSERT counter=1
  4. Jika ada       → UPDATE SET counter = counter + 1
  5. COMMIT
  6. Ambil prefix dari config
  7. Return: "{counter}/{prefix}/{bulanRomawi}/{tahun}"

⚠️ WAJIB pakai DB transaction untuk menghindari race condition
   jika dua user generate nomor di waktu bersamaan.

State di tabel surat_keluar:
  nomorSurat = NULL  → tampil tombol "Generate No. Surat Keluar"
  nomorSurat = "..." → tampil sebagai badge/teks nomor
```

---

## 6. Autentikasi & Otorisasi (Better Auth + RBAC)

### 6.1 Role Matrix

| Fitur | admin | pejabat | staff | viewer |
|---|---|---|---|---|
| Buat Surat Keluar | ✅ | ✅ | ✅ | ❌ |
| Lihat Arsip Surat Keluar | ✅ | ✅ | ✅ | ✅ |
| Approve / Reviu Surat Keluar | ✅ | ✅ | ❌ | ❌ |
| Generate Nomor Surat | ✅ | ✅ | ❌ | ❌ |
| Input Surat Masuk | ✅ | ❌ | ✅ | ❌ |
| Disposisi Surat | ✅ | ✅ | ❌ | ❌ |
| Terima / Proses Disposisi | ✅ | ✅ | ✅ | ❌ |
| Buat SK / MOU | ✅ | ✅ | ❌ | ❌ |
| Kelola Data Pegawai | ✅ | ❌ | ❌ | ❌ |
| Kelola Divisi | ✅ | ❌ | ❌ | ❌ |
| Bulk Nomor Surat | ✅ | ❌ | ❌ | ❌ |
| Lihat Audit Log | ✅ | ❌ | ❌ | ❌ |

### 6.2 Pattern Server Action dengan Auth Check

```typescript
"use server";

import { suratKeluarCreateSchema } from "@/lib/validators/suratKeluar.schema";
import { requireRole } from "@/server/actions/auth";

export async function createSuratKeluar(input: unknown) {
  // 1. Validasi input
  const data = suratKeluarCreateSchema.parse(input);

  // 2. Auth + role check
  const session = await requireRole(["admin", "pejabat", "staff"]);

  // 3. DB operation
  const [newSurat] = await db
    .insert(suratKeluar)
    .values({
      ...data,
      dibuatOleh: session.user.id,
    })
    .returning();

  // 4. Audit log
  await db.insert(auditLog).values({
    userId: session.user.id,
    aksi: "CREATE_SURAT_KELUAR",
    entitasType: "surat_keluar",
    entitasId: newSurat.id,
    detail: { perihal: data.perihal, tujuan: data.tujuan },
  });

  return newSurat;
}
```

---

## 7. Komponen Kunci

### 7.1 SuratTable (TanStack Table)

```
Kolom untuk Surat Keluar (sesuai tampilan sistem existing):
  No | Nama Akun | No. Surat (badge/tombol Generate) | Tanggal Surat |
  Pengirim (divisi) | Tujuan + Perihal | File Surat (Download) |
  Tanda Terima (icon email/kirim) | Status Pengarsipan (badge warna) | Aksi (edit)

Status badge warna:
  "selesai"   → hijau
  "disetujui" / "reviu" → hijau muda / biru
  "reviu"     → kuning/orange
  "draft"     → abu-abu

Fitur:
  - Server-side pagination (default 10/halaman, ada selector 10/25/50)
  - Search global (debounced 300ms) di kanan atas
  - Filter: status, jenis surat, divisi, range tanggal
  - Export CSV (papaparse)
  - Tanggal surat: tampilkan apa adanya dari DB (tidak ada normalisasi)
```

### 7.2 SuratKeluarStepper

```
Komponen visual progress stepper horizontal:
  [1] Upload Draft ──► [2] Permohonan Persetujuan ──► [3] Proses Reviu
  ──► [4] Pengarsipan ──► [5] Selesai

Props: status (statusSuratKeluarEnum)
Step aktif = step sesuai status saat ini
Step selesai = step sebelum step aktif (warna/ikon berbeda)
Setiap step card menampilkan aksi relevan (tombol, upload, info)
```

### 7.3 PegawaiTabs (7 Tab)

```
Tab navigation di halaman detail pegawai:
  1. Profil Karyawan    → Biodata (nama, email, HP, jabatan, divisi, jenis pegawai,
                          tanggal masuk) + tombol "Generate QR Contact"
  2. Kelengkapan Karyawan → Upload dokumen (KTP, NPWP, BPJS, ijazah, dll)
  3. Data Keluarga      → CRUD list anggota keluarga
  4. Riwayat Pendidikan → CRUD riwayat pendidikan
  5. Riwayat Pekerjaan  → CRUD pengalaman kerja sebelumnya
  6. Riwayat Kesehatan  → Golongan darah, catatan medis
  7. Pernyataan Integritas → Upload dokumen + status tanda tangan

QR Contact:
  - Berisi vCard: Nama, No. HP, Email, Jabatan
  - Tombol "Generate QR Contact" di tab Profil
  - Catatan di UI: "Jika ada update Nama/No.HP/Email, silakan generate ulang QR Contact"
  - Hasil QR disimpan ke users.qrContactUrl
```

### 7.4 DisposisiInbox

```
Query: SELECT disposisi WHERE kepada_user_id = session.user.id ORDER BY tanggal DESC
Badge di sidebar: jumlah status "belum_dibaca"

DisposisiTimeline:
  - Tampilkan chain: A (Ketua) → B (Sekretaris) → C (Staff)
  - Gunakan parentDisposisiId untuk build tree
  - Filter: semua | belum dibaca | diproses | selesai

Notifikasi email (Mailjet):
  - Kirim ke penerima saat disposisi dibuat
  - Template: subjek, nama pengirim, perihal surat, instruksi, batas waktu
```

---

## 8. Environment Variables

```bash
# .env.local
# ⚠️ Semua value dikosongkan — diisi saat deployment setelah keputusan tim
# Nama aplikasi dan URL belum diputuskan

# Database (Neon PostgreSQL)
DATABASE_URL=""

# Auth (Better Auth)
BETTER_AUTH_SECRET=""
BETTER_AUTH_URL=""

# File Upload (Cloudinary)
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""

# Email — provider dan konfigurasi belum final
MAILJET_API_KEY=""
MAILJET_API_SECRET=""
MAILJET_FROM_EMAIL=""
MAILJET_FROM_NAME=""

# App — nama dan URL belum diputuskan
NEXT_PUBLIC_APP_NAME=""
NEXT_PUBLIC_APP_URL=""
```

> **Catatan untuk agent:** Jangan hardcode nilai apapun dari env ini. Di repo ini, baca env melalui `process.env.*`. Untuk nilai yang perlu tersedia di client component, gunakan prefix `NEXT_PUBLIC_*`. Jika env kosong saat development lokal, tampilkan warning yang informatif atau fallback aman — jangan crash kecuali env tersebut memang wajib untuk proses server tertentu.

---

## 9. Konvensi Kode

### 9.1 Penamaan

```
Folder route     : kebab-case         → `surat-masuk`, `surat-keluar`, `nomor-surat`
Entry route file : `page.tsx` / `layout.tsx` / `route.ts`
Komponen         : PascalCase         → SuratTable.tsx, PegawaiTabs.tsx
Server action    : camelCase          → createDivisi, updatePegawai, generateNomorSurat
DB table         : snake_case         → surat_keluar, pegawai_biodata
Zod schema file  : camelCase.schema   → suratKeluar.schema.ts
Env var          : UPPER_SNAKE_CASE   → MAILJET_API_KEY
```

### 9.2 Struktur Server Action (Template Standar)

```typescript
"use server";

export async function namaAksi(input: InputType) {
  // 1. Parse & validasi input via Zod
  // 2. Auth check (WAJIB di semua action mutasi)
  // 3. Role/permission check
  // 4. Business logic
  // 5. DB operation (Drizzle — gunakan transaction jika ada multiple insert/update)
  // 6. Side effects (email notif, QR generate, file upload)
  // 7. Audit log insert jika aksi penting
  // 8. revalidatePath("/route-terkait")
  // 9. Return shape konsisten: { ok: true, data } atau { ok: false, error }
}
```

### 9.3 Konvensi Data Fetching & Revalidation

```typescript
// Baca data awal sedapat mungkin di Server Component.
// Untuk mutasi, panggil Server Action lalu revalidate path yang terdampak.

await createDivisi(data);
revalidatePath("/divisi");

// Prinsip:
// - Hindari fetch client-side bila data cukup dirender server-side.
// - Gunakan client component hanya untuk interaksi: dialog, form, table state.
// - Jika nanti diperkenalkan cache/query client, dokumentasikan terpisah
//   dan jangan diasumsikan sudah ada di repo ini.
```

---

## 10. Roadmap Pengembangan

### Phase 1 — Foundation (Minggu 1–2)
- [ ] Setup Next.js App Router + Drizzle + Neon + Better Auth
- [ ] Drizzle schema lengkap + migration awal
- [ ] Layout: sidebar, header, auth flow login/logout, dan proxy redirect `/login?redirect=...`
- [ ] Shell UI Phase 1 dengan arah visual institusional modern
- [ ] Modul di luar Phase 1 tetap tampil di navigasi, tetapi diberi status/disabled state yang jelas
- [ ] CRUD Divisi
- [ ] CRUD Pegawai — semua 7 tab (biodata, kelengkapan, keluarga, pendidikan, pekerjaan, kesehatan, integritas)

### Phase 2 — Core Surat Keluar (Minggu 3)
- [ ] Form buat surat keluar (field tanggal bebas, tanpa validasi range)
- [ ] List surat keluar (TanStack Table dengan semua kolom)
- [ ] Stepper 5 tahap + transisi status
- [ ] Generate nomor surat otomatis (atomic DB transaction)
- [ ] NomorSuratBadge: kondisi null vs terisi

### Phase 3 — Surat Masuk + Disposisi (Minggu 4)
- [ ] Form input surat masuk (tanggalSurat + tanggalDiterima, keduanya manual)
- [ ] List & detail surat masuk
- [ ] Alur disposisi + chain disposisi (parentDisposisiId)
- [ ] DisposisiInbox + badge notif di sidebar
- [ ] Email notifikasi via Mailjet

### Phase 4 — QR + File + Fitur Lanjutan (Minggu 5–6)
- [ ] QR Code generate untuk surat (verifikasi)
- [ ] QR Contact generate untuk pegawai (vCard)
- [ ] Upload/download file via Cloudinary
- [ ] Surat Keputusan modul
- [ ] Surat MOU modul
- [ ] Bulk nomor surat
- [ ] Export CSV arsip

### Phase 5 — Polish & Deploy (Minggu 7–8)
- [ ] RBAC enforcement di semua endpoint
- [ ] Audit log lengkap
- [ ] Isi env var setelah nama app + URL diputuskan
- [ ] Deploy (Vercel atau server IAI)
- [ ] Testing manual E2E semua alur utama

---

## 11. Catatan Khusus IAI Jakarta

1. **Backdate adalah fitur sah** — jangan pasang validasi "tanggal tidak boleh di masa lalu" pada field tanggal surat di manapun.
2. **Nama aplikasi dan URL** belum diputuskan — gunakan env var sebagai placeholder, jangan hardcode.
3. **Email** — provider dan konfigurasi final belum diputuskan, env dikosongkan.
4. **Format nomor surat** fleksibel (lihat contoh data existing di Bagian 5.4). Prefix dikonfigurasi per jenis surat di tabel `nomor_surat_counter.prefix`.
5. **QR Code di surat** berfungsi sebagai tanda verifikasi elektronik visual, bukan tanda tangan digital kriptografi.
6. **QR Contact pegawai** = vCard (Nama, HP, Email, Jabatan) — diregenerate manual jika data berubah.
7. **Bahasa UI**: Seluruh antarmuka dalam Bahasa Indonesia Formal (baku).
8. **Tidak ada akses publik** — semua route di-protect auth.
9. **Pejabat Penandatangan aktif** (dari data existing): *Monalisa — Direktur Eksekutif IAI Wilayah DKI Jakarta*.
10. **Divisi existing** (dari data terlihat): HRD dan Umum, Divisi Kursus, Panitia Seminar Nasional — tambahkan sesuai data aktual.
11. **UI Phase 1** harus terasa seperti produk internal yang siap dipakai, bukan scaffold default. Prioritas: shell aplikasi, login, dashboard, empty state, dan konsistensi visual.
12. **Navigasi modul**: fitur lintas phase boleh tetap terlihat sebagai roadmap, tetapi modul yang belum masuk scope aktif harus dibuat nonaktif atau diberi penanda phase agar tidak menipu ekspektasi user.

---

## 12. Referensi & Link Penting

| Resource | URL |
|---|---|
| Next.js App Router | https://nextjs.org/docs/app |
| Next.js Server Actions | https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations |
| TanStack Table | https://tanstack.com/table/latest |
| React Hook Form | https://react-hook-form.com |
| Zod | https://zod.dev |
| Drizzle ORM | https://orm.drizzle.team |
| Better Auth | https://better-auth.com |
| Neon Database | https://neon.tech |
| shadcn/ui | https://ui.shadcn.com |
| @react-pdf/renderer | https://react-pdf.org |
| qrcode (npm) | https://www.npmjs.com/package/qrcode |
| Cloudinary Docs | https://cloudinary.com/documentation |
| Mailjet Docs | https://dev.mailjet.com |
| Referensi Sistem Existing | https://manajemen-eksekutif.iaiglobal.or.id/simpeg_iai |

---

*Dokumen ini diperbarui berdasarkan observasi langsung sistem SIMPEG IAI existing (screenshot April 2026).*
*Last updated: April 2026 — v2.1 (diselaraskan dengan codebase Next.js aktual)*
