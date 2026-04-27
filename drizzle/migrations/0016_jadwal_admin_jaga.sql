CREATE TABLE "jadwal_admin_jaga" (
	"id" text PRIMARY KEY NOT NULL,
	"kelas_id" text NOT NULL,
	"tanggal" date NOT NULL,
	"materi" varchar(300) NOT NULL,
	"pengawas_id" text NOT NULL,
	"catatan" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "jadwal_admin_jaga" ADD CONSTRAINT "jadwal_admin_jaga_kelas_id_kelas_ujian_id_fk" FOREIGN KEY ("kelas_id") REFERENCES "public"."kelas_ujian"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "jadwal_admin_jaga" ADD CONSTRAINT "jadwal_admin_jaga_pengawas_id_pengawas_id_fk" FOREIGN KEY ("pengawas_id") REFERENCES "public"."pengawas"("id") ON DELETE cascade ON UPDATE no action;
