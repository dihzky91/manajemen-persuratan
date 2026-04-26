ALTER TABLE "participants" ADD COLUMN "replaces_participant_id" integer;--> statement-breakpoint
CREATE INDEX "participants_replaces_idx" ON "participants" USING btree ("replaces_participant_id");