CREATE TYPE "public"."certificate_batch_status" AS ENUM('active', 'revised', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."certificate_item_status" AS ENUM('active', 'cancelled');--> statement-breakpoint
CREATE TABLE "certificate_batches" (
	"id" text PRIMARY KEY NOT NULL,
	"program_id" text NOT NULL,
	"class_type_id" text NOT NULL,
	"angkatan" integer NOT NULL,
	"quantity_requested" integer NOT NULL,
	"first_certificate_number" varchar(50) NOT NULL,
	"last_certificate_number" varchar(50) NOT NULL,
	"status" "certificate_batch_status" DEFAULT 'active' NOT NULL,
	"notes" text,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "certificate_class_types" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"code" varchar(2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "certificate_class_types_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "certificate_items" (
	"id" text PRIMARY KEY NOT NULL,
	"batch_id" text NOT NULL,
	"full_number" varchar(50) NOT NULL,
	"angkatan" integer NOT NULL,
	"class_type_code" varchar(2) NOT NULL,
	"serial_number" integer NOT NULL,
	"status" "certificate_item_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "certificate_items_full_number_unique" UNIQUE("full_number")
);
--> statement-breakpoint
CREATE TABLE "certificate_programs" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"code" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "certificate_programs_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "certificate_serial_config" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jadwal_ujian_config" (
	"id" text PRIMARY KEY NOT NULL,
	"jenis" varchar(20) NOT NULL,
	"nilai" varchar(100) NOT NULL,
	"urutan" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "kelas_ujian" ALTER COLUMN "program" SET DATA TYPE varchar(100);--> statement-breakpoint
ALTER TABLE "kelas_ujian" ALTER COLUMN "tipe" SET DATA TYPE varchar(100);--> statement-breakpoint
ALTER TABLE "kelas_ujian" ALTER COLUMN "mode" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "certificate_batches" ADD CONSTRAINT "certificate_batches_program_id_certificate_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."certificate_programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificate_batches" ADD CONSTRAINT "certificate_batches_class_type_id_certificate_class_types_id_fk" FOREIGN KEY ("class_type_id") REFERENCES "public"."certificate_class_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificate_batches" ADD CONSTRAINT "certificate_batches_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificate_items" ADD CONSTRAINT "certificate_items_batch_id_certificate_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."certificate_batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cert_batches_program_idx" ON "certificate_batches" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "cert_batches_angkatan_idx" ON "certificate_batches" USING btree ("angkatan");--> statement-breakpoint
CREATE INDEX "cert_batches_status_idx" ON "certificate_batches" USING btree ("status");--> statement-breakpoint
CREATE INDEX "cert_items_batch_idx" ON "certificate_items" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "cert_items_serial_idx" ON "certificate_items" USING btree ("serial_number");--> statement-breakpoint
CREATE INDEX "cert_items_status_idx" ON "certificate_items" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_config_jenis_nilai" ON "jadwal_ujian_config" USING btree ("jenis","nilai");--> statement-breakpoint
DROP TYPE "public"."mode_kelas";--> statement-breakpoint
DROP TYPE "public"."program_kelas";--> statement-breakpoint
DROP TYPE "public"."tipe_kelas";