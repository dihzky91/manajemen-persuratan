# SYSTEM.md â€” Sistem Manajemen Surat & Kepegawaian IAI Wilayah DKI Jakarta

> Dokumen ini adalah **panduan arsitektur lengkap** untuk membangun sistem manajemen persuratan dan kepegawaian internal IAI Wilayah DKI Jakarta. Dirancang agar bisa dibaca dan langsung dieksekusi oleh agent manapun (Cursor, Windsurf, Claude Code, dsb.) tanpa konteks tambahan dari developer.

---

## 1. Ringkasan Proyek

| Atribut | Detail |
|---|---|
| **Nama Sistem** | *(belum diputuskan â€” gunakan env `NEXT_PUBLIC_APP_NAME` sebagai placeholder)* |
| **Organisasi** | Ikatan Akuntan Indonesia (IAI) Wilayah DKI Jakarta |
| **Domain / URL** | *(belum diputuskan â€” gunakan env `NEXT_PUBLIC_APP_URL` sebagai placeholder bila mulai dibutuhkan di UI/client)* |
| **Tujuan** | Digitalisasi pengelolaan surat masuk, surat keluar, disposisi, dan data kepegawaian internal |
| **Pengguna** | Admin, Pejabat Penandatangan, Staff Divisi (semua internal IAI Jakarta) |
| **Bahasa UI** | Bahasa Indonesia Formal (baku) |
| **Akses** | **Internal only** â€” semua route di-protect autentikasi, tidak ada halaman publik |

---

## 2. Tech Stack

### 2.1 Core Stack

