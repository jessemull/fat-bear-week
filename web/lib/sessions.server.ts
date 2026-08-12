import "server-only";
import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";

import { getServiceSupabase } from "@/lib/supabase.server";

export const SESSION_COOKIE_NAME = "fbw_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export interface SessionUser {
  id: string;
  isCommissioner: boolean;
  name: string;
}

interface SessionRow {
  expires_at: string;
  id: string;
  user_id: string;
  users:
    | {
        id: string;
        is_commissioner: boolean;
        name: string;
      }
    | {
        id: string;
        is_commissioner: boolean;
        name: string;
      }[]
    | null;
}

function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function createRawSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

function isSecureCookie(): boolean {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  return siteUrl.startsWith("https://") || process.env.NODE_ENV === "production";
}

function sessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    maxAge,
    path: "/",
    sameSite: "lax" as const,
    secure: isSecureCookie(),
  };
}

function unwrapUser(
  users: SessionRow["users"],
): { id: string; is_commissioner: boolean; name: string } | null {
  if (!users) {
    return null;
  }

  if (Array.isArray(users)) {
    return users[0] ?? null;
  }

  return users;
}

/**
 * Create a DB session and set the HTTP-only cookie.
 */
export async function createSession(userId: string): Promise<void> {
  const token = createRawSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(
    Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
  ).toISOString();
  const supabase = getServiceSupabase();

  const { error } = await supabase.from("sessions").insert({
    expires_at: expiresAt,
    token_hash: tokenHash,
    user_id: userId,
  });

  if (error) {
    throw new Error(`Failed to create session: ${error.message}`);
  }

  const cookieStore = await cookies();

  cookieStore.set(
    SESSION_COOKIE_NAME,
    token,
    sessionCookieOptions(SESSION_MAX_AGE_SECONDS),
  );
}

/**
 * Resolve the current session from the cookie, or null if missing/expired.
 */
export async function getSession(): Promise<null | SessionUser> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const tokenHash = hashSessionToken(token);
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from("sessions")
    .select("expires_at, id, user_id, users ( id, is_commissioner, name )")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as SessionRow;

  if (new Date(row.expires_at).getTime() <= Date.now()) {
    await supabase.from("sessions").delete().eq("id", row.id);
    cookieStore.set(SESSION_COOKIE_NAME, "", sessionCookieOptions(0));

    return null;
  }

  const user = unwrapUser(row.users);

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    isCommissioner: Boolean(user.is_commissioner),
    name: user.name,
  };
}

/**
 * Revoke the current session row (if any) and clear the cookie.
 */
export async function revokeSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    const tokenHash = hashSessionToken(token);
    const supabase = getServiceSupabase();

    await supabase.from("sessions").delete().eq("token_hash", tokenHash);
  }

  cookieStore.set(SESSION_COOKIE_NAME, "", sessionCookieOptions(0));
}

/** Exported for unit tests — hash only, no cookie I/O. */
export function hashSessionTokenForTests(token: string): string {
  return hashSessionToken(token);
}

/** Exported for unit tests — generate opaque token. */
export function createRawSessionTokenForTests(): string {
  return createRawSessionToken();
}
