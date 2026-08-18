-- 003_commissioner_gate.sql
-- Commissioner / admin gate for pool management and (later) result publishing.
-- Prefer this column over any env allowlist.

ALTER TABLE users
  ADD COLUMN is_commissioner BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX users_is_commissioner_idx ON users (is_commissioner)
  WHERE is_commissioner = TRUE;
