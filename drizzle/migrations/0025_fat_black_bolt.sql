CREATE TYPE "public"."user_invitation_status" AS ENUM('pending', 'accepted', 'expired', 'cancelled');--> statement-breakpoint
ALTER TYPE "public"."calendar_event_type" ADD VALUE 'ujian';--> statement-breakpoint
ALTER TYPE "public"."calendar_event_type" ADD VALUE 'ujian_pengawas';--> statement-breakpoint
ALTER TYPE "public"."calendar_event_type" ADD VALUE 'admin_jaga';--> statement-breakpoint
CREATE TABLE "admin_jaga" (
	"id" text PRIMARY KEY NOT NULL,
	"ujian_id" text NOT NULL,
	"pengawas_id" text NOT NULL,
	"catatan" text,
	"konflik" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "announcement_reads" (
	"announcement_id" text NOT NULL,
	"user_id" text NOT NULL,
	"read_at" timestamp DEFAULT now() NOT NULL,
	"acknowledged_at" timestamp,
	CONSTRAINT "announcement_reads_pk" PRIMARY KEY("announcement_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" text PRIMARY KEY NOT NULL,
	"title" varchar(220) NOT NULL,
	"description" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"audience" jsonb NOT NULL,
	"attachments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"requires_ack" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'published' NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jadwal_admin_jaga" (
	"id" text PRIMARY KEY NOT NULL,
	"kelas_id" text NOT NULL,
	"tanggal" date NOT NULL,
	"jam_mulai" varchar(5) DEFAULT '17:15' NOT NULL,
	"jam_selesai" varchar(5) DEFAULT '21:30' NOT NULL,
	"materi" varchar(300) NOT NULL,
	"pengawas_id" text NOT NULL,
	"catatan" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "materi_ujian" (
	"id" text PRIMARY KEY NOT NULL,
	"nama" varchar(200) NOT NULL,
	"program" varchar(100) NOT NULL,
	"urutan" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_capabilities" (
	"role_id" integer NOT NULL,
	"capability" varchar(100) NOT NULL,
	CONSTRAINT "role_capabilities_pk" PRIMARY KEY("role_id","capability")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"nama" varchar(150) NOT NULL,
	"kode" varchar(50) NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "roles_kode_unique" UNIQUE("kode")
);
--> statement-breakpoint
CREATE TABLE "user_invitations" (
	"id" text PRIMARY KEY NOT NULL,
	"email" varchar(150) NOT NULL,
	"nama_lengkap" varchar(200) NOT NULL,
	"role" "role" DEFAULT 'staff' NOT NULL,
	"role_id" integer,
	"divisi_id" integer,
	"jabatan" varchar(150),
	"token" text NOT NULL,
	"status" "user_invitation_status" DEFAULT 'pending' NOT NULL,
	"expired_at" timestamp NOT NULL,
	"used_at" timestamp,
	"invited_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "jadwal_ujian" ALTER COLUMN "mata_pelajaran" SET DATA TYPE text[];--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_super_admin" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role_id" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "activated_at" timestamp;--> statement-breakpoint
ALTER TABLE "admin_jaga" ADD CONSTRAINT "admin_jaga_ujian_id_jadwal_ujian_id_fk" FOREIGN KEY ("ujian_id") REFERENCES "public"."jadwal_ujian"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_jaga" ADD CONSTRAINT "admin_jaga_pengawas_id_pengawas_id_fk" FOREIGN KEY ("pengawas_id") REFERENCES "public"."pengawas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement_reads" ADD CONSTRAINT "announcement_reads_announcement_id_announcements_id_fk" FOREIGN KEY ("announcement_id") REFERENCES "public"."announcements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement_reads" ADD CONSTRAINT "announcement_reads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jadwal_admin_jaga" ADD CONSTRAINT "jadwal_admin_jaga_kelas_id_kelas_ujian_id_fk" FOREIGN KEY ("kelas_id") REFERENCES "public"."kelas_ujian"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jadwal_admin_jaga" ADD CONSTRAINT "jadwal_admin_jaga_pengawas_id_pengawas_id_fk" FOREIGN KEY ("pengawas_id") REFERENCES "public"."pengawas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_capabilities" ADD CONSTRAINT "role_capabilities_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_invitations" ADD CONSTRAINT "user_invitations_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_invitations" ADD CONSTRAINT "user_invitations_divisi_id_divisi_id_fk" FOREIGN KEY ("divisi_id") REFERENCES "public"."divisi"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_invitations" ADD CONSTRAINT "user_invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_admin_jaga_ujian_pengawas" ON "admin_jaga" USING btree ("ujian_id","pengawas_id");--> statement-breakpoint
CREATE INDEX "announcement_reads_announcement_idx" ON "announcement_reads" USING btree ("announcement_id");--> statement-breakpoint
CREATE INDEX "announcement_reads_user_idx" ON "announcement_reads" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "role_capabilities_capability_idx" ON "role_capabilities" USING btree ("capability");--> statement-breakpoint
CREATE INDEX "user_invitations_email_idx" ON "user_invitations" USING btree ("email");--> statement-breakpoint
CREATE INDEX "user_invitations_token_idx" ON "user_invitations" USING btree ("token");--> statement-breakpoint
CREATE INDEX "user_invitations_status_idx" ON "user_invitations" USING btree ("status");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;