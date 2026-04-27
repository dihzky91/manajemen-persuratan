CREATE TABLE "materi_ujian" (
	"id" text PRIMARY KEY NOT NULL,
	"nama" varchar(200) NOT NULL,
	"program" varchar(100) NOT NULL,
	"urutan" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "jadwal_ujian" ADD COLUMN "mata_pelajaran_arr" text[];
--> statement-breakpoint
UPDATE "jadwal_ujian" SET "mata_pelajaran_arr" = ARRAY["mata_pelajaran"];
--> statement-breakpoint
ALTER TABLE "jadwal_ujian" DROP COLUMN "mata_pelajaran";
--> statement-breakpoint
ALTER TABLE "jadwal_ujian" RENAME COLUMN "mata_pelajaran_arr" TO "mata_pelajaran";
--> statement-breakpoint
ALTER TABLE "jadwal_ujian" ALTER COLUMN "mata_pelajaran" SET NOT NULL;
