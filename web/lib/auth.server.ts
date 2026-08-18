import "server-only";

import { getInviteByToken, hashInviteToken } from "@/lib/invites.server";
import { hashPassword, verifyPassword } from "@/lib/passwords.server";
import { getServiceSupabase } from "@/lib/supabase.server";

export type JoinWithInviteErrorCode =
  | "already_in_pool"
  | "email_mismatch"
  | "email_taken"
  | "invalid_credentials"
  | "invalid_invite"
  | "invalid_name"
  | "invite_expired"
  | "invite_used"
  | "name_taken"
  | "pool_full";

export interface JoinWithInviteResult {
  entryId: string;
  poolId: string;
  userId: string;
  userName: string;
}

interface JoinRpcRow {
  entry_id: string;
  pool_id: string;
  user_id: string;
  user_name: string;
}

const JOIN_ERROR_CODES = new Set<JoinWithInviteErrorCode>([
  "already_in_pool",
  "email_mismatch",
  "email_taken",
  "invalid_credentials",
  "invalid_invite",
  "invalid_name",
  "invite_expired",
  "invite_used",
  "name_taken",
  "pool_full",
]);

export function parseJoinErrorMessage(
  message: string,
): JoinWithInviteErrorCode | null {
  for (const code of JOIN_ERROR_CODES) {
    if (message.includes(code)) {
      return code;
    }
  }

  return null;
}

function mapJoinRpcRow(data: unknown): JoinWithInviteResult {
  const row = (Array.isArray(data) ? data[0] : data) as JoinRpcRow | null;

  if (!row) {
    throw new Error("join_failed: empty result");
  }

  return {
    entryId: row.entry_id,
    poolId: row.pool_id,
    userId: row.user_id,
    userName: row.user_name,
  };
}

/**
 * Atomically join a pool via invite (Postgres RPC).
 * Existing accounts matched by invite email re-use the user after password check.
 */
export async function joinWithInvite(params: {
  name: string;
  password: string;
  token: string;
}): Promise<JoinWithInviteResult> {
  const invite = await getInviteByToken(params.token);

  if (!invite) {
    throw new Error("invalid_invite");
  }

  if (invite.status === "used") {
    throw new Error("invite_used");
  }

  if (invite.status === "expired") {
    throw new Error("invite_expired");
  }

  const tokenHash = hashInviteToken(params.token);
  const supabase = getServiceSupabase();

  if (invite.email) {
    const existing = await findUserByLoginIdentifier(invite.email);

    if (existing) {
      const passwordOk = await verifyPassword(
        params.password,
        existing.passwordHash,
      );

      if (!passwordOk) {
        throw new Error("invalid_credentials");
      }

      const { data, error } = await supabase.rpc(
        "join_existing_user_with_invite",
        {
          p_token_hash: tokenHash,
          p_user_id: existing.id,
        },
      );

      if (error) {
        const code = parseJoinErrorMessage(error.message);

        if (code) {
          throw new Error(code);
        }

        throw new Error(`join_failed: ${error.message}`);
      }

      return mapJoinRpcRow(data);
    }
  }

  if (params.name.includes("@")) {
    throw new Error("invalid_name");
  }

  const passwordHash = await hashPassword(params.password);

  const { data, error } = await supabase.rpc("join_pool_with_invite", {
    p_name: params.name,
    p_password_hash: passwordHash,
    p_token_hash: tokenHash,
  });

  if (error) {
    const code = parseJoinErrorMessage(error.message);

    if (code) {
      throw new Error(code);
    }

    throw new Error(`join_failed: ${error.message}`);
  }

  return mapJoinRpcRow(data);
}

/**
 * Find a user by case-insensitive display name for sign-in.
 */
export async function findUserByName(name: string): Promise<{
  id: string;
  name: string;
  passwordHash: string;
} | null> {
  const supabase = getServiceSupabase();
  const trimmed = name.trim();

  if (!trimmed) {
    return null;
  }

  const { data, error } = await supabase
    .from("users")
    .select("id, name, password_hash")
    .eq("name_lower", trimmed.toLowerCase())
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id as string,
    name: data.name as string,
    passwordHash: data.password_hash as string,
  };
}

/**
 * Find a user by email (case-insensitive) or display name for sign-in.
 * Identifiers with `@` try email first (exact lowercased match), then name.
 */
export async function findUserByLoginIdentifier(identifier: string): Promise<{
  id: string;
  name: string;
  passwordHash: string;
} | null> {
  const trimmed = identifier.trim();

  if (!trimmed) {
    return null;
  }

  if (trimmed.includes("@")) {
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from("users")
      .select("id, name, password_hash, email")
      .eq("email", trimmed.toLowerCase())
      .maybeSingle();

    if (error) {
      return null;
    }

    if (data?.email) {
      return {
        id: data.id as string,
        name: data.name as string,
        passwordHash: data.password_hash as string,
      };
    }
  }

  return findUserByName(trimmed);
}
