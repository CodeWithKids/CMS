-- Add missing column for Class.schoolOrOrganisationName
-- Idempotent so it can run safely on Render even if the column already exists.

ALTER TABLE "classes"
ADD COLUMN IF NOT EXISTS "schoolOrOrganisationName" TEXT;

