ALTER TABLE "participants" ADD COLUMN "last_pdf_hash" varchar(64);--> statement-breakpoint
ALTER TABLE "participants" ADD COLUMN "last_pdf_generated_at" timestamp;