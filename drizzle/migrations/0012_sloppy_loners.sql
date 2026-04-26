CREATE TYPE "public"."mode_kelas" AS ENUM('Offline', 'Online');--> statement-breakpoint
CREATE TYPE "public"."program_kelas" AS ENUM('Brevet AB', 'Brevet C', 'BFA', 'Lainnya');--> statement-breakpoint
CREATE TYPE "public"."tipe_kelas" AS ENUM('Reguler Pagi', 'Reguler Siang', 'Reguler Sore', 'Weekend');--> statement-breakpoint
CREATE TABLE "jadwal_ujian" (
	"id" text PRIMARY KEY NOT NULL,
	"kelas_id" text NOT NULL,
	"mata_pelajaran" varchar(200) NOT NULL,
	"tanggal_ujian" date NOT NULL,
	"jam_mulai" varchar(5) NOT NULL,
	"jam_selesai" varchar(5) NOT NULL,
	"catatan" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kelas_ujian" (
	"id" text PRIMARY KEY NOT NULL,
	"nama_kelas" varchar(200) NOT NULL,
	"program" "program_kelas" NOT NULL,
	"tipe" "tipe_kelas" NOT NULL,
	"mode" "mode_kelas" NOT NULL,
	"lokasi" varchar(300),
	"catatan" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pengawas" (
	"id" text PRIMARY KEY NOT NULL,
	"nama" varchar(200) NOT NULL,
	"catatan" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "penugasan_pengawas" (
	"id" text PRIMARY KEY NOT NULL,
	"ujian_id" text NOT NULL,
	"pengawas_id" text NOT NULL,
	"konflik" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "jadwal_ujian" ADD CONSTRAINT "jadwal_ujian_kelas_id_kelas_ujian_id_fk" FOREIGN KEY ("kelas_id") REFERENCES "public"."kelas_ujian"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "penugasan_pengawas" ADD CONSTRAINT "penugasan_pengawas_ujian_id_jadwal_ujian_id_fk" FOREIGN KEY ("ujian_id") REFERENCES "public"."jadwal_ujian"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "penugasan_pengawas" ADD CONSTRAINT "penugasan_pengawas_pengawas_id_pengawas_id_fk" FOREIGN KEY ("pengawas_id") REFERENCES "public"."pengawas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_ujian_pengawas" ON "penugasan_pengawas" USING btree ("ujian_id","pengawas_id");