| Layer | Teknologi | Alasan Pemilihan |
|---|---|---|
| **Framework** | [Next.js App Router](https://nextjs.org/docs/app) | Full-stack React, nested layout, Server/Client Components, SSR/streaming |
| **Routing** | Next.js file-based routing | Selaras dengan struktur repo `src/app`, route groups, layout bertingkat |
| **Server State** | Server Components + revalidation path-based | Sederhana untuk internal app, cocok dengan bentuk data CRUD saat ini |
| **Table** | [TanStack Table](https://tanstack.com/table) | Headless table untuk arsip surat â€” sorting, filter, pagination |
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
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ app/
â”‚   â”‚   â”œâ”€â”€ layout.tsx                      # Root layout + global styles + toaster
â”‚   â”‚   â”œâ”€â”€ page.tsx                        # Entry page (jika dipakai)
â”‚   â”‚   â”œâ”€â”€ api/
â”‚   â”‚   â”‚   â””â”€â”€ auth/[...all]/route.ts      # Better Auth route handler
â”‚   â”‚   â”œâ”€â”€ (auth)/
â”‚   â”‚   â”‚   â””â”€â”€ login/page.tsx              # Halaman login
â”‚   â”‚   â””â”€â”€ (dashboard)/
â”‚   â”‚       â”œâ”€â”€ layout.tsx                  # Auth guard server-side + shell dashboard
â”‚   â”‚       â”œâ”€â”€ dashboard/page.tsx
â”‚   â”‚       â”œâ”€â”€ divisi/page.tsx
â”‚   â”‚       â”œâ”€â”€ pegawai/page.tsx
â”‚   â”‚       â”œâ”€â”€ surat-masuk/page.tsx
â”‚   â”‚       â”œâ”€â”€ surat-keluar/page.tsx
â”‚   â”‚       â”œâ”€â”€ disposisi/page.tsx
â”‚   â”‚       â”œâ”€â”€ nomor-surat/page.tsx
â”‚   â”‚       â”œâ”€â”€ surat-keputusan/page.tsx
â”‚   â”‚       â”œâ”€â”€ surat-mou/page.tsx
â”‚   â”‚       â””â”€â”€ pejabat/page.tsx
â”‚   â”œâ”€â”€ components/
â”‚   â”‚   â”œâ”€â”€ ui/                             # shadcn/ui primitives
â”‚   â”‚   â”œâ”€â”€ layout/                         # Sidebar, Header, PageWrapper
â”‚   â”‚   â””â”€â”€ divisi/                         # Manager/Form modul divisi
â”‚   â”œâ”€â”€ server/
â”‚   â”‚   â”œâ”€â”€ actions/                        # Server Actions per domain
â”‚   â”‚   â”œâ”€â”€ auth.ts                         # Better Auth config
â”‚   â”‚   â””â”€â”€ db/                             # Drizzle schema + koneksi DB
â”‚   â”œâ”€â”€ lib/
â”‚   â”‚   â”œâ”€â”€ validators/
â”‚   â”‚   â”œâ”€â”€ pdf/
â”‚   â”‚   â”œâ”€â”€ qr/
â”‚   â”‚   â”œâ”€â”€ email/
â”‚   â”‚   â”œâ”€â”€ env.ts
â”‚   â”‚   â””â”€â”€ utils.ts
â”‚   â”œâ”€â”€ styles/
â”‚   â”‚   â””â”€â”€ globals.css
â”‚   â””â”€â”€ proxy.ts                            # Route protection berbasis cookie
â”œâ”€â”€ scripts/
â”‚   â”œâ”€â”€ apply-schema.ts
â”‚   â””â”€â”€ seed-admin.ts
â”œâ”€â”€ drizzle/
â”‚   â””â”€â”€ migrations/
â”œâ”€â”€ public/
â”œâ”€â”€ .env.local                              # Lihat Bagian 8
â”œâ”€â”€ drizzle.config.ts
â”œâ”€â”€ next.config.ts
â”œâ”€â”€ tsconfig.json
â””â”€â”€ package.json
```

---

## 4. Database Schema (Drizzle ORM)

### 4.1 ERD Overview

```
divisi â—„â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ users (pegawai)
                                   â”‚
              â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
              â”‚                    â”‚                       â”‚
         surat_masuk         surat_keluar           pegawai_biodata
              â”‚                    â”‚                pegawai_keluarga
         disposisi           nomor_surat_counter    pegawai_pendidikan
         (chain/tree)        pejabat_penandatangan  pegawai_riwayat_pekerjaan
                                                    pegawai_kesehatan
                                                    pegawai_pernyataan_integritas

surat_keputusan â”€â”€â–º pejabat_penandatangan
surat_mou       â”€â”€â–º pejabat_penandatangan
audit_log       â”€â”€â–º users
```

### 4.2 Drizzle Schema Lengkap

```typescript
// app/server/db/schema.ts

import {
  pgTable, text, timestamp, boolean, date,
  integer, serial, pgEnum, varchar, uuid, jsonb
} from "drizzle-orm/pg-core";

// â”€â”€â”€ ENUMS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€â”€ DIVISI â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const divisi = pgTable("divisi", {
  id: serial("id").primaryKey(),
  nama: varchar("nama", { length: 150 }).notNull(),
  kode: varchar("kode", { length: 20 }).unique(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// â”€â”€â”€ USERS (akun login + data dasar pegawai) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€â”€ PEGAWAI DETAIL â€” Tab 1: Biodata â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€â”€ PEGAWAI DETAIL â€” Tab 2: Kelengkapan Karyawan â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€â”€ PEGAWAI DETAIL â€” Tab 3: Data Keluarga â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€â”€ PEGAWAI DETAIL â€” Tab 4: Riwayat Pendidikan â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€â”€ PEGAWAI DETAIL â€” Tab 5: Riwayat Pekerjaan â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€â”€ PEGAWAI DETAIL â€” Tab 6: Riwayat Kesehatan â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€â”€ PEGAWAI DETAIL â€” Tab 7: Pernyataan Integritas â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const pegawaiPernyataanIntegritas = pgTable("pegawai_pernyataan_integritas", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull().unique(),
  tanggalPernyataan: date("tanggal_pernyataan"),
  fileUrl: text("file_url"),
  statusTandaTangan: boolean("status_tanda_tangan").default(false),
  catatan: text("catatan"),
  createdAt: timestamp("created_at").defaultNow(),
});

// â”€â”€â”€ PEJABAT PENANDATANGAN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€â”€ NOMOR SURAT COUNTER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const nomorSuratCounter = pgTable("nomor_surat_counter", {
  id: serial("id").primaryKey(),
  tahun: integer("tahun").notNull(),
  bulan: integer("bulan").notNull(),
  jenisSurat: jenisSuratEnum("jenis_surat").notNull(),
  counter: integer("counter").default(0).notNull(),
  prefix: varchar("prefix", { length: 80 }),
  // Contoh prefix dari data existing: "IAI-DKIJKT", "DE/IAI-DKIJKT", "PPL/IAI-DKIJKT"
  updatedAt: timestamp("updated_at").defaultNow(),
  // UNIQUE constraint: (tahun, bulan, jenis_surat) â€” di migration
});

