-- 008_join_existing_user_with_invite.sql
-- Allow an existing account (matched by invite email) to join another pool.

CREATE OR REPLACE FUNCTION join_existing_user_with_invite(
  p_token_hash TEXT,
  p_user_id UUID
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
  v_entry_count INTEGER;
  v_entry_id UUID;
  v_invitation invitations%ROWTYPE;
  v_pool pools%ROWTYPE;
  v_user users%ROWTYPE;
BEGIN
  IF p_token_hash IS NULL OR length(trim(p_token_hash)) = 0 THEN
    RAISE EXCEPTION 'invalid_invite' USING ERRCODE = 'P0001';
  END IF;

  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'invalid_invite' USING ERRCODE = 'P0001';
  END IF;

  SELECT *
  INTO v_invitation
  FROM invitations
  WHERE token_hash = p_token_hash
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
  INTO v_user
  FROM users
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_invite' USING ERRCODE = 'P0001';
  END IF;

  IF v_invitation.email IS NULL
     OR v_user.email IS NULL
     OR lower(v_user.email) <> lower(v_invitation.email) THEN
    RAISE EXCEPTION 'email_taken' USING ERRCODE = 'P0001';
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
    INSERT INTO entries (pool_id, user_id)
    VALUES (v_pool.id, v_user.id)
    RETURNING entries.id INTO v_entry_id;
  EXCEPTION
    WHEN unique_violation THEN
      RAISE EXCEPTION 'already_in_pool' USING ERRCODE = 'P0001';
  END;

  UPDATE invitations
  SET
    used_at = NOW(),
    used_by = v_user.id
  WHERE id = v_invitation.id;

  RETURN QUERY
  SELECT v_entry_id, v_pool.id, v_user.id, v_user.name;
END;
$$;

REVOKE ALL ON FUNCTION join_existing_user_with_invite(TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION join_existing_user_with_invite(TEXT, UUID) TO service_role;
