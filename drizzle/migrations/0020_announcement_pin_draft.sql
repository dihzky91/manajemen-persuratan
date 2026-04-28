ALTER TABLE "announcements" ADD COLUMN "is_pinned" boolean DEFAULT false NOT NULL;
ALTER TABLE "announcements" ADD COLUMN "status" text DEFAULT 'published' NOT NULL;
