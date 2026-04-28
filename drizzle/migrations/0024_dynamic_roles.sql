-- Fase 0: Dynamic roles, capability guard, dan super admin.

CREATE TABLE IF NOT EXISTS "roles" (
  "id" serial PRIMARY KEY,
  "nama" varchar(150) NOT NULL,
  "kode" varchar(50) NOT NULL UNIQUE,
  "is_system" boolean NOT NULL DEFAULT false,
  "created_by" text,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "role_capabilities" (
  "role_id" integer NOT NULL REFERENCES "roles"("id") ON DELETE cascade,
  "capability" varchar(100) NOT NULL,
  CONSTRAINT "role_capabilities_pk" PRIMARY KEY ("role_id", "capability")
);

CREATE INDEX IF NOT EXISTS "role_capabilities_capability_idx"
  ON "role_capabilities" ("capability");

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "is_super_admin" boolean NOT NULL DEFAULT false;

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "role_id" integer REFERENCES "roles"("id");

ALTER TABLE "user_invitations"
  ADD COLUMN IF NOT EXISTS "role_id" integer REFERENCES "roles"("id");

INSERT INTO "roles" ("nama", "kode", "is_system")
VALUES
  ('Staff', 'staff', true),
  ('Pejabat', 'pejabat', true),
  ('Viewer', 'viewer', true)
ON CONFLICT ("kode") DO UPDATE SET
  "nama" = EXCLUDED."nama",
  "is_system" = true,
  "updated_at" = now();

WITH seed_capabilities(kode, capability) AS (
  VALUES
    ('staff', 'surat_masuk:view'),
    ('staff', 'surat_masuk:create'),
    ('staff', 'surat_masuk:edit'),
    ('staff', 'surat_keluar:view'),
    ('staff', 'surat_keluar:create'),
    ('staff', 'surat_keluar:edit'),
    ('staff', 'disposisi:view'),
    ('staff', 'disposisi:edit'),
    ('staff', 'disposisi:manage'),
    ('staff', 'pegawai:view'),
    ('staff', 'pejabat:view'),
    ('staff', 'sertifikat:view'),
    ('staff', 'sertifikat:manage'),
    ('staff', 'sertifikat:export'),
    ('staff', 'jadwal_ujian:view'),
    ('staff', 'jadwal_ujian:manage'),
    ('staff', 'jadwal_ujian:export'),
    ('staff', 'announcement:view'),
    ('staff', 'divisi:view'),
    ('staff', 'audit_log:manage'),
    ('staff', 'notification:view'),
    ('staff', 'notification:manage'),
    ('staff', 'calendar:view'),
    ('staff', 'calendar:manage'),
    ('staff', 'search:view'),
    ('staff', 'profile:view'),
    ('staff', 'profile:edit'),
    ('pejabat', 'surat_masuk:view'),
    ('pejabat', 'surat_masuk:edit'),
    ('pejabat', 'surat_keluar:view'),
    ('pejabat', 'surat_keluar:create'),
    ('pejabat', 'surat_keluar:edit'),
    ('pejabat', 'surat_keluar:approve'),
    ('pejabat', 'surat_keluar:generate'),
    ('pejabat', 'surat_keluar:assign'),
    ('pejabat', 'disposisi:view'),
    ('pejabat', 'disposisi:create'),
    ('pejabat', 'disposisi:edit'),
    ('pejabat', 'disposisi:sign'),
    ('pejabat', 'disposisi:manage'),
    ('pejabat', 'pegawai:view'),
    ('pejabat', 'pejabat:view'),
    ('pejabat', 'jadwal_ujian:view'),
    ('pejabat', 'announcement:view'),
    ('pejabat', 'divisi:view'),
    ('pejabat', 'nomor_surat:view'),
    ('pejabat', 'nomor_surat:generate'),
    ('pejabat', 'nomor_surat:manage'),
    ('pejabat', 'surat_keputusan:view'),
    ('pejabat', 'surat_keputusan:create'),
    ('pejabat', 'surat_keputusan:edit'),
    ('pejabat', 'surat_keputusan:generate'),
    ('pejabat', 'surat_mou:view'),
    ('pejabat', 'surat_mou:create'),
    ('pejabat', 'surat_mou:edit'),
    ('pejabat', 'surat_mou:generate'),
    ('pejabat', 'notification:view'),
    ('pejabat', 'notification:manage'),
    ('pejabat', 'calendar:view'),
    ('pejabat', 'calendar:manage'),
    ('pejabat', 'search:view'),
    ('pejabat', 'profile:view'),
    ('pejabat', 'profile:edit'),
    ('viewer', 'surat_masuk:view'),
    ('viewer', 'surat_keluar:view'),
    ('viewer', 'disposisi:view'),
    ('viewer', 'pegawai:view'),
    ('viewer', 'pejabat:view'),
    ('viewer', 'sertifikat:view'),
    ('viewer', 'jadwal_ujian:view'),
    ('viewer', 'announcement:view'),
    ('viewer', 'divisi:view'),
    ('viewer', 'notification:view'),
    ('viewer', 'notification:manage'),
    ('viewer', 'calendar:view'),
    ('viewer', 'calendar:manage'),
    ('viewer', 'search:view'),
    ('viewer', 'profile:view'),
    ('viewer', 'profile:edit')
)
INSERT INTO "role_capabilities" ("role_id", "capability")
SELECT r."id", s.capability
FROM seed_capabilities s
JOIN "roles" r ON r."kode" = s.kode
ON CONFLICT ("role_id", "capability") DO NOTHING;

UPDATE "users"
SET "is_super_admin" = true,
    "role_id" = NULL
WHERE "role" = 'admin';

UPDATE "users"
SET "role_id" = r."id"
FROM "roles" r
WHERE "users"."role_id" IS NULL
  AND "users"."is_super_admin" = false
  AND "users"."role"::text = r."kode";

UPDATE "user_invitations"
SET "role_id" = r."id"
FROM "roles" r
WHERE "user_invitations"."role_id" IS NULL
  AND "user_invitations"."role"::text = r."kode";
