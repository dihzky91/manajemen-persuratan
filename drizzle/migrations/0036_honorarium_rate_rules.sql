CREATE TABLE IF NOT EXISTS "honorarium_rate_rules" (
  "id" text PRIMARY KEY NOT NULL,
  "program_id" text NOT NULL,
  "level" varchar(20) NOT NULL,
  "mode" varchar(10) NOT NULL,
  "honor_per_session" numeric(12, 2) NOT NULL,
  "transport_amount" numeric(12, 2) NOT NULL,
  "effective_from" date NOT NULL,
  "effective_to" date,
  "location_scope" varchar(200) DEFAULT '' NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "notes" varchar(300),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "honorarium_rate_rules"
  ADD CONSTRAINT "honorarium_rate_rules_program_id_programs_id_fk"
  FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id")
  ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_honorarium_rate_rule"
  ON "honorarium_rate_rules" USING btree
  ("program_id", "level", "mode", "effective_from", "location_scope");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hrr_program_idx"
  ON "honorarium_rate_rules" USING btree ("program_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hrr_effective_idx"
  ON "honorarium_rate_rules" USING btree ("effective_from", "effective_to");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hrr_active_idx"
  ON "honorarium_rate_rules" USING btree ("is_active");
--> statement-breakpoint

WITH target_programs AS (
  SELECT id, code, name
  FROM programs
  WHERE code IN ('BREVET_AB', 'BREVET_C', 'BFA', 'ESPT')
     OR name IN ('Brevet AB', 'Brevet C', 'BFA', 'E-SPT')
),
seed_rows AS (
  SELECT
    p.id AS program_id,
    t.level,
    t.mode,
    t.honor_per_session,
    t.transport_amount,
    DATE '2024-02-03' AS effective_from,
    ''::varchar(200) AS location_scope,
    'Berlaku mulai 3 Februari 2024. Catatan template: angkatan 189 RP Offline - Bekasi.'::varchar(300) AS notes
  FROM target_programs p
  JOIN (
    VALUES
      -- Brevet AB
      ('BREVET_AB', 'basic',  'online',  275000::numeric,  40000::numeric),
      ('BREVET_AB', 'basic',  'offline', 275000::numeric,  60000::numeric),
      ('BREVET_AB', 'middle', 'online',  290000::numeric,  40000::numeric),
      ('BREVET_AB', 'middle', 'offline', 290000::numeric,  60000::numeric),
      ('BREVET_AB', 'senior', 'online',  375000::numeric,  50000::numeric),
      ('BREVET_AB', 'senior', 'offline', 375000::numeric,  75000::numeric),
      -- Brevet C
      ('BREVET_C', 'basic',  'online',  425000::numeric,  55000::numeric),
      ('BREVET_C', 'basic',  'offline', 425000::numeric,  85000::numeric),
      ('BREVET_C', 'middle', 'online',  425000::numeric,  55000::numeric),
      ('BREVET_C', 'middle', 'offline', 425000::numeric,  85000::numeric),
      ('BREVET_C', 'senior', 'online',  525000::numeric,  75000::numeric),
      ('BREVET_C', 'senior', 'offline', 525000::numeric, 100000::numeric),
      -- BFA
      ('BFA', 'basic',  'online',  275000::numeric,  40000::numeric),
      ('BFA', 'basic',  'offline', 275000::numeric,  85000::numeric),
      ('BFA', 'middle', 'online',  285000::numeric,  40000::numeric),
      ('BFA', 'middle', 'offline', 285000::numeric,  85000::numeric),
      ('BFA', 'senior', 'online',  300000::numeric,  50000::numeric),
      ('BFA', 'senior', 'offline', 300000::numeric, 100000::numeric),
      -- E-SPT (jika program tersedia)
      ('ESPT', 'basic',  'online',  400000::numeric, 40000::numeric),
      ('ESPT', 'basic',  'offline', 400000::numeric, 60000::numeric),
      ('ESPT', 'middle', 'online',  400000::numeric, 40000::numeric),
      ('ESPT', 'middle', 'offline', 400000::numeric, 60000::numeric),
      ('ESPT', 'senior', 'online',  450000::numeric, 50000::numeric),
      ('ESPT', 'senior', 'offline', 450000::numeric, 75000::numeric)
  ) AS t(program_code, level, mode, honor_per_session, transport_amount)
    ON p.code = t.program_code
)
INSERT INTO honorarium_rate_rules (
  id,
  program_id,
  level,
  mode,
  honor_per_session,
  transport_amount,
  effective_from,
  location_scope,
  notes
)
SELECT
  md5(random()::text || clock_timestamp()::text),
  program_id,
  level,
  mode,
  honor_per_session,
  transport_amount,
  effective_from,
  location_scope,
  notes
FROM seed_rows
ON CONFLICT ("program_id", "level", "mode", "effective_from", "location_scope")
DO NOTHING;
