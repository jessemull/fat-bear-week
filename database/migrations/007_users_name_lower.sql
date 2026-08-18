-- 007_users_name_lower.sql
-- Stored lower(name) for exact case-insensitive sign-in (avoid ILIKE _/% wildcards).

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS name_lower TEXT
    GENERATED ALWAYS AS (lower(name)) STORED;

DROP INDEX IF EXISTS users_name_lower_unique;

CREATE UNIQUE INDEX users_name_lower_unique ON users (name_lower);
