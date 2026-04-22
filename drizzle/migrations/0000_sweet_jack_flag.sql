CREATE TYPE "public"."gender" AS ENUM('Laki-laki', 'Perempuan');--> statement-breakpoint
CREATE TYPE "public"."jenis_pegawai" AS ENUM('Tetap', 'Kontrak', 'Magang', 'Paruh Waktu');--> statement-breakpoint
CREATE TYPE "public"."jenis_surat" AS ENUM('undangan', 'pemberitahuan', 'permohonan', 'keputusan', 'mou', 'balasan', 'edaran', 'keterangan', 'tugas', 'lainnya');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('admin', 'staff', 'pejabat', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."status_disposisi" AS ENUM('belum_dibaca', 'dibaca', 'diproses', 'selesai');--> statement-breakpoint
CREATE TYPE "public"."status_pernikahan" AS ENUM('BM', 'M', 'C', 'D', 'J');--> statement-breakpoint
CREATE TYPE "public"."status_surat_keluar" AS ENUM('draft', 'permohonan_persetujuan', 'reviu', 'pengarsipan', 'selesai', 'dibatalkan');--> statement-breakpoint
CREATE TYPE "public"."status_surat_masuk" AS ENUM('diterima', 'diproses', 'diarsip', 'dibatalkan');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"aksi" varchar(100),
	"entitas_type" varchar(50),
	"entitas_id" varchar(100),
	"detail" jsonb,
	"ip_address" varchar(50),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "disposisi" (
	"id" text PRIMARY KEY NOT NULL,
	"surat_masuk_id" text NOT NULL,
	"dari_user_id" text NOT NULL,
	"kepada_user_id" text NOT NULL,
	"catatan" text,
	"instruksi" text,
	"batas_waktu" date,
	"status" "status_disposisi" DEFAULT 'belum_dibaca',
	"tanggal_disposisi" timestamp DEFAULT now(),
	"tanggal_dibaca" timestamp,
	"tanggal_selesai" timestamp,
	"parent_disposisi_id" text
);
--> statement-breakpoint
CREATE TABLE "divisi" (
	"id" serial PRIMARY KEY NOT NULL,
	"nama" varchar(150) NOT NULL,
	"kode" varchar(20),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "divisi_kode_unique" UNIQUE("kode")
);
--> statement-breakpoint
CREATE TABLE "nomor_surat_counter" (
	"id" serial PRIMARY KEY NOT NULL,
	"tahun" integer NOT NULL,
	"bulan" integer NOT NULL,
	"jenis_surat" "jenis_surat" NOT NULL,
	"counter" integer DEFAULT 0 NOT NULL,
	"prefix" varchar(80),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pegawai_biodata" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"no_ktp" varchar(20),
	"gender" "gender",
	"status_pernikahan" "status_pernikahan",
	"tempat_lahir" varchar(100),
	"tanggal_lahir" date,
	"alamat_tinggal" text,
	"kode_pos" varchar(10),
	"provinsi" varchar(100),
	"kota_kabupaten" varchar(100),
	"alamat_ktp" text,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "pegawai_biodata_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "pegawai_kelengkapan" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"foto_url" text,
	"ktp_url" text,
	"npwp_url" text,
	"bpjs_url" text,
	"ijazah_url" text,
	"dokumen_lain_url" text,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "pegawai_kelengkapan_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "pegawai_keluarga" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"hubungan" varchar(50),
	"nama_anggota" varchar(200) NOT NULL,
	"tempat_lahir" varchar(100),
	"tanggal_lahir" date,
	"pekerjaan" varchar(150),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pegawai_kesehatan" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"golongan_darah" varchar(5),
	"tinggi_badan" integer,
	"berat_badan" integer,
	"riwayat_penyakit" text,
	"alergi" text,
	"catatan_kesehatan" text,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "pegawai_kesehatan_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "pegawai_pendidikan" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"jenjang" varchar(20),
	"nama_institusi" varchar(200),
	"jurusan" varchar(150),
	"tahun_masuk" integer,
	"tahun_lulus" integer,
	"ijazah_url" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pegawai_pernyataan_integritas" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"tanggal_pernyataan" date,
	"file_url" text,
	"status_tanda_tangan" boolean DEFAULT false,
	"catatan" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "pegawai_pernyataan_integritas_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "pegawai_riwayat_pekerjaan" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"nama_perusahaan" varchar(200),
	"jabatan" varchar(150),
	"tanggal_mulai" date,
	"tanggal_selesai" date,
	"keterangan" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pejabat_penandatangan" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"nama_jabatan" varchar(200) NOT NULL,
	"wilayah" varchar(100),
	"ttd_url" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "surat_keluar" (
	"id" text PRIMARY KEY NOT NULL,
	"nomor_surat" varchar(200),
	"perihal" text NOT NULL,
	"tujuan" varchar(300) NOT NULL,
	"tujuan_alamat" text,
	"tanggal_surat" date NOT NULL,
	"jenis_surat" "jenis_surat" NOT NULL,
	"isi_singkat" text,
	"status" "status_surat_keluar" DEFAULT 'draft',
	"file_draft_url" text,
	"file_final_url" text,
	"lampiran_url" text,
	"qr_code_url" text,
	"pejabat_id" integer,
	"dibuat_oleh" text,
	"divisi_id" integer,
	"disetujui_oleh" text,
	"tanggal_disetujui" timestamp,
	"catatan_reviu" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "surat_keluar_nomor_surat_unique" UNIQUE("nomor_surat")
);
--> statement-breakpoint
CREATE TABLE "surat_keputusan" (
	"id" text PRIMARY KEY NOT NULL,
	"nomor_sk" varchar(200) NOT NULL,
	"perihal" text NOT NULL,
	"tentang" text NOT NULL,
	"tanggal_sk" date NOT NULL,
	"tanggal_berlaku" date,
	"tanggal_berakhir" date,
	"pejabat_id" integer,
	"file_url" text,
	"qr_code_url" text,
	"dibuat_oleh" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "surat_keputusan_nomor_sk_unique" UNIQUE("nomor_sk")
);
--> statement-breakpoint
CREATE TABLE "surat_masuk" (
	"id" text PRIMARY KEY NOT NULL,
	"nomor_agenda" varchar(50),
	"nomor_surat_asal" varchar(200),
	"perihal" text NOT NULL,
	"pengirim" varchar(200) NOT NULL,
	"pengirim_alamat" text,
	"tanggal_surat" date NOT NULL,
	"tanggal_diterima" date NOT NULL,
	"jenis_surat" "jenis_surat" NOT NULL,
	"status" "status_surat_masuk" DEFAULT 'diterima',
	"isi_singkat" text,
	"file_url" text,
	"dicatat_oleh" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "surat_mou" (
	"id" text PRIMARY KEY NOT NULL,
	"nomor_mou" varchar(200) NOT NULL,
	"perihal" text NOT NULL,
	"pihak_kedua" varchar(200) NOT NULL,
	"pihak_kedua_alamat" text,
	"tanggal_mou" date NOT NULL,
	"tanggal_berlaku" date,
	"tanggal_berakhir" date,
	"nilai_kerjasama" text,
	"file_url" text,
	"qr_code_url" text,
	"pejabat_id" integer,
	"dibuat_oleh" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "surat_mou_nomor_mou_unique" UNIQUE("nomor_mou")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"nama_lengkap" varchar(200) NOT NULL,
	"email" varchar(150) NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"email_pribadi" varchar(150),
	"no_hp" varchar(20),
	"role" "role" DEFAULT 'staff',
	"divisi_id" integer,
	"jabatan" varchar(150),
	"level_jabatan" varchar(50),
	"jenis_pegawai" "jenis_pegawai" DEFAULT 'Tetap',
	"tanggal_masuk" date,
	"avatar_url" text,
	"qr_contact_url" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disposisi" ADD CONSTRAINT "disposisi_surat_masuk_id_surat_masuk_id_fk" FOREIGN KEY ("surat_masuk_id") REFERENCES "public"."surat_masuk"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disposisi" ADD CONSTRAINT "disposisi_dari_user_id_users_id_fk" FOREIGN KEY ("dari_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disposisi" ADD CONSTRAINT "disposisi_kepada_user_id_users_id_fk" FOREIGN KEY ("kepada_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pegawai_biodata" ADD CONSTRAINT "pegawai_biodata_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pegawai_kelengkapan" ADD CONSTRAINT "pegawai_kelengkapan_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pegawai_keluarga" ADD CONSTRAINT "pegawai_keluarga_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pegawai_kesehatan" ADD CONSTRAINT "pegawai_kesehatan_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pegawai_pendidikan" ADD CONSTRAINT "pegawai_pendidikan_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pegawai_pernyataan_integritas" ADD CONSTRAINT "pegawai_pernyataan_integritas_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pegawai_riwayat_pekerjaan" ADD CONSTRAINT "pegawai_riwayat_pekerjaan_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pejabat_penandatangan" ADD CONSTRAINT "pejabat_penandatangan_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "surat_keluar" ADD CONSTRAINT "surat_keluar_pejabat_id_pejabat_penandatangan_id_fk" FOREIGN KEY ("pejabat_id") REFERENCES "public"."pejabat_penandatangan"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "surat_keluar" ADD CONSTRAINT "surat_keluar_dibuat_oleh_users_id_fk" FOREIGN KEY ("dibuat_oleh") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "surat_keluar" ADD CONSTRAINT "surat_keluar_divisi_id_divisi_id_fk" FOREIGN KEY ("divisi_id") REFERENCES "public"."divisi"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "surat_keluar" ADD CONSTRAINT "surat_keluar_disetujui_oleh_users_id_fk" FOREIGN KEY ("disetujui_oleh") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "surat_keputusan" ADD CONSTRAINT "surat_keputusan_pejabat_id_pejabat_penandatangan_id_fk" FOREIGN KEY ("pejabat_id") REFERENCES "public"."pejabat_penandatangan"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "surat_keputusan" ADD CONSTRAINT "surat_keputusan_dibuat_oleh_users_id_fk" FOREIGN KEY ("dibuat_oleh") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "surat_masuk" ADD CONSTRAINT "surat_masuk_dicatat_oleh_users_id_fk" FOREIGN KEY ("dicatat_oleh") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "surat_mou" ADD CONSTRAINT "surat_mou_pejabat_id_pejabat_penandatangan_id_fk" FOREIGN KEY ("pejabat_id") REFERENCES "public"."pejabat_penandatangan"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "surat_mou" ADD CONSTRAINT "surat_mou_dibuat_oleh_users_id_fk" FOREIGN KEY ("dibuat_oleh") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_divisi_id_divisi_id_fk" FOREIGN KEY ("divisi_id") REFERENCES "public"."divisi"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "nomor_surat_counter_period_uniq" ON "nomor_surat_counter" USING btree ("tahun","bulan","jenis_surat");