CREATE TYPE "public"."class_session_status" AS ENUM('scheduled', 'cancelled', 'makeup', 'completed');--> statement-breakpoint
CREATE TABLE "absensi_pelatihan" (
	"id" text PRIMARY KEY NOT NULL,
	"peserta_id" text NOT NULL,
	"session_id" text NOT NULL,
	"hadir" boolean NOT NULL,
	"catatan" text,
	"input_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "absensi_ujian" (
	"id" text PRIMARY KEY NOT NULL,
	"peserta_id" text NOT NULL,
	"jadwal_ujian_id" text NOT NULL,
	"status" varchar(20) DEFAULT 'hadir' NOT NULL,
	"catatan" text,
	"input_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "honorarium_audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"batch_id" text NOT NULL,
	"actor_id" text,
	"action" varchar(60) NOT NULL,
	"payload" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "honorarium_batches" (
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
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "honorarium_batches_document_number_unique" UNIQUE("document_number")
);
--> statement-breakpoint
CREATE TABLE "honorarium_deductions" (
	"id" text PRIMARY KEY NOT NULL,
	"batch_id" text NOT NULL,
	"instructor_id" text NOT NULL,
	"deduction_type" varchar(40) NOT NULL,
	"description" varchar(200) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "honorarium_items" (
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
CREATE TABLE "honorarium_rate_rules" (
	"id" text PRIMARY KEY NOT NULL,
	"program_id" text NOT NULL,
	"level" varchar(20) NOT NULL,
	"mode" varchar(10) NOT NULL,
	"honor_per_session" numeric(12, 2) NOT NULL,
	"transport_amount" numeric(12, 2) NOT NULL,
	"effective_from" date NOT NULL,
	"effective_to" date,
	"location_scope" varchar(200) DEFAULT '' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" varchar(300),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "instructor_rates" (
	"id" text PRIMARY KEY NOT NULL,
	"instructor_id" text NOT NULL,
	"program_id" text NOT NULL,
	"materi_block" varchar(100) NOT NULL,
	"mode" varchar(10) DEFAULT 'offline' NOT NULL,
	"rate_amount" numeric(12, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "makeup_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"original_session_id" text NOT NULL,
	"kelas_id" text NOT NULL,
	"session_number" integer,
	"is_exam_day" boolean DEFAULT false NOT NULL,
	"exam_subjects" text[],
	"materi_name" varchar(200),
	"scheduled_date" date NOT NULL,
	"time_slot_start" varchar(5) NOT NULL,
	"time_slot_end" varchar(5) NOT NULL,
	"status" "class_session_status" DEFAULT 'scheduled' NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nilai_ujian" (
	"id" text PRIMARY KEY NOT NULL,
	"peserta_id" text NOT NULL,
	"jadwal_ujian_id" text NOT NULL,
	"mata_pelajaran" varchar(100) NOT NULL,
	"nilai" varchar(2) NOT NULL,
	"is_perbaikan" boolean DEFAULT false NOT NULL,
	"perbaikan_dari_id" text,
	"input_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "peserta_kelas" (
	"id" text PRIMARY KEY NOT NULL,
	"kelas_id" text NOT NULL,
	"nama" varchar(200) NOT NULL,
	"nomor_peserta" varchar(50),
	"email" varchar(150),
	"telepon" varchar(30),
	"catatan" text,
	"status_enrollment" varchar(20) DEFAULT 'aktif' NOT NULL,
	"status_akhir" varchar(30),
	"alasan_status" varchar(50),
	"status_computed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ujian_susulan_peserta" (
	"id" text PRIMARY KEY NOT NULL,
	"peserta_id" text NOT NULL,
	"jadwal_ujian_original_id" text NOT NULL,
	"tanggal_usulan" date,
	"tanggal_disepakati" date,
	"jam_mulai" varchar(5),
	"jam_selesai" varchar(5),
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"alasan_permohonan" text,
	"catatan_admin" text,
	"approved_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "class_sessions" ALTER COLUMN "status" SET DEFAULT 'scheduled'::"public"."class_session_status";--> statement-breakpoint
ALTER TABLE "class_sessions" ALTER COLUMN "status" SET DATA TYPE "public"."class_session_status" USING "status"::"public"."class_session_status";--> statement-breakpoint
ALTER TABLE "class_sessions" ADD COLUMN "cancelled_at" timestamp;--> statement-breakpoint
ALTER TABLE "class_sessions" ADD COLUMN "cancelled_by" text;--> statement-breakpoint
ALTER TABLE "class_sessions" ADD COLUMN "cancellation_reason" varchar(300);--> statement-breakpoint
ALTER TABLE "instructor_expertise" ADD COLUMN "level" varchar(20) DEFAULT 'middle' NOT NULL;--> statement-breakpoint
ALTER TABLE "kelas_ujian" ADD COLUMN "kelas_pelatihan_id" text;--> statement-breakpoint
ALTER TABLE "session_assignments" ADD COLUMN "availability_status" varchar(30) DEFAULT 'pending_wa_confirmation' NOT NULL;--> statement-breakpoint
ALTER TABLE "session_assignments" ADD COLUMN "availability_checked_at" timestamp;--> statement-breakpoint
ALTER TABLE "session_assignments" ADD COLUMN "availability_note" varchar(300);--> statement-breakpoint
ALTER TABLE "absensi_pelatihan" ADD CONSTRAINT "absensi_pelatihan_peserta_id_peserta_kelas_id_fk" FOREIGN KEY ("peserta_id") REFERENCES "public"."peserta_kelas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "absensi_pelatihan" ADD CONSTRAINT "absensi_pelatihan_session_id_class_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."class_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "absensi_pelatihan" ADD CONSTRAINT "absensi_pelatihan_input_by_users_id_fk" FOREIGN KEY ("input_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "absensi_ujian" ADD CONSTRAINT "absensi_ujian_peserta_id_peserta_kelas_id_fk" FOREIGN KEY ("peserta_id") REFERENCES "public"."peserta_kelas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "absensi_ujian" ADD CONSTRAINT "absensi_ujian_jadwal_ujian_id_jadwal_ujian_id_fk" FOREIGN KEY ("jadwal_ujian_id") REFERENCES "public"."jadwal_ujian"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "absensi_ujian" ADD CONSTRAINT "absensi_ujian_input_by_users_id_fk" FOREIGN KEY ("input_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "honorarium_audit_logs" ADD CONSTRAINT "honorarium_audit_logs_batch_id_honorarium_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."honorarium_batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "honorarium_audit_logs" ADD CONSTRAINT "honorarium_audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "honorarium_batches" ADD CONSTRAINT "honorarium_batches_generated_by_users_id_fk" FOREIGN KEY ("generated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "honorarium_batches" ADD CONSTRAINT "honorarium_batches_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "honorarium_batches" ADD CONSTRAINT "honorarium_batches_paid_by_users_id_fk" FOREIGN KEY ("paid_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "honorarium_deductions" ADD CONSTRAINT "honorarium_deductions_batch_id_honorarium_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."honorarium_batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "honorarium_deductions" ADD CONSTRAINT "honorarium_deductions_instructor_id_instructors_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."instructors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "honorarium_items" ADD CONSTRAINT "honorarium_items_batch_id_honorarium_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."honorarium_batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "honorarium_items" ADD CONSTRAINT "honorarium_items_assignment_id_session_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."session_assignments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "honorarium_items" ADD CONSTRAINT "honorarium_items_session_id_class_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."class_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "honorarium_items" ADD CONSTRAINT "honorarium_items_kelas_id_kelas_pelatihan_id_fk" FOREIGN KEY ("kelas_id") REFERENCES "public"."kelas_pelatihan"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "honorarium_items" ADD CONSTRAINT "honorarium_items_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "honorarium_items" ADD CONSTRAINT "honorarium_items_paid_instructor_id_instructors_id_fk" FOREIGN KEY ("paid_instructor_id") REFERENCES "public"."instructors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "honorarium_rate_rules" ADD CONSTRAINT "honorarium_rate_rules_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instructor_rates" ADD CONSTRAINT "instructor_rates_instructor_id_instructors_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."instructors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instructor_rates" ADD CONSTRAINT "instructor_rates_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "makeup_sessions" ADD CONSTRAINT "makeup_sessions_original_session_id_class_sessions_id_fk" FOREIGN KEY ("original_session_id") REFERENCES "public"."class_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "makeup_sessions" ADD CONSTRAINT "makeup_sessions_kelas_id_kelas_pelatihan_id_fk" FOREIGN KEY ("kelas_id") REFERENCES "public"."kelas_pelatihan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "makeup_sessions" ADD CONSTRAINT "makeup_sessions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nilai_ujian" ADD CONSTRAINT "nilai_ujian_peserta_id_peserta_kelas_id_fk" FOREIGN KEY ("peserta_id") REFERENCES "public"."peserta_kelas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nilai_ujian" ADD CONSTRAINT "nilai_ujian_jadwal_ujian_id_jadwal_ujian_id_fk" FOREIGN KEY ("jadwal_ujian_id") REFERENCES "public"."jadwal_ujian"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nilai_ujian" ADD CONSTRAINT "nilai_ujian_input_by_users_id_fk" FOREIGN KEY ("input_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peserta_kelas" ADD CONSTRAINT "peserta_kelas_kelas_id_kelas_pelatihan_id_fk" FOREIGN KEY ("kelas_id") REFERENCES "public"."kelas_pelatihan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ujian_susulan_peserta" ADD CONSTRAINT "ujian_susulan_peserta_peserta_id_peserta_kelas_id_fk" FOREIGN KEY ("peserta_id") REFERENCES "public"."peserta_kelas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ujian_susulan_peserta" ADD CONSTRAINT "ujian_susulan_peserta_jadwal_ujian_original_id_jadwal_ujian_id_fk" FOREIGN KEY ("jadwal_ujian_original_id") REFERENCES "public"."jadwal_ujian"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ujian_susulan_peserta" ADD CONSTRAINT "ujian_susulan_peserta_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_absensi_peserta_session" ON "absensi_pelatihan" USING btree ("peserta_id","session_id");--> statement-breakpoint
CREATE INDEX "absensi_pelatihan_peserta_idx" ON "absensi_pelatihan" USING btree ("peserta_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_absensi_ujian_peserta" ON "absensi_ujian" USING btree ("peserta_id","jadwal_ujian_id");--> statement-breakpoint
CREATE INDEX "absensi_ujian_peserta_idx" ON "absensi_ujian" USING btree ("peserta_id");--> statement-breakpoint
CREATE INDEX "hal_batch_idx" ON "honorarium_audit_logs" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "hal_action_idx" ON "honorarium_audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "hb_period_idx" ON "honorarium_batches" USING btree ("period_start","period_end");--> statement-breakpoint
CREATE INDEX "hb_status_idx" ON "honorarium_batches" USING btree ("status");--> statement-breakpoint
CREATE INDEX "hd_batch_idx" ON "honorarium_deductions" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "hd_instructor_idx" ON "honorarium_deductions" USING btree ("instructor_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_honorarium_batch_assignment" ON "honorarium_items" USING btree ("batch_id","assignment_id");--> statement-breakpoint
CREATE INDEX "hi_batch_idx" ON "honorarium_items" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "hi_instructor_idx" ON "honorarium_items" USING btree ("paid_instructor_id");--> statement-breakpoint
CREATE INDEX "hi_date_idx" ON "honorarium_items" USING btree ("scheduled_date");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_honorarium_rate_rule" ON "honorarium_rate_rules" USING btree ("program_id","level","mode","effective_from","location_scope");--> statement-breakpoint
CREATE INDEX "hrr_program_idx" ON "honorarium_rate_rules" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "hrr_effective_idx" ON "honorarium_rate_rules" USING btree ("effective_from","effective_to");--> statement-breakpoint
CREATE INDEX "hrr_active_idx" ON "honorarium_rate_rules" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_instructor_rate" ON "instructor_rates" USING btree ("instructor_id","program_id","materi_block","mode");--> statement-breakpoint
CREATE INDEX "ir_instructor_idx" ON "instructor_rates" USING btree ("instructor_id");--> statement-breakpoint
CREATE INDEX "ir_program_idx" ON "instructor_rates" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "ms_kelas_date" ON "makeup_sessions" USING btree ("kelas_id","scheduled_date");--> statement-breakpoint
CREATE INDEX "ms_original_session" ON "makeup_sessions" USING btree ("original_session_id");--> statement-breakpoint
CREATE INDEX "ms_status_idx" ON "makeup_sessions" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_nilai_peserta_ujian_mapel" ON "nilai_ujian" USING btree ("peserta_id","jadwal_ujian_id","mata_pelajaran","is_perbaikan");--> statement-breakpoint
CREATE INDEX "nilai_ujian_peserta_idx" ON "nilai_ujian" USING btree ("peserta_id");--> statement-breakpoint
CREATE INDEX "nilai_ujian_jadwal_idx" ON "nilai_ujian" USING btree ("jadwal_ujian_id");--> statement-breakpoint
CREATE INDEX "pk_kelas_idx" ON "peserta_kelas" USING btree ("kelas_id");--> statement-breakpoint
CREATE INDEX "pk_status_akhir_idx" ON "peserta_kelas" USING btree ("status_akhir");--> statement-breakpoint
CREATE INDEX "usp_peserta_idx" ON "ujian_susulan_peserta" USING btree ("peserta_id");--> statement-breakpoint
CREATE INDEX "usp_original_jadwal_idx" ON "ujian_susulan_peserta" USING btree ("jadwal_ujian_original_id");--> statement-breakpoint
CREATE INDEX "usp_status_idx" ON "ujian_susulan_peserta" USING btree ("status");--> statement-breakpoint
ALTER TABLE "class_sessions" ADD CONSTRAINT "class_sessions_cancelled_by_users_id_fk" FOREIGN KEY ("cancelled_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kelas_ujian" ADD CONSTRAINT "kelas_ujian_kelas_pelatihan_id_kelas_pelatihan_id_fk" FOREIGN KEY ("kelas_pelatihan_id") REFERENCES "public"."kelas_pelatihan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cs_status_idx" ON "class_sessions" USING btree ("status");