-- Migration: Phase 3 - Force Majeure & Makeup
-- Description: Add cancelled fields to class_sessions, create makeup_sessions table

-- ============================================
-- 1. CREATE ENUM FOR CLASS SESSION STATUS
-- ============================================
CREATE TYPE "public"."class_session_status" AS ENUM('scheduled', 'cancelled', 'makeup', 'completed');

-- ============================================
-- 2. ALTER CLASS_SESSIONS TABLE
-- ============================================
-- Convert status column to use enum
ALTER TABLE "public"."class_sessions" 
  ALTER COLUMN "status" TYPE "public"."class_session_status" 
  USING "status"::"public"."class_session_status";

-- Add cancellation tracking columns
ALTER TABLE "public"."class_sessions" 
  ADD COLUMN "cancelled_at" timestamp,
  ADD COLUMN "cancelled_by" text REFERENCES "public"."users"("id"),
  ADD COLUMN "cancellation_reason" varchar(300);

-- Add index on status column
CREATE INDEX "cs_status_idx" ON "public"."class_sessions" USING btree ("status");

-- ============================================
-- 3. CREATE MAKEUP_SESSIONS TABLE
-- ============================================
CREATE TABLE "public"."makeup_sessions" (
  "id" text PRIMARY KEY NOT NULL,
  "original_session_id" text NOT NULL REFERENCES "public"."class_sessions"("id") ON DELETE CASCADE,
  "kelas_id" text NOT NULL REFERENCES "public"."kelas_pelatihan"("id") ON DELETE CASCADE,
  "session_number" integer,
  "is_exam_day" boolean DEFAULT false NOT NULL,
  "exam_subjects" text[],
  "materi_name" varchar(200),
  "scheduled_date" date NOT NULL,
  "time_slot_start" varchar(5) NOT NULL,
  "time_slot_end" varchar(5) NOT NULL,
  "status" "public"."class_session_status" DEFAULT 'scheduled' NOT NULL,
  "created_by" text REFERENCES "public"."users"("id"),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Indexes for makeup_sessions
CREATE INDEX "ms_kelas_date" ON "public"."makeup_sessions" USING btree ("kelas_id", "scheduled_date");
CREATE INDEX "ms_original_session" ON "public"."makeup_sessions" USING btree ("original_session_id");
CREATE INDEX "ms_status_idx" ON "public"."makeup_sessions" USING btree ("status");

-- ============================================
-- 4. UPDATE JOURNAL
-- ============================================
-- Note: Journal entry should be added by drizzle-kit
