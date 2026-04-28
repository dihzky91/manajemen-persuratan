-- Fase 2: User Invitations — invitation lifecycle (invite → aktivasi → login)

DO $$ BEGIN
  CREATE TYPE "public"."user_invitation_status" AS ENUM('pending', 'accepted', 'expired', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_invitations" (
  "id" text PRIMARY KEY NOT NULL,
  "email" varchar(150) NOT NULL,
  "nama_lengkap" varchar(200) NOT NULL,
  "role" "role" DEFAULT 'staff' NOT NULL,
  "divisi_id" integer REFERENCES "divisi"("id"),
  "jabatan" varchar(150),
  "token" text NOT NULL UNIQUE,
  "status" "user_invitation_status" DEFAULT 'pending' NOT NULL,
  "expired_at" timestamp NOT NULL,
  "used_at" timestamp,
  "invited_by" text NOT NULL REFERENCES "users"("id"),
  "created_at" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_invitations_email_idx" ON "user_invitations" USING btree ("email");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_invitations_token_idx" ON "user_invitations" USING btree ("token");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_invitations_status_idx" ON "user_invitations" USING btree ("status");
