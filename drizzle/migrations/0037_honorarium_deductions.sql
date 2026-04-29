CREATE TABLE IF NOT EXISTS "honorarium_deductions" (
  "id" text PRIMARY KEY NOT NULL,
  "batch_id" text NOT NULL,
  "instructor_id" text NOT NULL,
  "deduction_type" varchar(40) NOT NULL,
  "description" varchar(200) NOT NULL,
  "amount" numeric(12, 2) NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "honorarium_deductions"
  ADD CONSTRAINT "honorarium_deductions_batch_id_honorarium_batches_id_fk"
  FOREIGN KEY ("batch_id") REFERENCES "public"."honorarium_batches"("id")
  ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "honorarium_deductions"
  ADD CONSTRAINT "honorarium_deductions_instructor_id_instructors_id_fk"
  FOREIGN KEY ("instructor_id") REFERENCES "public"."instructors"("id")
  ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hd_batch_idx"
  ON "honorarium_deductions" USING btree ("batch_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hd_instructor_idx"
  ON "honorarium_deductions" USING btree ("instructor_id");
