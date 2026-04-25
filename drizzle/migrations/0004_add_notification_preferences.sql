CREATE TABLE "notification_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"in_app_disposisi_baru" boolean DEFAULT true NOT NULL,
	"in_app_disposisi_deadline" boolean DEFAULT true NOT NULL,
	"in_app_surat_keluar_approval" boolean DEFAULT true NOT NULL,
	"in_app_surat_keluar_revisi" boolean DEFAULT true NOT NULL,
	"in_app_surat_keluar_selesai" boolean DEFAULT true NOT NULL,
	"in_app_surat_masuk_baru" boolean DEFAULT true NOT NULL,
	"email_disposisi_baru" boolean DEFAULT true NOT NULL,
	"email_disposisi_deadline" boolean DEFAULT true NOT NULL,
	"email_surat_keluar_approval" boolean DEFAULT false NOT NULL,
	"email_surat_keluar_revisi" boolean DEFAULT false NOT NULL,
	"email_surat_keluar_selesai" boolean DEFAULT false NOT NULL,
	"email_surat_masuk_baru" boolean DEFAULT false NOT NULL,
	"deadline_reminder_days" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "notification_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
