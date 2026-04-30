ALTER TABLE "public"."instructor_rates"
  ADD COLUMN IF NOT EXISTS "mode" varchar(10);

UPDATE "public"."instructor_rates"
SET "mode" = 'offline'
WHERE "mode" IS NULL OR btrim("mode") = '';

ALTER TABLE "public"."instructor_rates"
  ALTER COLUMN "mode" SET DEFAULT 'offline';

ALTER TABLE "public"."instructor_rates"
  ALTER COLUMN "mode" SET NOT NULL;

DROP INDEX IF EXISTS "uniq_instructor_rate";

CREATE UNIQUE INDEX IF NOT EXISTS "uniq_instructor_rate"
  ON "public"."instructor_rates" USING btree ("instructor_id", "program_id", "materi_block", "mode");
