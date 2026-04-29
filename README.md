# Manajemen Persuratan

Sistem manajemen surat dan kepegawaian internal untuk **IAI Wilayah DKI Jakarta**.  
Dibangun dengan Next.js App Router untuk mendukung pengelolaan:

- surat keluar
- surat masuk
- disposisi
- data pegawai
- divisi
- pejabat penandatangan
- nomor surat
- surat keputusan
- surat MOU

Semua modul ditujukan untuk penggunaan **internal organisasi**, dengan pengecualian terbatas pada halaman **verifikasi publik** untuk dokumen yang memakai QR.

## Status

Proyek saat ini sudah berada pada tahap **operasional aktif**. Modul utama sudah tersedia; pekerjaan tersisa berfokus pada validasi storage, polish, deploy, dan hardening akhir.

Yang sudah aktif:

- autentikasi internal
- dashboard dan shell aplikasi
- CRUD divisi
- CRUD pegawai + 7 tab data pegawai
- workflow surat keluar 5 tahap
- surat masuk + disposisi
- QR verifikasi surat keluar
- QR Contact pegawai
- modul pejabat penandatangan
- modul nomor surat
- modul surat keputusan
- modul surat MOU
- export CSV arsip
- bulk nomor surat

Yang belum selesai:

- integrasi Cloudinary
- validasi end-to-end seluruh skenario upload file
- polish, RBAC menyeluruh, deploy, dan uji E2E final

Dokumen arsitektur lengkap tersedia di [SYSTEM.md](./SYSTEM.md).

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Drizzle ORM
- PostgreSQL / Neon
- Better Auth
- React Hook Form + Zod
- TanStack Table
- qrcode
- papaparse

## Struktur Utama

```bash
src/
  app/
  components/
  lib/
  server/
docs/
drizzle/
scripts/
SYSTEM.md
```

## Menjalankan Lokal

1. Install dependency

```bash
npm install
```

2. Salin env

```bash
cp .env.example .env.local
```

3. Isi variabel environment yang dibutuhkan, terutama:

- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`

4. Jalankan aplikasi

```bash
npm run dev
```

5. Buka:

```bash
http://localhost:6700
```

## Script Penting

```bash
npm run dev
npm run build
npm run start
npm run typecheck
npm run db:generate
npm run db:migrate
npm run db:push
```

## Environment

Contoh environment tersedia di [.env.example](./.env.example).

Storage saat ini mendukung mode:

- `local`
- `cloudinary`
- `hosted` (placeholder)

Untuk development saat ini, mode yang paling aman adalah:

```bash
STORAGE_PROVIDER=local
```

## Catatan Implementasi

- Format tanggal bisnis disesuaikan ke **Asia/Jakarta**
- Backdate untuk tanggal dokumen **diizinkan**
- Route verifikasi publik yang sudah aktif:
  - `/verifikasi/surat-keluar/[id]`
  - `/verifikasi/surat-keputusan/[id]`
  - `/verifikasi/surat-mou/[id]`

## Repository Goal

Repository ini diposisikan sebagai aplikasi internal yang siap dikembangkan bertahap sampai tahap deploy dan hardening final, bukan sekadar prototype UI.
# Manajemen Persuratan

Sistem manajemen surat, kepegawaian, sertifikat, dan kegiatan internal untuk **IAI Wilayah DKI Jakarta**.  
Dibangun dengan **Next.js App Router** — mendukung digitalisasi operasional organisasi secara end-to-end.

## Modul

**Persuratan & Arsip**
- Surat Keluar — workflow 5 tahap (draft → persetujuan → reviu → pengarsipan → selesai)
- Surat Masuk + Disposisi berantai (chain/tree)
- Surat Keputusan (SK)
- Surat MOU
- Nomor Surat — counter atomik otomatis + nomor manual
- Pejabat Penandatangan

**Kepegawaian**
- Data Pegawai — 7 tab (profil, kelengkapan, keluarga, pendidikan, pekerjaan, kesehatan, integritas)
- Divisi
- QR Contact Pegawai (vCard)

**Sertifikat & Kegiatan**
- Event / Kegiatan — CRUD + filter + server-side pagination
- Template Sertifikat — drag-drop editor visual (react-rnd)
- Peserta — import bulk CSV/XLSX, QR per peserta, PDF, email
- Penandatangan (signatories)
- Analitik — charts (recharts)
- Verifikasi publik sertifikat via QR
- Revokasi sertifikat + soft delete

**Fitur Lain**
- Jadwal Otomatis Brevet
- Jadwal Ujian
- Kalender Kegiatan
- Pengumuman Internal
- Pengaturan Sistem
- Notifikasi & preferensi
- Audit Log sistem
- Export CSV arsip surat
- Bulk nomor surat

**Verifikasi Publik (QR)**
- `/verifikasi/surat-keluar/[id]`
- `/verifikasi/surat-keputusan/[id]`
- `/verifikasi/surat-mou/[id]`
- `/verifikasi/[noSertifikat]`

## Tech Stack

| Kategori | Teknologi |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript strict |
| Database | PostgreSQL (Neon), Drizzle ORM + Drizzle Kit |
| Auth | Better Auth (session-based, RBAC: admin/pejabat/staff/viewer) |
| UI | Tailwind CSS, shadcn/ui, Radix UI, Lucide Icons, Sonner |
| Form | React Hook Form + Zod |
| Table | TanStack Table (server-side pagination, filter, sorting) |
| Charts | Recharts |
| PDF | @react-pdf/renderer, pdf-lib, jspdf + jspdf-autotable |
| QR | qrcode |
| File | papaparse (CSV), xlsx (XLSX), jszip (ZIP) |
| Upload | Cloudinary (production) / local storage (development) |
| Email | Mailjet (node-mailjet) |
| Editor | Tiptap (WYSIWYG) |
| Date | date-fns |

## Status

Operasional aktif. Modul utama sudah live dan digunakan. Lanjutan: validasi storage end-to-end, polish UI, hardening RBAC, deploy final.

Dokumen arsitektur lengkap: [SYSTEM.md](./SYSTEM.md).

## Struktur

```
src/
  app/              # App Router — (auth), (dashboard), verifikasi
  components/       # UI komponen per modul
  server/           # Server Actions + DB config + Auth config
  lib/              # Validator, PDF, QR, email, env, utils
  styles/           # Global CSS
docs/               # Dokumentasi lanjutan
drizzle/            # Migrations
scripts/            # Seed, schema utility
```

## Menjalankan Lokal

```bash
npm install
cp .env.example .env.local
# isi DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL
npm run dev          # http://localhost:6700
```

## Scripts

```bash
npm run dev          # next dev --port 6700
npm run build        # next build
npm run typecheck    # tsc --noEmit
npm run lint         # eslint .
npm run format       # prettier --write .
npm run db:generate  # drizzle-kit generate
npm run db:migrate   # drizzle-kit push --force
npm run db:push      # drizzle-kit push
npm run db:studio    # drizzle-kit studio
```

## Environment

Lihat [.env.example](./.env.example). Storage provider dikonfigurasi via env:

```bash
STORAGE_PROVIDER=local        # development (disarankan)
STORAGE_PROVIDER=cloudinary   # production
STORAGE_PROVIDER=hosted       # placeholder
```

## Catatan

- Zona waktu aplikasi: **Asia/Jakarta**
- Backdate dokumen: **diizinkan** untuk kebutuhan administrasi organisasi
- Seluruh route internal dilindungi autentikasi — hanya halaman verifikasi publik yang dapat diakses tanpa login
