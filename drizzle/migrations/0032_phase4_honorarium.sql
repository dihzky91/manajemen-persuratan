-- Migration: Phase 4 - Honorarium & Reporting
-- Description: Create instructor_rates table for tarif honorarium instruktur

CREATE TABLE "public"."instructor_rates" (
  "id" text PRIMARY KEY NOT NULL,
  "instructor_id" text NOT NULL REFERENCES "public"."instructors"("id") ON DELETE CASCADE,
  "program_id" text NOT NULL REFERENCES "public"."programs"("id") ON DELETE CASCADE,
  "materi_block" varchar(100) NOT NULL,
  "rate_amount" numeric(12,2) NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX "uniq_instructor_rate"
  ON "public"."instructor_rates" USING btree ("instructor_id", "program_id", "materi_block");

CREATE INDEX "ir_instructor_idx"
  ON "public"."instructor_rates" USING btree ("instructor_id");

CREATE INDEX "ir_program_idx"
  ON "public"."instructor_rates" USING btree ("program_id");
