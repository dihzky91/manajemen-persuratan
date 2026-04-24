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

Proyek saat ini sudah masuk **Phase 4**.

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

Yang belum selesai:

- integrasi Cloudinary
- bulk nomor surat

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
