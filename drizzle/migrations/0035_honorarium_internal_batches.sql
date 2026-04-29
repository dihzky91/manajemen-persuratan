CREATE TABLE IF NOT EXISTS "honorarium_batches" (
  "id" text PRIMARY KEY NOT NULL,
  "document_number" varchar(80) NOT NULL,
  "period_start" date NOT NULL,
  "period_end" date NOT NULL,
  "status" varchar(40) DEFAULT 'draft' NOT NULL,
  "generated_by" text,
  "approved_by" text,
  "paid_by" text,
  "submitted_at" timestamp,
  "approved_at" timestamp,
  "paid_at" timestamp,
  "locked_at" timestamp,
  "internal_notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "honorarium_batches"
  ADD CONSTRAINT "honorarium_batches_generated_by_users_id_fk"
  FOREIGN KEY ("generated_by") REFERENCES "public"."users"("id")
  ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "honorarium_batches"
  ADD CONSTRAINT "honorarium_batches_approved_by_users_id_fk"
  FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id")
  ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "honorarium_batches"
  ADD CONSTRAINT "honorarium_batches_paid_by_users_id_fk"
  FOREIGN KEY ("paid_by") REFERENCES "public"."users"("id")
  ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_honorarium_document_number"
  ON "honorarium_batches" USING btree ("document_number");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hb_period_idx"
  ON "honorarium_batches" USING btree ("period_start", "period_end");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hb_status_idx"
  ON "honorarium_batches" USING btree ("status");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "honorarium_items" (
  "id" text PRIMARY KEY NOT NULL,
  "batch_id" text NOT NULL,
  "assignment_id" text NOT NULL,
  "session_id" text NOT NULL,
  "kelas_id" text NOT NULL,
  "program_id" text NOT NULL,
  "scheduled_date" date NOT NULL,
  "paid_instructor_id" text NOT NULL,
  "paid_instructor_name" varchar(200) NOT NULL,
  "source" varchar(20) NOT NULL,
  "materi_block" varchar(100) NOT NULL,
  "expertise_level_snapshot" varchar(20) DEFAULT 'middle' NOT NULL,
  "rate_snapshot" numeric(12, 2) NOT NULL,
  "amount" numeric(12, 2) NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "honorarium_items"
  ADD CONSTRAINT "honorarium_items_batch_id_honorarium_batches_id_fk"
  FOREIGN KEY ("batch_id") REFERENCES "public"."honorarium_batches"("id")
  ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "honorarium_items"
  ADD CONSTRAINT "honorarium_items_assignment_id_session_assignments_id_fk"
  FOREIGN KEY ("assignment_id") REFERENCES "public"."session_assignments"("id")
  ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "honorarium_items"
  ADD CONSTRAINT "honorarium_items_session_id_class_sessions_id_fk"
  FOREIGN KEY ("session_id") REFERENCES "public"."class_sessions"("id")
  ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "honorarium_items"
  ADD CONSTRAINT "honorarium_items_kelas_id_kelas_pelatihan_id_fk"
  FOREIGN KEY ("kelas_id") REFERENCES "public"."kelas_pelatihan"("id")
  ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "honorarium_items"
  ADD CONSTRAINT "honorarium_items_program_id_programs_id_fk"
  FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id")
  ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "honorarium_items"
  ADD CONSTRAINT "honorarium_items_paid_instructor_id_instructors_id_fk"
  FOREIGN KEY ("paid_instructor_id") REFERENCES "public"."instructors"("id")
  ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_honorarium_batch_assignment"
  ON "honorarium_items" USING btree ("batch_id", "assignment_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hi_batch_idx"
  ON "honorarium_items" USING btree ("batch_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hi_instructor_idx"
  ON "honorarium_items" USING btree ("paid_instructor_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hi_date_idx"
  ON "honorarium_items" USING btree ("scheduled_date");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "honorarium_audit_logs" (
  "id" text PRIMARY KEY NOT NULL,
  "batch_id" text NOT NULL,
  "actor_id" text,
  "action" varchar(60) NOT NULL,
  "payload" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "honorarium_audit_logs"
  ADD CONSTRAINT "honorarium_audit_logs_batch_id_honorarium_batches_id_fk"
  FOREIGN KEY ("batch_id") REFERENCES "public"."honorarium_batches"("id")
  ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "honorarium_audit_logs"
  ADD CONSTRAINT "honorarium_audit_logs_actor_id_users_id_fk"
  FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id")
  ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hal_batch_idx"
  ON "honorarium_audit_logs" USING btree ("batch_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hal_action_idx"
  ON "honorarium_audit_logs" USING btree ("action");
