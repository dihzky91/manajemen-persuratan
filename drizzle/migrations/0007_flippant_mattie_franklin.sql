CREATE TYPE "public"."status_event" AS ENUM('aktif', 'dibatalkan', 'ditunda', 'arsip');--> statement-breakpoint
CREATE TABLE "certificate_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"nama" varchar(200) NOT NULL,
	"kategori" "kategori_kegiatan" NOT NULL,
	"image_url" text NOT NULL,
	"image_width" integer NOT NULL,
	"image_height" integer NOT NULL,
	"field_positions" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_default" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_by" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "event_certificate_counters" (
	"event_id" integer PRIMARY KEY NOT NULL,
	"last_counter" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "event_signatories" DROP CONSTRAINT IF EXISTS "event_signatories_signatory_id_signatories_id_fk";
--> statement-breakpoint
ALTER TABLE "event_signatories" DROP CONSTRAINT IF EXISTS "event_signatories_signatory_id_fkey";
--> statement-breakpoint
ALTER TABLE "signatories" DROP CONSTRAINT IF EXISTS "signatories_pejabat_id_pejabat_penandatangan_id_fk";
--> statement-breakpoint
ALTER TABLE "signatories" DROP CONSTRAINT IF EXISTS "signatories_pejabat_id_fkey";
--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "kode_event" varchar(30);--> statement-breakpoint
UPDATE "events" SET "kode_event" = 'EV-' || "id"::text WHERE "kode_event" IS NULL;--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "kode_event" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "status_event" "status_event" DEFAULT 'aktif' NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "certificate_template_id" integer;--> statement-breakpoint
ALTER TABLE "participants" ADD COLUMN "email" varchar(150);--> statement-breakpoint
ALTER TABLE "participants" ADD COLUMN "email_sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_tanggal_check" CHECK ("tanggal_selesai" >= "tanggal_mulai");--> statement-breakpoint
INSERT INTO "event_certificate_counters" ("event_id", "last_counter", "updated_at")
SELECT
  e."id",
  COALESCE(MAX(CAST(SUBSTRING(p."no_sertifikat" FROM '-([0-9]+)/') AS INTEGER)), 0),
  now()
FROM "events" e
LEFT JOIN "participants" p ON p."event_id" = e."id"
GROUP BY e."id"
ON CONFLICT ("event_id") DO NOTHING;--> statement-breakpoint
ALTER TABLE "certificate_templates" ADD CONSTRAINT "certificate_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_certificate_counters" ADD CONSTRAINT "event_certificate_counters_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "certificate_templates_kategori_idx" ON "certificate_templates" USING btree ("kategori");--> statement-breakpoint
ALTER TABLE "event_signatories" ADD CONSTRAINT "event_signatories_signatory_id_signatories_id_fk" FOREIGN KEY ("signatory_id") REFERENCES "public"."signatories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_certificate_template_id_certificate_templates_id_fk" FOREIGN KEY ("certificate_template_id") REFERENCES "public"."certificate_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signatories" ADD CONSTRAINT "signatories_pejabat_id_pejabat_penandatangan_id_fk" FOREIGN KEY ("pejabat_id") REFERENCES "public"."pejabat_penandatangan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_kode_event_unique" UNIQUE("kode_event");
