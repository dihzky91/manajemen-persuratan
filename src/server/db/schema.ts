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
  index,
  primaryKey,
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

export const kategoriKegiatanEnum = pgEnum("kategori_kegiatan", [
  "Workshop",
  "Brevet AB",
  "Brevet C",
  "BFA",
  "Lainnya",
]);

export const statusEventEnum = pgEnum("status_event", [
  "aktif",
  "dibatalkan",
  "ditunda",
  "arsip",
]);

export const statusPesertaEnum = pgEnum("status_peserta", [
  "aktif",
  "dicabut",
]);

export type TemplateFieldKey =
  | "namaPeserta"
  | "noSertifikat"
  | "namaKegiatan"
  | "kategori"
  | "tanggalKegiatan"
  | "lokasi"
  | "skp"
  | "qrCode"
  | "signature1Nama"
  | "signature1Jabatan"
  | "signature2Nama"
  | "signature2Jabatan"
  | "signature3Nama"
  | "signature3Jabatan";

export type TemplateFieldPosition = {
  enabled: boolean;
  x: number;
  y: number;
  width?: number;
  fontSize: number;
  fontWeight: "normal" | "bold";
  fontStyle: "normal" | "italic";
  fontFamily: "Helvetica" | "Times-Roman" | "Courier";
  color: string;
  align: "left" | "center" | "right";
};

export type TemplateFieldMap = Partial<Record<TemplateFieldKey, TemplateFieldPosition>>;

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
  activatedAt: timestamp("activated_at"),
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
  // Non-secret runtime preferences (admin-editable from UI)
  defaultDisposisiDeadlineDays: integer("default_disposisi_deadline_days")
    .default(7)
    .notNull(),
  notificationEmailEnabled: boolean("notification_email_enabled")
    .default(true)
    .notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: text("updated_by").references(() => users.id),
});

// ─── NOTIFICATIONS ─────────────────────────────────────────────────────────────

export const notificationTypeEnum = pgEnum("notification_type", [
  "disposisi_baru",
  "disposisi_deadline",
  "surat_keluar_approval",
  "surat_keluar_revisi",
  "surat_keluar_selesai",
  "surat_masuk_baru",
  "system",
]);

export const notifications = pgTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .references(() => users.id)
    .notNull(),
  type: notificationTypeEnum("type").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  entitasType: varchar("entitas_type", { length: 50 }),
  entitasId: varchar("entitas_id", { length: 100 }),
  isRead: boolean("is_read").default(false).notNull(),
  isEmailSent: boolean("is_email_sent").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  readAt: timestamp("read_at"),
});

// ─── NOTIFICATION PREFERENCES ──────────────────────────────────────────────────
// Per-user toggle: untuk tiap tipe notifikasi, user bisa enable/disable in-app & email.

