ALTER TABLE "instructor_expertise"
ADD COLUMN IF NOT EXISTS "level" varchar(20) NOT NULL DEFAULT 'middle';

ALTER TABLE "session_assignments"
ADD COLUMN IF NOT EXISTS "availability_status" varchar(30) NOT NULL DEFAULT 'pending_wa_confirmation';

ALTER TABLE "session_assignments"
ADD COLUMN IF NOT EXISTS "availability_checked_at" timestamp;

ALTER TABLE "session_assignments"
ADD COLUMN IF NOT EXISTS "availability_note" varchar(300);
