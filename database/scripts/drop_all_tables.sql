-- Drop all Fat Bear Week application tables and helpers.
-- Use only when you intend to wipe a Supabase project and re-bootstrap.
-- See docs/SUPABASE_MIGRATIONS.md.

DROP TABLE IF EXISTS picks CASCADE;
DROP TABLE IF EXISTS entries CASCADE;
DROP TABLE IF EXISTS invitations CASCADE;
DROP TABLE IF EXISTS matchups CASCADE;
DROP TABLE IF EXISTS bears CASCADE;
DROP TABLE IF EXISTS tournaments CASCADE;
DROP TABLE IF EXISTS pools CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
