-- 002_sessions.sql
-- HTTP-only session store, invitee email, unique display names, atomic join RPC
--
-- Commissioner / admin role: see 003_commissioner_gate.sql (users.is_commissioner).

-- ---------------------------------------------------------------------------
-- sessions
-- Cookie holds the raw token; only the SHA-256 hex hash is stored here.
-- ---------------------------------------------------------------------------

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX sessions_user_id_idx ON sessions (user_id);
CREATE INDEX sessions_expires_at_idx ON sessions (expires_at);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Sign-in identity: display name must be unique (case-insensitive)
-- ---------------------------------------------------------------------------

CREATE UNIQUE INDEX users_name_lower_unique ON users (lower(name));

-- ---------------------------------------------------------------------------
-- Invitee address for automatic email + audit
-- ---------------------------------------------------------------------------

ALTER TABLE invitations
  ADD COLUMN email TEXT;

CREATE INDEX invitations_email_idx ON invitations (email);

-- ---------------------------------------------------------------------------
-- Atomic join: validate invite, enforce max_players, create user + entry,
-- consume invite (used_at) in one transaction. Called via service role only.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION join_pool_with_invite(
  p_name TEXT,
  p_password_hash TEXT,
  p_token TEXT
)
RETURNS TABLE (
  entry_id UUID,
  pool_id UUID,
  user_id UUID,
  user_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation invitations%ROWTYPE;
  v_pool pools%ROWTYPE;
  v_entry_count INTEGER;
  v_user_id UUID;
  v_entry_id UUID;
BEGIN
  IF p_token IS NULL OR length(trim(p_token)) = 0 THEN
    RAISE EXCEPTION 'invalid_invite' USING ERRCODE = 'P0001';
  END IF;

  IF p_name IS NULL OR length(trim(p_name)) = 0 THEN
    RAISE EXCEPTION 'invalid_name' USING ERRCODE = 'P0001';
  END IF;

  IF p_password_hash IS NULL OR length(p_password_hash) = 0 THEN
    RAISE EXCEPTION 'invalid_password' USING ERRCODE = 'P0001';
  END IF;

  SELECT *
  INTO v_invitation
  FROM invitations
  WHERE token = p_token
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_invite' USING ERRCODE = 'P0001';
  END IF;

  IF v_invitation.used_at IS NOT NULL THEN
    RAISE EXCEPTION 'invite_used' USING ERRCODE = 'P0001';
  END IF;

  IF v_invitation.expires_at IS NOT NULL AND v_invitation.expires_at <= NOW() THEN
    RAISE EXCEPTION 'invite_expired' USING ERRCODE = 'P0001';
  END IF;

  SELECT *
  INTO v_pool
  FROM pools
  WHERE id = v_invitation.pool_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_invite' USING ERRCODE = 'P0001';
  END IF;

  SELECT count(*)::INTEGER
  INTO v_entry_count
  FROM entries
  WHERE entries.pool_id = v_pool.id;

  IF v_entry_count >= v_pool.max_players THEN
    RAISE EXCEPTION 'pool_full' USING ERRCODE = 'P0001';
  END IF;

  BEGIN
    INSERT INTO users (email, name, password_hash)
    VALUES (v_invitation.email, trim(p_name), p_password_hash)
    RETURNING users.id INTO v_user_id;
  EXCEPTION
    WHEN unique_violation THEN
      RAISE EXCEPTION 'name_taken' USING ERRCODE = 'P0001';
  END;

  BEGIN
    INSERT INTO entries (pool_id, user_id)
    VALUES (v_pool.id, v_user_id)
    RETURNING entries.id INTO v_entry_id;
  EXCEPTION
    WHEN unique_violation THEN
      RAISE EXCEPTION 'already_in_pool' USING ERRCODE = 'P0001';
  END;

  UPDATE invitations
  SET
    used_at = NOW(),
    used_by = v_user_id
  WHERE id = v_invitation.id;

  RETURN QUERY
  SELECT v_entry_id, v_pool.id, v_user_id, trim(p_name);
END;
$$;

REVOKE ALL ON FUNCTION join_pool_with_invite(TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION join_pool_with_invite(TEXT, TEXT, TEXT) TO service_role;
