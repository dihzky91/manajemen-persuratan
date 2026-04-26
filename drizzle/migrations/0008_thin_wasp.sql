CREATE TYPE "public"."status_peserta" AS ENUM('aktif', 'dicabut');--> statement-breakpoint
ALTER TABLE "participants" DROP CONSTRAINT "participants_no_sertifikat_unique";--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "participants" ADD COLUMN "status_peserta" "status_peserta" DEFAULT 'aktif' NOT NULL;--> statement-breakpoint
ALTER TABLE "participants" ADD COLUMN "revoked_at" timestamp;--> statement-breakpoint
ALTER TABLE "participants" ADD COLUMN "revoked_by" text;--> statement-breakpoint
ALTER TABLE "participants" ADD COLUMN "revoke_reason" text;--> statement-breakpoint
ALTER TABLE "participants" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "participants" ADD CONSTRAINT "participants_revoked_by_users_id_fk" FOREIGN KEY ("revoked_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "participants_status_idx" ON "participants" USING btree ("status_peserta");--> statement-breakpoint
CREATE UNIQUE INDEX "participants_no_sertifikat_active_unique" ON "participants" ("no_sertifikat") WHERE "status_peserta" = 'aktif' AND "deleted_at" IS NULL;