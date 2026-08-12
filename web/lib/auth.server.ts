import "server-only";

import { hashPassword } from "@/lib/passwords.server";
import { getServiceSupabase } from "@/lib/supabase.server";

export type JoinWithInviteErrorCode =
  | "already_in_pool"
  | "email_taken"
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
  "email_taken",
  "invite_expired",
  "invite_used",
  "invalid_invite",
  "invalid_name",
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

/**
 * Atomically join a pool via invite (Postgres RPC).
 */
export async function joinWithInvite(params: {
  name: string;
  password: string;
  token: string;
}): Promise<JoinWithInviteResult> {
  const passwordHash = await hashPassword(params.password);
  const supabase = getServiceSupabase();

  const { data, error } = await supabase.rpc("join_pool_with_invite", {
    p_name: params.name,
    p_password_hash: passwordHash,
    p_token: params.token,
  });

  if (error) {
    const code = parseJoinErrorMessage(error.message);

    if (code) {
      throw new Error(code);
    }

    throw new Error(`join_failed: ${error.message}`);
  }

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
 * Find a user by case-insensitive display name for sign-in.
 */
export async function findUserByName(name: string): Promise<{
  id: string;
  name: string;
  passwordHash: string;
} | null> {
  const supabase = getServiceSupabase();
  const trimmed = name.trim();

  const { data, error } = await supabase
    .from("users")
    .select("id, name, password_hash")
    .ilike("name", trimmed)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  // ilike can match substrings depending on pattern; require exact ignore-case.
  if (data.name.toLowerCase() !== trimmed.toLowerCase()) {
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
      .ilike("email", trimmed)
      .maybeSingle();

    if (error || !data?.email) {
      return null;
    }

    if (data.email.toLowerCase() !== trimmed.toLowerCase()) {
      return null;
    }

    return {
      id: data.id as string,
      name: data.name as string,
      passwordHash: data.password_hash as string,
    };
  }

  return findUserByName(trimmed);
}
