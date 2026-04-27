CREATE TABLE "admin_jaga" (
	"id" text PRIMARY KEY NOT NULL,
	"ujian_id" text NOT NULL,
	"pengawas_id" text NOT NULL,
	"catatan" text,
	"konflik" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uniq_admin_jaga_ujian_pengawas" UNIQUE("ujian_id","pengawas_id")
);
--> statement-breakpoint
ALTER TABLE "admin_jaga" ADD CONSTRAINT "admin_jaga_ujian_id_jadwal_ujian_id_fk" FOREIGN KEY ("ujian_id") REFERENCES "public"."jadwal_ujian"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "admin_jaga" ADD CONSTRAINT "admin_jaga_pengawas_id_pengawas_id_fk" FOREIGN KEY ("pengawas_id") REFERENCES "public"."pengawas"("id") ON DELETE cascade ON UPDATE no action;