// Format final: {counter}/{prefix}/{bulan_romawi}/{tahun}
// Contoh actual: 19.1-7/DE/IAI-DKIJKT/IV/2026  |  17/PPL/IAI-DKIJKT/IV/26

// â”€â”€â”€ SURAT KELUAR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const suratKeluar = pgTable("surat_keluar", {
  id: uuid("id").defaultRandom().primaryKey(),

  // nomorSurat: NULL saat pertama dibuat, terisi setelah step "Generate No."
  nomorSurat: varchar("nomor_surat", { length: 200 }).unique(),

  perihal: text("perihal").notNull(),
  tujuan: varchar("tujuan", { length: 300 }).notNull(),
  tujuanAlamat: text("tujuan_alamat"),

  // âš ï¸ BACKDATE: tanggalSurat adalah input MANUAL BEBAS â€” tidak ada validasi range
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

// â”€â”€â”€ SURAT MASUK â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const suratMasuk = pgTable("surat_masuk", {
  id: uuid("id").defaultRandom().primaryKey(),
  nomorAgenda: varchar("nomor_agenda", { length: 50 }),
  nomorSuratAsal: varchar("nomor_surat_asal", { length: 200 }),
  perihal: text("perihal").notNull(),
  pengirim: varchar("pengirim", { length: 200 }).notNull(),
  pengirimAlamat: text("pengirim_alamat"),

  // âš ï¸ BACKDATE: keduanya input manual, tidak ada validasi range tanggal
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

// â”€â”€â”€ DISPOSISI â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€â”€ SURAT KEPUTUSAN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const suratKeputusan = pgTable("surat_keputusan", {
  id: uuid("id").defaultRandom().primaryKey(),
  nomorSK: varchar("nomor_sk", { length: 200 }).unique().notNull(),
  perihal: text("perihal").notNull(),
  tentang: text("tentang").notNull(),
  tanggalSK: date("tanggal_sk").notNull(),         // âš ï¸ BACKDATE: input manual bebas
  tanggalBerlaku: date("tanggal_berlaku"),
  tanggalBerakhir: date("tanggal_berakhir"),
  pejabatId: integer("pejabat_id").references(() => pejabatPenandatangan.id),
  fileUrl: text("file_url"),
  qrCodeUrl: text("qr_code_url"),
  dibuatOleh: uuid("dibuat_oleh").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// â”€â”€â”€ SURAT MOU â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const suratMou = pgTable("surat_mou", {
  id: uuid("id").defaultRandom().primaryKey(),
  nomorMOU: varchar("nomor_mou", { length: 200 }).unique().notNull(),
  perihal: text("perihal").notNull(),
  pihakKedua: varchar("pihak_kedua", { length: 200 }).notNull(),
  pihakKeduaAlamat: text("pihak_kedua_alamat"),
  tanggalMOU: date("tanggal_mou").notNull(),        // âš ï¸ BACKDATE: input manual bebas
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

