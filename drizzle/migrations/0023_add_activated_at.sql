-- Fase 2: Kolom activated_at di tabel users — timestamp kapan user pertama kali set password.

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "activated_at" timestamp;
