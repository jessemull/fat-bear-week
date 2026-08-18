-- Bear profile fields aligned with Fat Bear Week catalog pages.
-- Rename description → identification, add biography, drop number.

DROP INDEX IF EXISTS bears_number_idx;

ALTER TABLE bears RENAME COLUMN description TO identification;

ALTER TABLE bears ADD COLUMN biography TEXT;

ALTER TABLE bears DROP COLUMN number;
