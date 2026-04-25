CREATE TYPE "public"."calendar_event_type" AS ENUM('surat_deadline', 'disposisi_deadline', 'rapat', 'reminder', 'other');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('disposisi_baru', 'disposisi_deadline', 'surat_keluar_approval', 'surat_keluar_revisi', 'surat_keluar_selesai', 'surat_masuk_baru', 'system');--> statement-breakpoint
CREATE TABLE "calendar_events" (
	"id" text PRIMARY KEY NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"event_type" "calendar_event_type" NOT NULL,
	"entitas_type" varchar(50),
	"entitas_id" varchar(100),
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"all_day" boolean DEFAULT false NOT NULL,
	"user_id" text,
	"is_public" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" varchar(200) NOT NULL,
	"message" text NOT NULL,
	"entitas_type" varchar(50),
	"entitas_id" varchar(100),
	"is_read" boolean DEFAULT false NOT NULL,
	"is_email_sent" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"read_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;