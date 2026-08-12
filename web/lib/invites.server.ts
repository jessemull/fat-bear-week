import "server-only";
import { randomBytes } from "node:crypto";

import { getServiceSupabase } from "@/lib/supabase.server";

export const DEFAULT_INVITE_TTL_MS = 1000 * 60 * 60 * 24 * 14;

export type InviteStatus = "expired" | "unused" | "used";

export interface InviteValidation {
  email: null | string;
  expiresAt: null | string;
  nameHint: null | string;
  poolId: string;
  poolName: string;
  status: InviteStatus;
  token: string;
}

export interface MintedInvite {
  email: string;
  expiresAt: string;
  id: string;
  nameHint: null | string;
  token: string;
}

interface InvitationRow {
  email: null | string;
  expires_at: null | string;
  id: string;
  name_hint: null | string;
  pool_id: string;
  pools: { id: string; name: string } | { id: string; name: string }[] | null;
  token: string;
  used_at: null | string;
}

function unwrapPool(
  pools: InvitationRow["pools"],
): { id: string; name: string } | null {
  if (!pools) {
    return null;
  }

  if (Array.isArray(pools)) {
    return pools[0] ?? null;
  }

  return pools;
}

export function createInviteToken(): string {
  return randomBytes(32).toString("base64url");
}

export function resolveInviteStatus(params: {
  expiresAt: null | string;
  now?: Date;
  usedAt: null | string;
}): InviteStatus {
  const { expiresAt, now = new Date(), usedAt } = params;

  if (usedAt) {
    return "used";
  }

  if (expiresAt && new Date(expiresAt).getTime() <= now.getTime()) {
    return "expired";
  }

  return "unused";
}

export function defaultInviteExpiresAt(now: Date = new Date()): string {
  return new Date(now.getTime() + DEFAULT_INVITE_TTL_MS).toISOString();
}

/**
 * Look up an invite by token for the public validate endpoint.
 */
export async function getInviteByToken(
  token: string,
): Promise<InviteValidation | null> {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from("invitations")
    .select(
      "email, expires_at, id, name_hint, pool_id, token, used_at, pools ( id, name )",
    )
    .eq("token", token)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as InvitationRow;
  const pool = unwrapPool(row.pools);

  if (!pool) {
    return null;
  }

  return {
    email: row.email,
    expiresAt: row.expires_at,
    nameHint: row.name_hint,
    poolId: pool.id,
    poolName: pool.name,
    status: resolveInviteStatus({
      expiresAt: row.expires_at,
      usedAt: row.used_at,
    }),
    token: row.token,
  };
}

/**
 * Create an individual invite for a pool (does not send email).
 */
export async function mintInvite(params: {
  email: string;
  expiresAt?: string;
  nameHint?: null | string;
  poolId: string;
}): Promise<MintedInvite> {
  const email = params.email.trim().toLowerCase();
  const { nameHint = null, poolId } = params;
  const expiresAt = params.expiresAt ?? defaultInviteExpiresAt();
  const token = createInviteToken();
  const supabase = getServiceSupabase();

  const { data: existing, error: existingError } = await supabase
    .from("invitations")
    .select("id")
    .eq("pool_id", poolId)
    .is("used_at", null)
    .ilike("email", email)
    .maybeSingle();

  if (existingError) {
    throw new Error(`Failed to check invites: ${existingError.message}`);
  }

  if (existing) {
    throw new Error("email_invited");
  }

  const { data, error } = await supabase
    .from("invitations")
    .insert({
      email,
      expires_at: expiresAt,
      name_hint: nameHint,
      pool_id: poolId,
      token,
    })
    .select("email, expires_at, id, name_hint, token")
    .single();

  if (error || !data) {
    const message = error?.message ?? "unknown";

    if (message.includes("duplicate") || message.includes("unique")) {
      throw new Error("email_invited");
    }

    throw new Error(`Failed to mint invite: ${message}`);
  }

  return {
    email: data.email as string,
    expiresAt: data.expires_at as string,
    id: data.id as string,
    nameHint: (data.name_hint as null | string) ?? null,
    token: data.token as string,
  };
}

export interface ListedInvite {
  email: null | string;
  expiresAt: null | string;
  id: string;
  nameHint: null | string;
  status: InviteStatus;
}

/**
 * List invites for a pool (commissioner UI).
 */
export async function listInvitesForPool(
  poolId: string,
): Promise<ListedInvite[]> {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from("invitations")
    .select("email, expires_at, id, name_hint, used_at")
    .eq("pool_id", poolId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to list invites: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    email: (row.email as null | string) ?? null,
    expiresAt: (row.expires_at as null | string) ?? null,
    id: row.id as string,
    nameHint: (row.name_hint as null | string) ?? null,
    status: resolveInviteStatus({
      expiresAt: (row.expires_at as null | string) ?? null,
      usedAt: (row.used_at as null | string) ?? null,
    }),
  }));
}

/**
 * Load an unused, non-expired invite owned by a pool (for resend).
 */
export async function getResendableInvite(params: {
  inviteId: string;
  poolId: string;
}): Promise<MintedInvite | null> {
  const { inviteId, poolId } = params;
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from("invitations")
    .select("email, expires_at, id, name_hint, token, used_at")
    .eq("id", inviteId)
    .eq("pool_id", poolId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const status = resolveInviteStatus({
    expiresAt: (data.expires_at as null | string) ?? null,
    usedAt: (data.used_at as null | string) ?? null,
  });

  if (status !== "unused" || !data.email) {
    return null;
  }

  return {
    email: data.email as string,
    expiresAt: data.expires_at as string,
    id: data.id as string,
    nameHint: (data.name_hint as null | string) ?? null,
    token: data.token as string,
  };
}