// â”€â”€â”€ AUDIT LOG â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
    â”‚
    â”œâ”€â”€ Request halaman â”€â”€â–º Next.js App Router
    â”‚                       â”œâ”€â”€ Root Layout (`src/app/layout.tsx`)
    â”‚                       â”œâ”€â”€ Route Group `(auth)` untuk login
    â”‚                       â””â”€â”€ Route Group `(dashboard)` untuk area internal
    â”‚
    â”œâ”€â”€ Route protection ringan â”€â”€â–º `src/proxy.ts`
    â”‚                               â””â”€â”€ cek cookie session lalu redirect ke `/login?redirect=...`
    â”‚
    â”œâ”€â”€ Server Component â”€â”€â–º baca data awal / validasi session
    â””â”€â”€ Client Component â”€â”€â–º interaksi tabel, dialog, form submit

Server Actions / Route Handler
    â”‚
    â”œâ”€â”€ 1. Zod validation (input)
    â”œâ”€â”€ 2. Better Auth session + role check
    â”œâ”€â”€ 3. Drizzle ORM â†’ Neon PostgreSQL
    â”œâ”€â”€ 4. `revalidatePath()` untuk sinkronisasi UI setelah mutasi
    â””â”€â”€ 5. Side effects:
            â”œâ”€â”€ Mailjet    â†’ notifikasi disposisi via email
            â”œâ”€â”€ Cloudinary â†’ upload/retrieve file PDF/gambar
            â”œâ”€â”€ qrcode     â†’ generate QR surat & QR contact pegawai
            â””â”€â”€ auditLog   â†’ catat semua aksi penting
```

### 5.2 Workflow Surat Keluar â€” Stepper 5 Tahap

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚   Step 1     â”‚         Step 2           â”‚    Step 3      â”‚   Step 4 â€” Pengarsipan (status: "pengarsipan")
  a. Generate Nomor Surat
     - Klik "Generate No. Surat Keluar"
     - generateNomorSurat() â†’ atomic counter (DB transaction)
     - nomorSurat terisi, ditampilkan sebagai badge bernomor di list
  b. Generate QR Code
     - QR berisi data verifikasi surat (URL atau data ringkas surat)
     - Disimpan ke qrCodeUrl, bisa di-copy sebagai gambar
     - Di modul internal, tampilkan tombol "Preview Halaman Verifikasi" dan "Salin Link Verifikasi"
  c. Upload Dokumen Final
     - User download draft, tambahkan nomor + QR secara manual ke PDF
     - Re-upload PDF final â†’ disimpan ke fileFinalUrl
  d. Checklist Pengarsipan
     - nomorSurat sudah terisi
     - qrCodeUrl sudah terisi
     - fileFinalUrl sudah terisi

Step 5 â€” Selesai (status: "selesai")
  - Konfirmasi pengarsipan selesai
  - Status "selesai" idealnya hanya diberikan setelah checklist pengarsipan lengkap
  - Muncul badge "Selesai" hijau di list surat keluar
```

