import "server-only";
import { createHash, randomBytes } from "node:crypto";

import { getServiceSupabase } from "@/lib/supabase.server";

export const DEFAULT_INVITE_TTL_MS = 1000 * 60 * 60 * 24 * 14;
export const INVITE_MINT_CONCURRENCY = 5;

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
  token_hash: string;
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

export function hashInviteToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
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
 * Run async work over items with a fixed concurrency limit.
 */
export async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) {
    return [];
  }

  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(items[index]!);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => worker(),
  );

  await Promise.all(workers);

  return results;
}

/**
 * Look up an invite by raw token for the public validate / join page.
 */
export async function getInviteByToken(
  token: string,
): Promise<InviteValidation | null> {
  const tokenHash = hashInviteToken(token);
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from("invitations")
    .select(
      "email, expires_at, id, name_hint, pool_id, token_hash, used_at, pools ( id, name )",
    )
    .eq("token_hash", tokenHash)
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
    token,
  };
}

/**
 * Create an individual invite for a pool (does not send email).
 * Stores only token_hash; returns the raw token once for the invite URL.
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
  const tokenHash = hashInviteToken(token);
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
      token_hash: tokenHash,
    })
    .select("email, expires_at, id, name_hint")
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
    token,
  };
}

/**
 * Replace the invite token hash and return a fresh raw token (email/resend).
 */
export async function rotateInviteToken(params: {
  inviteId: string;
  poolId: string;
}): Promise<MintedInvite | null> {
  const { inviteId, poolId } = params;
  const token = createInviteToken();
  const tokenHash = hashInviteToken(token);
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from("invitations")
    .update({ token_hash: tokenHash })
    .eq("id", inviteId)
    .eq("pool_id", poolId)
    .is("used_at", null)
    .select("email, expires_at, id, name_hint, used_at")
    .maybeSingle();

  if (error || !data || !data.email) {
    return null;
  }

  const status = resolveInviteStatus({
    expiresAt: (data.expires_at as null | string) ?? null,
    usedAt: (data.used_at as null | string) ?? null,
  });

  if (status !== "unused") {
    return null;
  }

  return {
    email: data.email as string,
    expiresAt: data.expires_at as string,
    id: data.id as string,
    nameHint: (data.name_hint as null | string) ?? null,
    token,
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
 * Load one invite for a pool (commissioner UI).
 */
export async function getInviteForPool(params: {
  inviteId: string;
  poolId: string;
}): Promise<ListedInvite | null> {
  const { inviteId, poolId } = params;
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from("invitations")
    .select("email, expires_at, id, name_hint, used_at")
    .eq("id", inviteId)
    .eq("pool_id", poolId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load invite: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return {
    email: (data.email as null | string) ?? null,
    expiresAt: (data.expires_at as null | string) ?? null,
    id: data.id as string,
    nameHint: (data.name_hint as null | string) ?? null,
    status: resolveInviteStatus({
      expiresAt: (data.expires_at as null | string) ?? null,
      usedAt: (data.used_at as null | string) ?? null,
    }),
  };
}

/**
 * Update invitee email / name hint for an unused invite.
 * Rotates the token when the email changes so the prior link cannot join.
 */
export async function updateInvite(params: {
  email: string;
  inviteId: string;
  nameHint?: null | string;
  poolId: string;
}): Promise<ListedInvite> {
  const email = params.email.trim().toLowerCase();
  const { inviteId, nameHint = null, poolId } = params;
  const supabase = getServiceSupabase();

  const existing = await getInviteForPool({ inviteId, poolId });

  if (!existing) {
    throw new Error("not_found");
  }

  if (existing.status === "used") {
    throw new Error("invite_used");
  }

  const { data: duplicate, error: duplicateError } = await supabase
    .from("invitations")
    .select("id")
    .eq("pool_id", poolId)
    .is("used_at", null)
    .ilike("email", email)
    .neq("id", inviteId)
    .maybeSingle();

  if (duplicateError) {
    throw new Error(`Failed to check invites: ${duplicateError.message}`);
  }

  if (duplicate) {
    throw new Error("email_invited");
  }

  const emailChanged =
    (existing.email ?? "").toLowerCase() !== email;
  const patch: Record<string, unknown> = {
    email,
    name_hint: nameHint,
  };

  if (emailChanged) {
    patch.token_hash = hashInviteToken(createInviteToken());
  }

  const { data, error } = await supabase
    .from("invitations")
    .update(patch)
    .eq("id", inviteId)
    .eq("pool_id", poolId)
    .select("email, expires_at, id, name_hint, used_at")
    .maybeSingle();

  if (error) {
    const message = error.message;

    if (message.includes("duplicate") || message.includes("unique")) {
      throw new Error("email_invited");
    }

    throw new Error(`Failed to update invite: ${message}`);
  }

  if (!data) {
    throw new Error("not_found");
  }

  return {
    email: (data.email as null | string) ?? null,
    expiresAt: (data.expires_at as null | string) ?? null,
    id: data.id as string,
    nameHint: (data.name_hint as null | string) ?? null,
    status: resolveInviteStatus({
      expiresAt: (data.expires_at as null | string) ?? null,
      usedAt: (data.used_at as null | string) ?? null,
    }),
  };
}

/**
 * Load an unused, non-expired invite and rotate its token for resend.
 */
export async function getResendableInvite(params: {
  inviteId: string;
  poolId: string;
}): Promise<MintedInvite | null> {
  const existing = await getInviteForPool(params);

  if (!existing || existing.status !== "unused" || !existing.email) {
    return null;
  }

  return rotateInviteToken(params);
}
