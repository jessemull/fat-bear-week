import "server-only";
import { createHash, randomBytes } from "node:crypto";

import { findUserByEmail } from "@/lib/auth.server";
import { hashPassword } from "@/lib/passwords.server";
import { revokeSessionsForUser } from "@/lib/sessions.server";
import { requireSiteUrl } from "@/lib/site-url";
import { getServiceSupabase } from "@/lib/supabase.server";

export const PASSWORD_RESET_TTL_MS = 1000 * 60 * 60;

export type PasswordResetStatus = "expired" | "unused" | "used";

export interface IssuedPasswordReset {
  expiresAt: string;
  name: string;
  to: string;
  token: string;
}

export interface PasswordResetLookup {
  status: PasswordResetStatus;
  userId: string;
}

interface PasswordResetRow {
  expires_at: string;
  id: string;
  used_at: null | string;
  user_id: string;
}

function hashPasswordResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function createPasswordResetToken(): string {
  return randomBytes(32).toString("base64url");
}

export function resolvePasswordResetStatus(params: {
  expiresAt: string;
  now?: Date;
  usedAt: null | string;
}): PasswordResetStatus {
  const { expiresAt, now = new Date(), usedAt } = params;

  if (usedAt) {
    return "used";
  }

  if (new Date(expiresAt).getTime() <= now.getTime()) {
    return "expired";
  }

  return "unused";
}

/**
 * Build an absolute reset URL. Fails when NEXT_PUBLIC_SITE_URL is missing.
 */
export function buildPasswordResetUrl(token: string): string {
  const base = requireSiteUrl().replace(/\/$/, "");

  return `${base}/reset-password/${token}`;
}

/** Exported for unit tests — hash only. */
export function hashPasswordResetTokenForTests(token: string): string {
  return hashPasswordResetToken(token);
}

/** Exported for unit tests — generate opaque token. */
export function createPasswordResetTokenForTests(): string {
  return createPasswordResetToken();
}

/**
 * Look up a reset token without consuming it (page copy for invalid/used/expired).
 */
export async function getPasswordResetByToken(
  token: string,
): Promise<null | PasswordResetLookup> {
  const trimmed = token.trim();

  if (!trimmed) {
    return null;
  }

  const supabase = getServiceSupabase();
  const tokenHash = hashPasswordResetToken(trimmed);

  const { data, error } = await supabase
    .from("password_reset_tokens")
    .select("expires_at, id, used_at, user_id")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as PasswordResetRow;

  return {
    status: resolvePasswordResetStatus({
      expiresAt: row.expires_at,
      usedAt: row.used_at,
    }),
    userId: row.user_id,
  };
}

/**
 * Create a single-use reset token for the account matching this email.
 * Returns null when no account exists (caller still shows generic success).
 */
export async function issuePasswordReset(
  email: string,
): Promise<IssuedPasswordReset | null> {
  const user = await findUserByEmail(email);

  if (!user?.email) {
    return null;
  }

  const supabase = getServiceSupabase();

  const { error: deleteError } = await supabase
    .from("password_reset_tokens")
    .delete()
    .eq("user_id", user.id)
    .is("used_at", null);

  if (deleteError) {
    throw new Error(`Failed to rotate reset tokens: ${deleteError.message}`);
  }

  const token = createPasswordResetToken();
  const tokenHash = hashPasswordResetToken(token);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS).toISOString();

  const { error: insertError } = await supabase
    .from("password_reset_tokens")
    .insert({
      expires_at: expiresAt,
      token_hash: tokenHash,
      user_id: user.id,
    });

  if (insertError) {
    throw new Error(`Failed to create reset token: ${insertError.message}`);
  }

  return {
    expiresAt,
    name: user.name,
    to: user.email,
    token,
  };
}

/**
 * Consume a valid reset token, set the new password, and revoke every session.
 *
 * Mark the token used first (unused + unexpired only) so a race cannot apply
 * two password writes against the same link. Revoke sessions before storing
 * the new hash so a revoke failure cannot leave old cookies valid.
 */
export async function consumePasswordReset(params: {
  password: string;
  token: string;
}): Promise<{ userId: string; userName: string }> {
  const lookup = await getPasswordResetByToken(params.token);

  if (!lookup) {
    throw new Error("invalid_reset_token");
  }

  if (lookup.status === "used") {
    throw new Error("reset_token_used");
  }

  if (lookup.status === "expired") {
    throw new Error("reset_token_expired");
  }

  const supabase = getServiceSupabase();
  const tokenHash = hashPasswordResetToken(params.token.trim());
  const nowIso = new Date().toISOString();

  const { data: consumed, error: consumeError } = await supabase
    .from("password_reset_tokens")
    .update({ used_at: nowIso })
    .eq("token_hash", tokenHash)
    .is("used_at", null)
    .gt("expires_at", nowIso)
    .select("user_id")
    .maybeSingle();

  if (consumeError) {
    throw new Error(`Failed to consume reset token: ${consumeError.message}`);
  }

  if (!consumed) {
    throw new Error("reset_token_used");
  }

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, name")
    .eq("id", lookup.userId)
    .maybeSingle();

  if (userError || !user) {
    throw new Error("invalid_reset_token");
  }

  await revokeSessionsForUser({ userId: lookup.userId });

  const passwordHash = await hashPassword(params.password);
  const { error: updateError } = await supabase
    .from("users")
    .update({ password_hash: passwordHash })
    .eq("id", lookup.userId);

  if (updateError) {
    throw new Error(`Failed to update password: ${updateError.message}`);
  }

  return {
    userId: user.id as string,
    userName: user.name as string,
  };
}