### 5.3 Aturan Backdate â€” WAJIB DIBACA
```
âš ï¸ PERHATIAN UNTUK SEMUA AGENT/DEVELOPER:

Semua field tanggal surat berikut adalah INPUT MANUAL BEBAS:
  - suratKeluar.tanggalSurat
  - suratMasuk.tanggalSurat
  - suratMasuk.tanggalDiterima
  - suratKeputusan.tanggalSK
  - suratMou.tanggalMOU

âœ… DIIZINKAN: Tanggal masa lalu (backdate)
âœ… DIIZINKAN: Tanggal hari ini
âœ… DIIZINKAN: Tanggal masa depan (untuk keperluan antedating)

âŒ DILARANG menambahkan validasi berikut:
  - "Tanggal tidak boleh sebelum hari ini"
  - "Tanggal surat harus >= tanggal input sistem"
  - "Tanggal tidak boleh lebih dari N hari yang lalu"

Satu-satunya validasi tanggal yang boleh: required (wajib diisi).

ALASAN: Praktik persuratan organisasi sering memerlukan backdate
untuk kebutuhan administrasi yang sah â€” misalnya surat menyusul,
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
  3. Jika tidak ada â†’ INSERT counter=1
  4. Jika ada       â†’ UPDATE SET counter = counter + 1
  5. COMMIT
  6. Ambil prefix dari config
  7. Return: "{counter}/{prefix}/{bulanRomawi}/{tahun}"

âš ï¸ WAJIB pakai DB transaction untuk menghindari race condition
   jika dua user generate nomor di waktu bersamaan.

State di tabel surat_keluar:
  nomorSurat = NULL  â†’ tampil tombol "Generate No. Surat Keluar"
  nomorSurat = "..." â†’ tampil sebagai badge/teks nomor
```

---

## 6. Autentikasi & Otorisasi (Better Auth + RBAC)

### 6.1 Role Matrix

| Fitur | admin | pejabat | staff | viewer |
|---|---|---|---|---|
| Buat Surat Keluar | âœ… | âœ… | âœ… | âŒ |
| Lihat Arsip Surat Keluar | âœ… | âœ… | âœ… | âœ… |
| Approve / Reviu Surat Keluar | âœ… | âœ… | âŒ | âŒ |
| Generate Nomor Surat | âœ… | âœ… | âŒ | âŒ |
| Input Surat Masuk | âœ… | âŒ | âœ… | âŒ |
| Disposisi Surat | âœ… | âœ… | âŒ | âŒ |
| Terima / Proses Disposisi | âœ… | âœ… | âœ… | âŒ |
| Buat SK / MOU | âœ… | âœ… | âŒ | âŒ |
| Kelola Data Pegawai | âœ… | âŒ | âŒ | âŒ |
| Kelola Divisi | âœ… | âŒ | âŒ | âŒ |
| Bulk Nomor Surat | âœ… | âŒ | âŒ | âŒ |
| Lihat Audit Log | âœ… | âŒ | âŒ | âŒ |

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
  "selesai"   â†’ hijau
  "disetujui" / "reviu" â†’ hijau muda / biru
  "reviu"     â†’ kuning/orange
  "draft"     â†’ abu-abu

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
  [1] Upload Draft â”€â”€â–º [2] Permohonan Persetujuan â”€â”€â–º [3] Proses Reviu
  â”€â”€â–º [4] Pengarsipan â”€â”€â–º [5] Selesai

Props: status (statusSuratKeluarEnum)
Step aktif = step sesuai status saat ini
Step selesai = step sebelum step aktif (warna/ikon berbeda)
Setiap step card menampilkan aksi relevan (tombol, upload, info)

Ketentuan implementasi:
  - Phase 2: stepper internal wajib aktif untuk tracking progress surat keluar
  - Step "Pengarsipan" adalah pusat kontrol finalisasi surat
  - Di step "Pengarsipan", tampilkan checklist internal:
      - Nomor surat sudah dibuat
      - QR verifikasi sudah dibuat
      - Dokumen final sudah diunggah
  - Jika QR verifikasi sudah tersedia, tampilkan:
      - preview QR kecil
      - tombol "Preview Halaman Verifikasi"
      - tombol "Salin Link Verifikasi"
  - Tombol "Selesai" sebaiknya disabled jika checklist pengarsipan belum lengkap
```

### 7.2.1 Halaman Verifikasi Publik Surat

```
Route publik verifikasi surat direncanakan pada Phase 4.

Tujuan:
  - Menjadi landing page saat QR surat di-scan
  - Menampilkan bukti bahwa surat tercatat resmi di sistem

Contoh route:
  - /verifikasi/surat-keluar/[id]
  - atau route publik serupa yang stabil dan dapat di-embed ke QR

