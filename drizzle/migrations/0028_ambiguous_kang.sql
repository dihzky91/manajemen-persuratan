CREATE TABLE "class_excluded_dates" (
	"id" text PRIMARY KEY NOT NULL,
	"kelas_id" text NOT NULL,
	"date" date NOT NULL,
	"reason" varchar(200)
);
--> statement-breakpoint
CREATE TABLE "class_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"kelas_id" text NOT NULL,
	"session_number" integer,
	"is_exam_day" boolean DEFAULT false NOT NULL,
	"exam_subjects" text[],
	"scheduled_date" date NOT NULL,
	"time_slot_start" varchar(5) NOT NULL,
	"time_slot_end" varchar(5) NOT NULL,
	"materi_name" varchar(200),
	"status" varchar(20) DEFAULT 'scheduled' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "class_types" (
	"id" text PRIMARY KEY NOT NULL,
	"code" varchar(30) NOT NULL,
	"name" varchar(100) NOT NULL,
	"active_days" varchar(100) NOT NULL,
	"slot1_start" varchar(5) NOT NULL,
	"slot1_end" varchar(5) NOT NULL,
	"slot2_start" varchar(5) NOT NULL,
	"slot2_end" varchar(5) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "class_types_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "curriculum_exam_points" (
	"id" text PRIMARY KEY NOT NULL,
	"program_id" text NOT NULL,
	"after_session_number" integer NOT NULL,
	"is_mixed_day" boolean DEFAULT false NOT NULL,
	"exam_slot_count" integer NOT NULL,
	"exam_subjects" text[] NOT NULL,
	"has_exam" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "curriculum_template" (
	"id" text PRIMARY KEY NOT NULL,
	"program_id" text NOT NULL,
	"session_number" integer NOT NULL,
	"materi_block" varchar(100) NOT NULL,
	"materi_name" varchar(200) NOT NULL,
	"slot" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kelas_pelatihan" (
	"id" text PRIMARY KEY NOT NULL,
	"nama_kelas" varchar(200) NOT NULL,
	"program_id" text NOT NULL,
	"class_type_id" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"lokasi" varchar(300),
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "national_holidays" (
	"id" text PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"name" varchar(200) NOT NULL,
	"year" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "programs" (
	"id" text PRIMARY KEY NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(100) NOT NULL,
	"total_sessions" integer NOT NULL,
	"total_meetings" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "programs_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "class_excluded_dates" ADD CONSTRAINT "class_excluded_dates_kelas_id_kelas_pelatihan_id_fk" FOREIGN KEY ("kelas_id") REFERENCES "public"."kelas_pelatihan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_sessions" ADD CONSTRAINT "class_sessions_kelas_id_kelas_pelatihan_id_fk" FOREIGN KEY ("kelas_id") REFERENCES "public"."kelas_pelatihan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curriculum_exam_points" ADD CONSTRAINT "curriculum_exam_points_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curriculum_template" ADD CONSTRAINT "curriculum_template_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kelas_pelatihan" ADD CONSTRAINT "kelas_pelatihan_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kelas_pelatihan" ADD CONSTRAINT "kelas_pelatihan_class_type_id_class_types_id_fk" FOREIGN KEY ("class_type_id") REFERENCES "public"."class_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_kelas_excluded_date" ON "class_excluded_dates" USING btree ("kelas_id","date");--> statement-breakpoint
CREATE INDEX "cs_kelas_date" ON "class_sessions" USING btree ("kelas_id","scheduled_date");--> statement-breakpoint
CREATE INDEX "cep_program_session" ON "curriculum_exam_points" USING btree ("program_id","after_session_number");--> statement-breakpoint
CREATE INDEX "ct_program_session" ON "curriculum_template" USING btree ("program_id","session_number");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_holiday_date" ON "national_holidays" USING btree ("date");--> statement-breakpoint
CREATE INDEX "holiday_year_idx" ON "national_holidays" USING btree ("year");