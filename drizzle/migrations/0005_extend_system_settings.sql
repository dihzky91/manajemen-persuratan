ALTER TABLE "system_settings" ADD COLUMN "default_disposisi_deadline_days" integer DEFAULT 7 NOT NULL;--> statement-breakpoint
ALTER TABLE "system_settings" ADD COLUMN "notification_email_enabled" boolean DEFAULT true NOT NULL;