Data minimum yang ditampilkan:
  - Nomor surat
  - Tanggal surat
  - Perihal
  - Tujuan / ditujukan kepada
  - Nama pejabat penandatangan
  - Status valid / tidak valid

Opsional:
  - Tombol download / preview file final jika kebijakan organisasi mengizinkan akses publik ke dokumen final

Ketentuan penting:
  - Route ini adalah pengecualian terbatas dari prinsip "internal only"
  - Halaman publik verifikasi hanya untuk membaca status validitas surat, bukan untuk mengakses dashboard internal
  - Jangan tampilkan data sensitif di luar kebutuhan verifikasi
  - URL final harus berbasis env `NEXT_PUBLIC_APP_URL`, jangan hardcode domain
```

### 7.3 PegawaiTabs (7 Tab)
```
Tab navigation di halaman detail pegawai:
  1. Profil Karyawan    â†’ Biodata (nama, email, HP, jabatan, divisi, jenis pegawai,
                          tanggal masuk) + tombol "Generate QR Contact"
  2. Kelengkapan Karyawan â†’ Upload dokumen (KTP, NPWP, BPJS, ijazah, dll)
  3. Data Keluarga      â†’ CRUD list anggota keluarga
  4. Riwayat Pendidikan â†’ CRUD riwayat pendidikan
  5. Riwayat Pekerjaan  â†’ CRUD pengalaman kerja sebelumnya
  6. Riwayat Kesehatan  â†’ Golongan darah, catatan medis
  7. Pernyataan Integritas â†’ Upload dokumen + status tanda tangan

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
  - Tampilkan chain: A (Ketua) â†’ B (Sekretaris) â†’ C (Staff)
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
# âš ï¸ Semua value dikosongkan â€” diisi saat deployment setelah keputusan tim
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

# Email â€” provider dan konfigurasi belum final
MAILJET_API_KEY=""
MAILJET_API_SECRET=""
MAILJET_FROM_EMAIL=""
MAILJET_FROM_NAME=""

# App â€” nama dan URL belum diputuskan
NEXT_PUBLIC_APP_NAME=""
NEXT_PUBLIC_APP_URL=""
```

> **Catatan untuk agent:** Jangan hardcode nilai apapun dari env ini. Di repo ini, baca env melalui `process.env.*`. Untuk nilai yang perlu tersedia di client component, gunakan prefix `NEXT_PUBLIC_*`. Jika env kosong saat development lokal, tampilkan warning yang informatif atau fallback aman â€” jangan crash kecuali env tersebut memang wajib untuk proses server tertentu.

---

## 9. Konvensi Kode

### 9.1 Penamaan

```
Folder route     : kebab-case         â†’ `surat-masuk`, `surat-keluar`, `nomor-surat`
Entry route file : `page.tsx` / `layout.tsx` / `route.ts`
Komponen         : PascalCase         â†’ SuratTable.tsx, PegawaiTabs.tsx
Server action    : camelCase          â†’ createDivisi, updatePegawai, generateNomorSurat
DB table         : snake_case         â†’ surat_keluar, pegawai_biodata
Zod schema file  : camelCase.schema   â†’ suratKeluar.schema.ts
Env var          : UPPER_SNAKE_CASE   â†’ MAILJET_API_KEY
```

### 9.2 Struktur Server Action (Template Standar)

```typescript
"use server";

