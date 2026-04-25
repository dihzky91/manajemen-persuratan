CREATE TYPE "public"."kategori_kegiatan" AS ENUM('Workshop', 'Brevet AB', 'Brevet C', 'BFA', 'Lainnya');--> statement-breakpoint
CREATE TABLE "event_signatories" (
	"event_id" integer NOT NULL,
	"signatory_id" integer NOT NULL,
	"urutan" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "event_signatories_event_id_signatory_id_pk" PRIMARY KEY("event_id","signatory_id")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"nama_kegiatan" varchar(255) NOT NULL,
	"kategori" "kategori_kegiatan" DEFAULT 'Workshop' NOT NULL,
	"tanggal_mulai" date NOT NULL,
	"tanggal_selesai" date NOT NULL,
	"lokasi" varchar(255),
	"skp" varchar(50),
	"keterangan" text,
	"created_by" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"no_sertifikat" varchar(100) NOT NULL,
	"nama" varchar(255) NOT NULL,
	"role" varchar(50) DEFAULT 'Peserta' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "participants_no_sertifikat_unique" UNIQUE("no_sertifikat")
);
--> statement-breakpoint
CREATE TABLE "signatories" (
	"id" serial PRIMARY KEY NOT NULL,
	"nama" varchar(255) NOT NULL,
	"jabatan" varchar(255),
	"pejabat_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "event_signatories" ADD CONSTRAINT "event_signatories_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_signatories" ADD CONSTRAINT "event_signatories_signatory_id_signatories_id_fk" FOREIGN KEY ("signatory_id") REFERENCES "public"."signatories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participants" ADD CONSTRAINT "participants_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signatories" ADD CONSTRAINT "signatories_pejabat_id_pejabat_penandatangan_id_fk" FOREIGN KEY ("pejabat_id") REFERENCES "public"."pejabat_penandatangan"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "participants_event_id_idx" ON "participants" USING btree ("event_id");
