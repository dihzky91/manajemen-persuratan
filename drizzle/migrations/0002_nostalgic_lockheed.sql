CREATE TABLE "system_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"nama_sistem" varchar(200) DEFAULT 'IAI Jakarta' NOT NULL,
	"singkatan" varchar(20),
	"logo_url" text,
	"favicon_url" text,
	"updated_at" timestamp DEFAULT now(),
	"updated_by" text
);
--> statement-breakpoint
ALTER TABLE "disposisi" ALTER COLUMN "surat_masuk_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "disposisi" ALTER COLUMN "parent_disposisi_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "surat_keluar" ADD COLUMN IF NOT EXISTS "catatan_reviu_at" timestamp;--> statement-breakpoint
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;