export async function namaAksi(input: InputType) {
  // 1. Parse & validasi input via Zod
  // 2. Auth check (WAJIB di semua action mutasi)
  // 3. Role/permission check
  // 4. Business logic
  // 5. DB operation (Drizzle â€” gunakan transaction jika ada multiple insert/update)
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

### Phase 1 ï¿½ Foundation (Minggu 1ï¿½2)
- [x] Setup Next.js App Router + Drizzle + Neon + Better Auth
- [x] Drizzle schema lengkap + migration awal
- [x] Layout: sidebar, header, auth flow login/logout, dan proxy redirect `/login?redirect=...`
- [x] Shell UI Phase 1 dengan arah visual institusional modern
- [x] Modul di luar Phase 1 tetap tampil di navigasi, tetapi diberi status/disabled state yang jelas
- [x] CRUD Divisi
- [x] CRUD Pegawai ï¿½ semua 7 tab (biodata, kelengkapan, keluarga, pendidikan, pekerjaan, kesehatan, integritas)

Catatan status April 2026: Phase 1 telah diverifikasi selesai berdasarkan implementasi codebase aktif dan lolos `npm run typecheck` setelah perapihan tipe pada dialog tab pegawai.

### Phase 2 â€” Core Surat Keluar (Minggu 3)
- [x] Form buat surat keluar (field tanggal bebas, tanpa validasi range)
- [x] List surat keluar (TanStack Table dengan semua kolom)
- [x] Stepper 5 tahap + transisi status
- [x] Generate nomor surat otomatis (atomic DB transaction)
- [x] NomorSuratBadge: kondisi null vs terisi
- [x] Progress tracker internal berbasis stepper untuk memantau status surat

Catatan scope:
- Phase 2 fokus pada workflow internal surat keluar
- Preview QR, preview halaman verifikasi publik, dan route publik verifikasi belum wajib selesai di phase ini
- Penyempurnaan UX kecil pada stepper/pengarsipan boleh dilakukan lebih awal selama tidak mengubah pembagian tanggung jawab antar phase

Catatan status April 2026: Phase 2 selesai dan aktif. Sudah diaudit ulang, guard transisi status diperketat di server action, generator nomor surat dirapikan agar aman saat race pada periode baru, dan lolos `npm run typecheck`.

**File yang dihasilkan Phase 2:**
- `src/server/actions/suratKeluar.ts` — server actions lengkap: CRUD, 6 transisi status (`ajukanPersetujuan`, `mulaiReviu`, `setujuiSurat`, `tolakSurat`, `selesaikanSurat`, `batalkanSurat`), guard validasi state per transisi, `assignNomorSuratKeluar` berbasis atomic upsert transaction, `listPejabatAktif`, `listDivisiOptions`
- `src/components/surat-keluar/SuratKeluarForm.tsx` — dialog form RHF + Zod, create/edit, field operasional inti termasuk URL draft, select pejabat, dan divisi
- `src/components/surat-keluar/SuratKeluarStepper.tsx` — stepper 5 tahap visual, action buttons per status + role, tolak dengan textarea inline, detail surat menampilkan draft/pembuat/alamat/isi singkat
- `src/components/surat-keluar/SuratKeluarManager.tsx` — tabel surat keluar dengan kolom operasional lebih lengkap, NomorSuratCell, StatusBadge, dropdown aksi per baris, konfirmasi hapus
- `src/app/(dashboard)/surat-keluar/page.tsx` â€” Server Component, fetch parallel 4 query, wire ke Manager
- `src/components/layout/navigation.ts` â€” Surat Keluar dipindah ke section "Persuratan" dengan `active: true`

**Catatan implementasi untuk agent berikutnya:**
- `suratKeluar.status` di Drizzle inferred sebagai `string | null` (tidak ada `.notNull()` di schema) — selalu fallback `status ?? "draft"` di client
- Radix UI `<SelectItem>` tidak mengizinkan `value=""` — gunakan `"__none__"` sebagai sentinel untuk field optional (pejabatId, divisiId), konversi ke `undefined` saat submit
- `assignNomorSuratKeluar` dan `generateNomorSurat` memakai pola `INSERT ... ON CONFLICT DO UPDATE ... RETURNING` untuk increment counter yang lebih aman pada request paralel pertama di periode baru
- `selesaikanSurat` mensyaratkan `nomorSurat` sudah terisi (enforced di UI, tombol disabled jika null)
- Transisi workflow utama sekarang wajib datang dari status sebelumnya yang valid; jangan bypass server action dengan update status langsung ke tabel
- Backdate tetap berlaku: tidak ada validasi range pada `tanggalSurat`

### Phase 3 â€” Surat Masuk + Disposisi (Minggu 4)
- [x] Form input surat masuk (tanggalSurat + tanggalDiterima, keduanya manual)
- [x] List & detail surat masuk
- [x] Alur disposisi + chain disposisi (parentDisposisiId)
- [x] DisposisiInbox + badge notif di sidebar
- [x] Email notifikasi via Mailjet

Catatan status April 2026: Phase 3 selesai dan aktif. Modul surat masuk, halaman detail, chain disposisi, inbox pengguna, badge unread di sidebar, dan integrasi email Mailjet sudah terpasang serta lolos `npm run typecheck`.

### Phase 4 â€” QR + File + Fitur Lanjutan (Minggu 5â€“6)
- [ ] QR Code generate untuk surat (verifikasi)
- [ ] Preview QR dan tombol "Preview Halaman Verifikasi" dari modul internal
- [ ] Route publik verifikasi surat dari hasil scan QR
- [ ] QR Contact generate untuk pegawai (vCard)
- [ ] Upload/download file via Cloudinary
- [ ] Surat Keputusan modul
- [ ] Surat MOU modul
- [ ] Bulk nomor surat
- [ ] Export CSV arsip

Catatan status April 2026: fondasi storage multi-provider sudah aktif. Mode `local` telah diverifikasi end-to-end untuk `surat masuk` serta `surat keluar` (draft, lampiran, generate nomor surat, upload file final, dan penyelesaian pengarsipan). Validator file, batas ukuran, whitelist MIME, dan namespace environment storage sudah terpasang. Jalur `cloudinary` belum diuji manual penuh, QR/public verification belum dimulai, dan provider `hosted` masih placeholder.

### Phase 5 â€” Polish & Deploy (Minggu 7â€“8)
- [ ] RBAC enforcement di semua endpoint
- [ ] Audit log lengkap
- [ ] Isi env var setelah nama app + URL diputuskan
- [ ] Deploy (Vercel atau server IAI)
- [ ] Testing manual E2E semua alur utama

---

## 11. Catatan Khusus IAI Jakarta

1. **Backdate adalah fitur sah** â€” jangan pasang validasi "tanggal tidak boleh di masa lalu" pada field tanggal surat di manapun.
2. **Nama aplikasi dan URL** belum diputuskan â€” gunakan env var sebagai placeholder, jangan hardcode.
3. **Email** â€” provider dan konfigurasi final belum diputuskan, env dikosongkan.
4. **Format nomor surat** fleksibel (lihat contoh data existing di Bagian 5.4). Prefix dikonfigurasi per jenis surat di tabel `nomor_surat_counter.prefix`.
5. **QR Code di surat** berfungsi sebagai tanda verifikasi elektronik visual, bukan tanda tangan digital kriptografi.
6. **QR Contact pegawai** = vCard (Nama, HP, Email, Jabatan) â€” diregenerate manual jika data berubah.
7. **Bahasa UI**: Seluruh antarmuka dalam Bahasa Indonesia Formal (baku).
8. **Tidak ada akses publik** â€” semua route di-protect auth, kecuali route verifikasi surat yang memang dirancang terbatas untuk publik pada Phase 4.
9. **Pejabat Penandatangan aktif** (dari data existing): *Monalisa â€” Direktur Eksekutif IAI Wilayah DKI Jakarta*.
10. **Divisi existing** (dari data terlihat): HRD dan Umum, Divisi Kursus, Panitia Seminar Nasional â€” tambahkan sesuai data aktual.
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
*Last updated: April 2026 â€” v2.1 (diselaraskan dengan codebase Next.js aktual)*



