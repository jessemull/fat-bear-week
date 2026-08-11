-- Truncate all application data while keeping schema.
-- Prefer this over drop_all_tables when you only need empty tables.
-- See docs/SUPABASE_MIGRATIONS.md.

TRUNCATE TABLE
  picks,
  entries,
  invitations,
  matchups,
  bears,
  tournaments,
  pools,
  users
RESTART IDENTITY CASCADE;
