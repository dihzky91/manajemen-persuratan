import {
  pgTable,
  text,
  timestamp,
  boolean,
  date,
  integer,
  serial,
  pgEnum,
  varchar,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ─── ENUMS ───────────────────────────────────────────────────────────────────

export const roleEnum = pgEnum("role", ["admin", "staff", "pejabat", "viewer"]);

// Status workflow surat keluar (stepper 5 tahap)
export const statusSuratKeluarEnum = pgEnum("status_surat_keluar", [
  "draft",
  "permohonan_persetujuan",
  "reviu",
  "pengarsipan",
  "selesai",
  "dibatalkan",
]);

export const statusSuratMasukEnum = pgEnum("status_surat_masuk", [
  "diterima",
  "diproses",
  "diarsip",
  "dibatalkan",
]);

export const statusDisposisiEnum = pgEnum("status_disposisi", [
  "belum_dibaca",
  "dibaca",
  "diproses",
  "selesai",
]);

export const jenisSuratEnum = pgEnum("jenis_surat", [
  "undangan",
  "pemberitahuan",
  "permohonan",
  "keputusan",
  "mou",
  "balasan",
  "edaran",
  "keterangan",
  "tugas",
  "lainnya",
]);

export const statusPernikahanEnum = pgEnum("status_pernikahan", [
  "BM",
  "M",
  "C",
  "D",
  "J",
]);

export const genderEnum = pgEnum("gender", ["Laki-laki", "Perempuan"]);

export const jenisPegawaiEnum = pgEnum("jenis_pegawai", [
  "Tetap",
  "Kontrak",
  "Magang",
  "Paruh Waktu",
]);

// ─── DIVISI ──────────────────────────────────────────────────────────────────

export const divisi = pgTable("divisi", {
  id: serial("id").primaryKey(),
  nama: varchar("nama", { length: 150 }).notNull(),
  kode: varchar("kode", { length: 20 }).unique(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── USERS (akun login + data dasar pegawai) ─────────────────────────────────

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  // "name" di Better Auth di-mapping ke kolom ini via user.fields.name
  namaLengkap: varchar("nama_lengkap", { length: 200 }).notNull(),
  email: varchar("email", { length: 150 }).unique().notNull(),
  // Wajib ada untuk Better Auth — kita tidak pakai verifikasi email, default true
  emailVerified: boolean("email_verified").notNull().default(false),
  emailPribadi: varchar("email_pribadi", { length: 150 }),
  noHp: varchar("no_hp", { length: 20 }),
  role: roleEnum("role").default("staff"),
  divisiId: integer("divisi_id").references(() => divisi.id),
  jabatan: varchar("jabatan", { length: 150 }),
  levelJabatan: varchar("level_jabatan", { length: 50 }),
  jenisPegawai: jenisPegawaiEnum("jenis_pegawai").default("Tetap"),
  tanggalMasuk: date("tanggal_masuk"),
  avatarUrl: text("avatar_url"),
  qrContactUrl: text("qr_contact_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── BETTER AUTH tables (sessions, accounts, verification) ───────────────────
// Better Auth menyimpan credentials/session di tabel terpisah dari `users`.
// Tabel `users` di atas adalah data domain (pegawai) — di-link via userId.

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── PEGAWAI DETAIL — Tab 1: Biodata ────────────────────────────────────────

export const pegawaiBiodata = pgTable("pegawai_biodata", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .references(() => users.id)
    .notNull()
    .unique(),
  noKtp: varchar("no_ktp", { length: 20 }),
  gender: genderEnum("gender"),
  statusPernikahan: statusPernikahanEnum("status_pernikahan"),
  tempatLahir: varchar("tempat_lahir", { length: 100 }),
  tanggalLahir: date("tanggal_lahir"),
  alamatTinggal: text("alamat_tinggal"),
  kodePos: varchar("kode_pos", { length: 10 }),
  provinsi: varchar("provinsi", { length: 100 }),
  kotaKabupaten: varchar("kota_kabupaten", { length: 100 }),
  alamatKtp: text("alamat_ktp"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── PEGAWAI DETAIL — Tab 2: Kelengkapan Karyawan ───────────────────────────

export const pegawaiKelengkapan = pgTable("pegawai_kelengkapan", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .references(() => users.id)
    .notNull()
    .unique(),
  fotoUrl: text("foto_url"),
  ktpUrl: text("ktp_url"),
  npwpUrl: text("npwp_url"),
  bpjsUrl: text("bpjs_url"),
  ijazahUrl: text("ijazah_url"),
  dokumenLainUrl: text("dokumen_lain_url"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── PEGAWAI DETAIL — Tab 3: Data Keluarga ──────────────────────────────────

export const pegawaiKeluarga = pgTable("pegawai_keluarga", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .references(() => users.id)
    .notNull(),
  hubungan: varchar("hubungan", { length: 50 }),
  namaAnggota: varchar("nama_anggota", { length: 200 }).notNull(),
  tempatLahir: varchar("tempat_lahir", { length: 100 }),
  tanggalLahir: date("tanggal_lahir"),
  pekerjaan: varchar("pekerjaan", { length: 150 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── PEGAWAI DETAIL — Tab 4: Riwayat Pendidikan ─────────────────────────────

export const pegawaiPendidikan = pgTable("pegawai_pendidikan", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .references(() => users.id)
    .notNull(),
  jenjang: varchar("jenjang", { length: 20 }),
  namaInstitusi: varchar("nama_institusi", { length: 200 }),
  jurusan: varchar("jurusan", { length: 150 }),
  tahunMasuk: integer("tahun_masuk"),
  tahunLulus: integer("tahun_lulus"),
  ijazahUrl: text("ijazah_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── PEGAWAI DETAIL — Tab 5: Riwayat Pekerjaan ──────────────────────────────

export const pegawaiRiwayatPekerjaan = pgTable("pegawai_riwayat_pekerjaan", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .references(() => users.id)
    .notNull(),
  namaPerusahaan: varchar("nama_perusahaan", { length: 200 }),
  jabatan: varchar("jabatan", { length: 150 }),
  tanggalMulai: date("tanggal_mulai"),
  tanggalSelesai: date("tanggal_selesai"),
  keterangan: text("keterangan"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── PEGAWAI DETAIL — Tab 6: Riwayat Kesehatan ──────────────────────────────

export const pegawaiKesehatan = pgTable("pegawai_kesehatan", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .references(() => users.id)
    .notNull()
    .unique(),
  golonganDarah: varchar("golongan_darah", { length: 5 }),
  tinggiBadan: integer("tinggi_badan"),
  beratBadan: integer("berat_badan"),
  riwayatPenyakit: text("riwayat_penyakit"),
  alergi: text("alergi"),
  catatanKesehatan: text("catatan_kesehatan"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── PEGAWAI DETAIL — Tab 7: Pernyataan Integritas ──────────────────────────

export const pegawaiPernyataanIntegritas = pgTable(
  "pegawai_pernyataan_integritas",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .references(() => users.id)
      .notNull()
      .unique(),
    tanggalPernyataan: date("tanggal_pernyataan"),
    fileUrl: text("file_url"),
    statusTandaTangan: boolean("status_tanda_tangan").default(false),
    catatan: text("catatan"),
    createdAt: timestamp("created_at").defaultNow(),
  },
);

// ─── PEJABAT PENANDATANGAN ───────────────────────────────────────────────────

export const pejabatPenandatangan = pgTable("pejabat_penandatangan", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  namaJabatan: varchar("nama_jabatan", { length: 200 }).notNull(),
  wilayah: varchar("wilayah", { length: 100 }),
  ttdUrl: text("ttd_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── NOMOR SURAT COUNTER ─────────────────────────────────────────────────────
// UNIQUE constraint (tahun, bulan, jenis_surat) — atomic increment via transaction

export const nomorSuratCounter = pgTable(
  "nomor_surat_counter",
  {
    id: serial("id").primaryKey(),
    tahun: integer("tahun").notNull(),
    bulan: integer("bulan").notNull(),
    jenisSurat: jenisSuratEnum("jenis_surat").notNull(),
    counter: integer("counter").default(0).notNull(),
    prefix: varchar("prefix", { length: 80 }),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => ({
    uniqPeriod: uniqueIndex("nomor_surat_counter_period_uniq").on(
      t.tahun,
      t.bulan,
      t.jenisSurat,
    ),
  }),
);

// ─── SURAT KELUAR ────────────────────────────────────────────────────────────

export const suratKeluar = pgTable("surat_keluar", {
  id: text("id").primaryKey(),
  nomorSurat: varchar("nomor_surat", { length: 200 }).unique(),
  perihal: text("perihal").notNull(),
  tujuan: varchar("tujuan", { length: 300 }).notNull(),
  tujuanAlamat: text("tujuan_alamat"),
  // BACKDATE: input manual bebas, tanpa validasi range
  tanggalSurat: date("tanggal_surat").notNull(),
  jenisSurat: jenisSuratEnum("jenis_surat").notNull(),
  isiSingkat: text("isi_singkat"),
  status: statusSuratKeluarEnum("status").default("draft"),
  fileDraftUrl: text("file_draft_url"),
  fileFinalUrl: text("file_final_url"),
  lampiranUrl: text("lampiran_url"),
  qrCodeUrl: text("qr_code_url"),
  pejabatId: integer("pejabat_id").references(() => pejabatPenandatangan.id),
  dibuatOleh: text("dibuat_oleh").references(() => users.id),
  divisiId: integer("divisi_id").references(() => divisi.id),
  disetujuiOleh: text("disetujui_oleh").references(() => users.id),
  tanggalDisetujui: timestamp("tanggal_disetujui"),
  catatanReviu: text("catatan_reviu"),
  catatanReviuAt: timestamp("catatan_reviu_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── SURAT MASUK ─────────────────────────────────────────────────────────────

export const suratMasuk = pgTable("surat_masuk", {
  id: text("id").primaryKey(),
  nomorAgenda: varchar("nomor_agenda", { length: 50 }),
  nomorSuratAsal: varchar("nomor_surat_asal", { length: 200 }),
  perihal: text("perihal").notNull(),
  pengirim: varchar("pengirim", { length: 200 }).notNull(),
  pengirimAlamat: text("pengirim_alamat"),
  // BACKDATE: keduanya input manual, tanpa validasi range
  tanggalSurat: date("tanggal_surat").notNull(),
  tanggalDiterima: date("tanggal_diterima").notNull(),
  jenisSurat: jenisSuratEnum("jenis_surat").notNull(),
  status: statusSuratMasukEnum("status").default("diterima"),
  isiSingkat: text("isi_singkat"),
  fileUrl: text("file_url"),
  dicatatOleh: text("dicatat_oleh").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── DISPOSISI ───────────────────────────────────────────────────────────────

export const disposisi = pgTable("disposisi", {
  id: text("id").primaryKey(),
  suratMasukId: text("surat_masuk_id")
    .references(() => suratMasuk.id)
    .notNull(),
  dariUserId: text("dari_user_id")
    .references(() => users.id)
    .notNull(),
  kepadaUserId: text("kepada_user_id")
    .references(() => users.id)
    .notNull(),
  catatan: text("catatan"),
  instruksi: text("instruksi"),
  batasWaktu: date("batas_waktu"),
  status: statusDisposisiEnum("status").default("belum_dibaca"),
  tanggalDisposisi: timestamp("tanggal_disposisi").defaultNow(),
  tanggalDibaca: timestamp("tanggal_dibaca"),
  tanggalSelesai: timestamp("tanggal_selesai"),
  // Self-reference untuk chain disposisi. Tidak pakai .references() agar tidak circular.
  parentDisposisiId: text("parent_disposisi_id"),
});

// ─── SURAT KEPUTUSAN ─────────────────────────────────────────────────────────

export const suratKeputusan = pgTable("surat_keputusan", {
  id: text("id").primaryKey(),
  nomorSK: varchar("nomor_sk", { length: 200 }).unique().notNull(),
  perihal: text("perihal").notNull(),
  tentang: text("tentang").notNull(),
  // BACKDATE: input manual bebas
  tanggalSK: date("tanggal_sk").notNull(),
  tanggalBerlaku: date("tanggal_berlaku"),
  tanggalBerakhir: date("tanggal_berakhir"),
  pejabatId: integer("pejabat_id").references(() => pejabatPenandatangan.id),
  fileUrl: text("file_url"),
  qrCodeUrl: text("qr_code_url"),
  dibuatOleh: text("dibuat_oleh").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── SURAT MOU ───────────────────────────────────────────────────────────────

export const suratMou = pgTable("surat_mou", {
  id: text("id").primaryKey(),
  nomorMOU: varchar("nomor_mou", { length: 200 }).unique().notNull(),
  perihal: text("perihal").notNull(),
  pihakKedua: varchar("pihak_kedua", { length: 200 }).notNull(),
  pihakKeduaAlamat: text("pihak_kedua_alamat"),
  // BACKDATE: input manual bebas
  tanggalMOU: date("tanggal_mou").notNull(),
  tanggalBerlaku: date("tanggal_berlaku"),
  tanggalBerakhir: date("tanggal_berakhir"),
  nilaiKerjasama: text("nilai_kerjasama"),
  fileUrl: text("file_url"),
  qrCodeUrl: text("qr_code_url"),
  pejabatId: integer("pejabat_id").references(() => pejabatPenandatangan.id),
  dibuatOleh: text("dibuat_oleh").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── AUDIT LOG ───────────────────────────────────────────────────────────────

export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  aksi: varchar("aksi", { length: 100 }),
  entitasType: varchar("entitas_type", { length: 50 }),
  entitasId: varchar("entitas_id", { length: 100 }),
  detail: jsonb("detail"),
  ipAddress: varchar("ip_address", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── SYSTEM SETTINGS ─────────────────────────────────────────────────────────
// Singleton row — aplikasi hanya punya satu baris konfigurasi identitas sistem.

export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  namaSistem: varchar("nama_sistem", { length: 200 }).notNull().default("IAI Jakarta"),
  singkatan: varchar("singkatan", { length: 20 }),
  logoUrl: text("logo_url"),
  faviconUrl: text("favicon_url"),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: text("updated_by").references(() => users.id),
});

// ─── TYPE EXPORTS ────────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Divisi = typeof divisi.$inferSelect;
export type SuratKeluar = typeof suratKeluar.$inferSelect;
export type NewSuratKeluar = typeof suratKeluar.$inferInsert;
export type SuratMasuk = typeof suratMasuk.$inferSelect;
export type NewSuratMasuk = typeof suratMasuk.$inferInsert;
export type Disposisi = typeof disposisi.$inferSelect;
export type NewDisposisi = typeof disposisi.$inferInsert;
export type SuratKeputusan = typeof suratKeputusan.$inferSelect;
export type SuratMou = typeof suratMou.$inferSelect;
export type NomorSuratCounter = typeof nomorSuratCounter.$inferSelect;
export type AuditLog = typeof auditLog.$inferSelect;
export type SystemSettings = typeof systemSettings.$inferSelect;
