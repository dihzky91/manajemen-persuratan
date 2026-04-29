UPDATE "instructor_expertise"
SET "level" = 'middle'
WHERE "level" = 'intermediate';

UPDATE "instructor_expertise"
SET "level" = 'senior'
WHERE "level" = 'expert';

ALTER TABLE "instructor_expertise"
ALTER COLUMN "level" SET DEFAULT 'middle';
