ALTER TABLE "announcements"
ADD COLUMN "attachments" jsonb DEFAULT '[]'::jsonb NOT NULL;
