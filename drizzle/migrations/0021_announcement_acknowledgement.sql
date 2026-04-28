ALTER TABLE "announcements" ADD COLUMN "requires_ack" boolean DEFAULT false NOT NULL;
ALTER TABLE "announcement_reads" ADD COLUMN "acknowledged_at" timestamp;