export const notificationPreferences = pgTable("notification_preferences", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  // In-app notification toggles
  inAppDisposisiBaru: boolean("in_app_disposisi_baru").default(true).notNull(),
  inAppDisposisiDeadline: boolean("in_app_disposisi_deadline").default(true).notNull(),
  inAppSuratKeluarApproval: boolean("in_app_surat_keluar_approval").default(true).notNull(),
  inAppSuratKeluarRevisi: boolean("in_app_surat_keluar_revisi").default(true).notNull(),
  inAppSuratKeluarSelesai: boolean("in_app_surat_keluar_selesai").default(true).notNull(),
  inAppSuratMasukBaru: boolean("in_app_surat_masuk_baru").default(true).notNull(),
  // Email notification toggles
  emailDisposisiBaru: boolean("email_disposisi_baru").default(true).notNull(),
  emailDisposisiDeadline: boolean("email_disposisi_deadline").default(true).notNull(),
  emailSuratKeluarApproval: boolean("email_surat_keluar_approval").default(false).notNull(),
  emailSuratKeluarRevisi: boolean("email_surat_keluar_revisi").default(false).notNull(),
  emailSuratKeluarSelesai: boolean("email_surat_keluar_selesai").default(false).notNull(),
  emailSuratMasukBaru: boolean("email_surat_masuk_baru").default(false).notNull(),
  // Reminder threshold (hari sebelum deadline)
  deadlineReminderDays: integer("deadline_reminder_days").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── CALENDAR EVENTS ───────────────────────────────────────────────────────────

export const calendarEventTypeEnum = pgEnum("calendar_event_type", [
  "surat_deadline",
  "disposisi_deadline",
  "rapat",
  "reminder",
  "other",
]);

export const calendarEvents = pgTable("calendar_events", {
  id: text("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  eventType: calendarEventTypeEnum("event_type").notNull(),
  entitasType: varchar("entitas_type", { length: 50 }),
  entitasId: varchar("entitas_id", { length: 100 }),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  allDay: boolean("all_day").default(false).notNull(),
  userId: text("user_id").references(() => users.id),
  isPublic: boolean("is_public").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── SERTIFIKAT & KEGIATAN ───────────────────────────────────────────────────

export const certificateTemplates = pgTable(
  "certificate_templates",
  {
    id: serial("id").primaryKey(),
    nama: varchar("nama", { length: 200 }).notNull(),
    kategori: kategoriKegiatanEnum("kategori").notNull(),
    imageUrl: text("image_url").notNull(),
    imageWidth: integer("image_width").notNull(),
    imageHeight: integer("image_height").notNull(),
    fieldPositions: jsonb("field_positions")
      .notNull()
      .$type<TemplateFieldMap>()
      .default({}),
    isDefault: boolean("is_default").default(false),
    isActive: boolean("is_active").default(true),
    createdBy: text("created_by").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => ({
    kategoriIdx: index("certificate_templates_kategori_idx").on(t.kategori),
  }),
);

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  kodeEvent: varchar("kode_event", { length: 30 }).unique().notNull(),
  namaKegiatan: varchar("nama_kegiatan", { length: 255 }).notNull(),
  kategori: kategoriKegiatanEnum("kategori").default("Workshop").notNull(),
  statusEvent: statusEventEnum("status_event").default("aktif").notNull(),
  tanggalMulai: date("tanggal_mulai").notNull(),
  tanggalSelesai: date("tanggal_selesai").notNull(),
  lokasi: varchar("lokasi", { length: 255 }),
  skp: varchar("skp", { length: 50 }),
  keterangan: text("keterangan"),
  certificateTemplateId: integer("certificate_template_id").references(
    () => certificateTemplates.id,
    { onDelete: "set null" },
  ),
  createdBy: text("created_by").references(() => users.id),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const eventCertificateCounters = pgTable("event_certificate_counters", {
  eventId: integer("event_id")
    .primaryKey()
    .references(() => events.id, { onDelete: "cascade" }),
  lastCounter: integer("last_counter").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const signatories = pgTable("signatories", {
  id: serial("id").primaryKey(),
  nama: varchar("nama", { length: 255 }).notNull(),
  jabatan: varchar("jabatan", { length: 255 }),
  pejabatId: integer("pejabat_id").references(() => pejabatPenandatangan.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const eventSignatories = pgTable(
  "event_signatories",
  {
    eventId: integer("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    signatoryId: integer("signatory_id")
      .notNull()
      .references(() => signatories.id, { onDelete: "cascade" }),
    urutan: integer("urutan").notNull().default(1),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.eventId, t.signatoryId] }),
  }),
);

export const participants = pgTable(
  "participants",
  {
    id: serial("id").primaryKey(),
    eventId: integer("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    noSertifikat: varchar("no_sertifikat", { length: 100 }).notNull(),
    nama: varchar("nama", { length: 255 }).notNull(),
    role: varchar("role", { length: 50 }).default("Peserta").notNull(),
    email: varchar("email", { length: 150 }),
    emailSentAt: timestamp("email_sent_at"),
    statusPeserta: statusPesertaEnum("status_peserta").default("aktif").notNull(),
    revokedAt: timestamp("revoked_at"),
    revokedBy: text("revoked_by").references(() => users.id),
    revokeReason: text("revoke_reason"),
    deletedAt: timestamp("deleted_at"),
    lastPdfHash: varchar("last_pdf_hash", { length: 64 }),
    lastPdfGeneratedAt: timestamp("last_pdf_generated_at"),
    replacesParticipantId: integer("replaces_participant_id"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => ({
    eventIdIdx: index("participants_event_id_idx").on(t.eventId),
    statusIdx: index("participants_status_idx").on(t.statusPeserta),
    replacesIdx: index("participants_replaces_idx").on(t.replacesParticipantId),
  }),
);

export const participantRevisions = pgTable(
  "participant_revisions",
  {
    id: serial("id").primaryKey(),
    participantId: integer("participant_id")
      .notNull()
      .references(() => participants.id, { onDelete: "cascade" }),
    changedBy: text("changed_by").references(() => users.id),
    changeType: varchar("change_type", { length: 30 }).notNull(), // create, update, revoke, reactivate, soft_delete, restore, reissue
    before: jsonb("before"),
    after: jsonb("after"),
    note: text("note"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => ({
    participantIdx: index("participant_revisions_participant_idx").on(t.participantId),
  }),
);

// ─── JADWAL UJIAN ────────────────────────────────────────────────────────────

// Nilai lookup (program, tipe, mode) dikelola admin dari UI — tidak pakai enum
export const jadwalUjianConfig = pgTable(
  "jadwal_ujian_config",
  {
    id: text("id").primaryKey(),
    jenis: varchar("jenis", { length: 20 }).notNull(),  // "program" | "tipe" | "mode"
    nilai: varchar("nilai", { length: 100 }).notNull(),
    urutan: integer("urutan").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("uniq_config_jenis_nilai").on(t.jenis, t.nilai)],
);

export const pengawas = pgTable("pengawas", {
  id: text("id").primaryKey(),
  nama: varchar("nama", { length: 200 }).notNull(),
  catatan: text("catatan"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const kelasUjian = pgTable("kelas_ujian", {
  id: text("id").primaryKey(),
  namaKelas: varchar("nama_kelas", { length: 200 }).notNull(),
  program: varchar("program", { length: 100 }).notNull(),
  tipe: varchar("tipe", { length: 100 }).notNull(),
  mode: varchar("mode", { length: 50 }).notNull(),
  lokasi: varchar("lokasi", { length: 300 }),
  catatan: text("catatan"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const materiUjian = pgTable("materi_ujian", {
  id: text("id").primaryKey(),
  nama: varchar("nama", { length: 200 }).notNull(),
  program: varchar("program", { length: 100 }).notNull(),
  urutan: integer("urutan").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const jadwalUjian = pgTable("jadwal_ujian", {
  id: text("id").primaryKey(),
  kelasId: text("kelas_id")
    .notNull()
    .references(() => kelasUjian.id, { onDelete: "cascade" }),
  mataPelajaran: text("mata_pelajaran").array().notNull(),
  tanggalUjian: date("tanggal_ujian").notNull(),
  jamMulai: varchar("jam_mulai", { length: 5 }).notNull(),
  jamSelesai: varchar("jam_selesai", { length: 5 }).notNull(),
  catatan: text("catatan"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const penugasanPengawas = pgTable(
  "penugasan_pengawas",
  {
    id: text("id").primaryKey(),
    ujianId: text("ujian_id")
      .notNull()
      .references(() => jadwalUjian.id, { onDelete: "cascade" }),
    pengawasId: text("pengawas_id")
      .notNull()
      .references(() => pengawas.id, { onDelete: "cascade" }),
    konflik: boolean("konflik").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("uniq_ujian_pengawas").on(t.ujianId, t.pengawasId)],
);

export const adminJaga = pgTable(
  "admin_jaga",
  {
    id: text("id").primaryKey(),
    ujianId: text("ujian_id")
      .notNull()
      .references(() => jadwalUjian.id, { onDelete: "cascade" }),
    pengawasId: text("pengawas_id")
      .notNull()
      .references(() => pengawas.id, { onDelete: "cascade" }),
    catatan: text("catatan"),
    konflik: boolean("konflik").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("uniq_admin_jaga_ujian_pengawas").on(t.ujianId, t.pengawasId)],
);

export const jadwalAdminJaga = pgTable("jadwal_admin_jaga", {
  id: text("id").primaryKey(),
  kelasId: text("kelas_id")
    .notNull()
    .references(() => kelasUjian.id, { onDelete: "cascade" }),
  tanggal: date("tanggal").notNull(),
  jamMulai: varchar("jam_mulai", { length: 5 }).default("17:15").notNull(),
  jamSelesai: varchar("jam_selesai", { length: 5 }).default("21:30").notNull(),
  materi: varchar("materi", { length: 300 }).notNull(),
  pengawasId: text("pengawas_id")
    .notNull()
    .references(() => pengawas.id, { onDelete: "cascade" }),
  catatan: text("catatan"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type AnnouncementAudience = {
  all: boolean;
  roles: Array<"admin" | "staff" | "pejabat" | "viewer">;
  divisiIds: number[];
};

export type AnnouncementAttachment = {
  fileName: string;
  url: string;
  contentType?: string;
  size?: number;
};

export const announcements = pgTable("announcements", {
  id: text("id").primaryKey(),
  title: varchar("title", { length: 220 }).notNull(),
  description: text("description").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  audience: jsonb("audience").$type<AnnouncementAudience>().notNull(),
  attachments: jsonb("attachments")
    .$type<AnnouncementAttachment[]>()
    .notNull()
    .default([]),
  isPinned: boolean("is_pinned").default(false).notNull(),
  requiresAck: boolean("requires_ack").default(false).notNull(),
  status: text("status", { enum: ["draft", "published"] })
    .default("published")
    .notNull(),
  createdBy: text("created_by")
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const announcementReads = pgTable(
  "announcement_reads",
  {
    announcementId: text("announcement_id")
      .notNull()
      .references(() => announcements.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    readAt: timestamp("read_at").defaultNow().notNull(),
    acknowledgedAt: timestamp("acknowledged_at"),
  },
  (t) => ({
    pk: primaryKey({
      columns: [t.announcementId, t.userId],
      name: "announcement_reads_pk",
    }),
    announcementIdx: index("announcement_reads_announcement_idx").on(
      t.announcementId,
    ),
    userIdx: index("announcement_reads_user_idx").on(t.userId),
  }),
);

// ─── USER INVITATIONS ────────────────────────────────────────────────────────
// Fase 2 — Invitation lifecycle: invite → aktivasi → login.
// Token dikirim via email, berlaku 24 jam. Setelah user set password, usedAt diisi.

export const userInvitationStatusEnum = pgEnum("user_invitation_status", [
  "pending",
  "accepted",
  "expired",
  "cancelled",
]);

export const userInvitations = pgTable(
  "user_invitations",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    email: varchar("email", { length: 150 }).notNull(),
    namaLengkap: varchar("nama_lengkap", { length: 200 }).notNull(),
    role: roleEnum("role").default("staff").notNull(),
    divisiId: integer("divisi_id").references(() => divisi.id),
    jabatan: varchar("jabatan", { length: 150 }),
    token: text("token").notNull().unique(),
    status: userInvitationStatusEnum("status").default("pending").notNull(),
    expiredAt: timestamp("expired_at").notNull(),
    usedAt: timestamp("used_at"),
    invitedBy: text("invited_by")
      .references(() => users.id)
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    emailIdx: index("user_invitations_email_idx").on(t.email),
    tokenIdx: index("user_invitations_token_idx").on(t.token),
    statusIdx: index("user_invitations_status_idx").on(t.status),
  }),
);

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
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type NewCalendarEvent = typeof calendarEvents.$inferInsert;
export type NotificationPreferences = typeof notificationPreferences.$inferSelect;
export type NewNotificationPreferences = typeof notificationPreferences.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type CertificateTemplate = typeof certificateTemplates.$inferSelect;
export type NewCertificateTemplate = typeof certificateTemplates.$inferInsert;
export type EventCertificateCounter = typeof eventCertificateCounters.$inferSelect;
export type NewEventCertificateCounter = typeof eventCertificateCounters.$inferInsert;
export type Signatory = typeof signatories.$inferSelect;
export type NewSignatory = typeof signatories.$inferInsert;
export type EventSignatory = typeof eventSignatories.$inferSelect;
export type NewEventSignatory = typeof eventSignatories.$inferInsert;
export type Participant = typeof participants.$inferSelect;
export type NewParticipant = typeof participants.$inferInsert;
export type Pengawas = typeof pengawas.$inferSelect;
export type NewPengawas = typeof pengawas.$inferInsert;
export type MateriUjian = typeof materiUjian.$inferSelect;
export type NewMateriUjian = typeof materiUjian.$inferInsert;
export type KelasUjian = typeof kelasUjian.$inferSelect;
export type NewKelasUjian = typeof kelasUjian.$inferInsert;
export type JadwalUjian = typeof jadwalUjian.$inferSelect;
export type NewJadwalUjian = typeof jadwalUjian.$inferInsert;
export type PenugasanPengawas = typeof penugasanPengawas.$inferSelect;
export type NewPenugasanPengawas = typeof penugasanPengawas.$inferInsert;
export type JadwalUjianConfig = typeof jadwalUjianConfig.$inferSelect;
export type NewJadwalUjianConfig = typeof jadwalUjianConfig.$inferInsert;
export type AdminJaga = typeof adminJaga.$inferSelect;
export type NewAdminJaga = typeof adminJaga.$inferInsert;
export type JadwalAdminJaga = typeof jadwalAdminJaga.$inferSelect;
export type NewJadwalAdminJaga = typeof jadwalAdminJaga.$inferInsert;
export type Announcement = typeof announcements.$inferSelect;
export type NewAnnouncement = typeof announcements.$inferInsert;
export type AnnouncementRead = typeof announcementReads.$inferSelect;
export type NewAnnouncementRead = typeof announcementReads.$inferInsert;
export type UserInvitation = typeof userInvitations.$inferSelect;
export type NewUserInvitation = typeof userInvitations.$inferInsert;

// ─── PENOMORAN SERTIFIKAT (Certificate Hub) ──────────────────────────────────
// Sub-modul terpisah dari modul sertifikat kegiatan/event.
// Fokus: penomoran batch formal (Brevet AB, Brevet C, BFA, dll.)
// dengan sistem serial counter global yang berkesinambungan antar batch.

export const certificatePrograms = pgTable("certificate_programs", {
  id:        text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name:      varchar("name", { length: 200 }).notNull().unique(),
  code:      varchar("code", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const certificateClassTypes = pgTable("certificate_class_types", {
  id:        text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name:      varchar("name", { length: 200 }).notNull(),
  code:      varchar("code", { length: 2 }).notNull().unique(), // "01", "02", "03"
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Singleton config — hanya 1 baris: { key: 'last_serial_number', value: '0' }
export const certificateSerialConfig = pgTable("certificate_serial_config", {
  key:       text("key").primaryKey(),
  value:     text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const certificateBatchStatusEnum = pgEnum("certificate_batch_status", [
  "active",
  "revised",
  "cancelled",
]);

export const certificateBatches = pgTable(
  "certificate_batches",
  {
    id:                     text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    programId:              text("program_id")
                              .notNull()
                              .references(() => certificatePrograms.id),
    classTypeId:            text("class_type_id")
                              .notNull()
                              .references(() => certificateClassTypes.id),
    angkatan:               integer("angkatan").notNull(),                // contoh: 223
    quantityRequested:      integer("quantity_requested").notNull(),
    firstCertificateNumber: varchar("first_certificate_number", { length: 50 }).notNull(),
    lastCertificateNumber:  varchar("last_certificate_number", { length: 50 }).notNull(),
    status:                 certificateBatchStatusEnum("status").default("active").notNull(),
    notes:                  text("notes"),
    createdBy:              text("created_by").references(() => users.id),
    createdAt:              timestamp("created_at").defaultNow().notNull(),
    updatedAt:              timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("cert_batches_program_idx").on(t.programId),
    index("cert_batches_angkatan_idx").on(t.angkatan),
    index("cert_batches_status_idx").on(t.status),
  ],
);

export const certificateItemStatusEnum = pgEnum("certificate_item_status", [
  "active",
  "cancelled",
]);

export const certificateItems = pgTable(
  "certificate_items",
  {
    id:            text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    batchId:       text("batch_id")
                     .notNull()
                     .references(() => certificateBatches.id, { onDelete: "cascade" }),
    fullNumber:    varchar("full_number", { length: 50 }).notNull().unique(), // "22301.3386"
    angkatan:      integer("angkatan").notNull(),
    classTypeCode: varchar("class_type_code", { length: 2 }).notNull(),
    serialNumber:  integer("serial_number").notNull(),
    status:        certificateItemStatusEnum("status").default("active").notNull(),
    createdAt:     timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("cert_items_batch_idx").on(t.batchId),
    index("cert_items_serial_idx").on(t.serialNumber),
    index("cert_items_status_idx").on(t.status),
  ],
);

// ─── TYPE EXPORTS (Penomoran Sertifikat) ─────────────────────────────────────

export type CertificateProgram = typeof certificatePrograms.$inferSelect;
export type NewCertificateProgram = typeof certificatePrograms.$inferInsert;
export type CertificateClassType = typeof certificateClassTypes.$inferSelect;
export type NewCertificateClassType = typeof certificateClassTypes.$inferInsert;
export type CertificateBatch = typeof certificateBatches.$inferSelect;
export type NewCertificateBatch = typeof certificateBatches.$inferInsert;
export type CertificateItem = typeof certificateItems.$inferSelect;
export type NewCertificateItem = typeof certificateItems.$inferInsert;
