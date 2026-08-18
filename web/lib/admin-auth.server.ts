import "server-only";

import type { NextResponse } from "next/server";

import { jsonError } from "@/lib/api.server";
import { getSession, type SessionUser } from "@/lib/sessions.server";

/**
 * Require an authenticated commissioner session for admin mutations.
 */
export async function requireCommissioner(): Promise<
  { error: NextResponse } | { session: SessionUser }
> {
  const session = await getSession();

  if (!session) {
    return { error: jsonError("Unauthorized.", { status: 401 }) };
  }

  if (!session.isCommissioner) {
    return { error: jsonError("Forbidden.", { status: 403 }) };
  }

  return { session };
}
