import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";

interface JsonErrorOptions {
  status?: number;
}

interface JsonDataOptions {
  status?: number;
}

/**
 * Standard success envelope: { data }.
 */
export function jsonData<T>(
  data: T,
  options: JsonDataOptions = {},
): NextResponse {
  const { status = 200 } = options;

  return NextResponse.json({ data }, { status });
}

/**
 * Standard error envelope: { error }.
 */
export function jsonError(
  error: string,
  options: JsonErrorOptions = {},
): NextResponse {
  const { status = 400 } = options;

  return NextResponse.json({ error }, { status });
}

/**
 * CSRF defense for cookie-session mutations: Origin/Referer host must match
 * the request host (or NEXT_PUBLIC_SITE_URL host when set).
 *
 * Fail closed when both Origin and Referer are missing. Vitest may send
 * `x-fbw-test-origin-bypass: 1` when NODE_ENV=test.
 */
export function assertSameOrigin(request: Request): boolean {
  if (
    process.env.NODE_ENV === "test" &&
    request.headers.get("x-fbw-test-origin-bypass") === "1"
  ) {
    return true;
  }

  const requestUrl = new URL(request.url);
  const allowedHosts = new Set<string>([requestUrl.host]);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (siteUrl) {
    try {
      allowedHosts.add(new URL(siteUrl).host);
    } catch {
      // Ignore invalid site URL — request host still applies.
    }
  }

  const origin = request.headers.get("origin");

  if (origin) {
    try {
      return allowedHosts.has(new URL(origin).host);
    } catch {
      return false;
    }
  }

  const referer = request.headers.get("referer");

  if (referer) {
    try {
      return allowedHosts.has(new URL(referer).host);
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Parse JSON body with a Zod schema; returns { data } or { error Response }.
 */
export async function parseJsonBody<T extends z.ZodType>(
  request: Request,
  schema: T,
): Promise<{ data: z.infer<T> } | { error: NextResponse }> {
  let json: unknown;

  try {
    json = await request.json();
  } catch {
    return { error: jsonError("Invalid JSON body.", { status: 400 }) };
  }

  const parsed = schema.safeParse(json);

  if (!parsed.success) {
    return { error: jsonError("Invalid request body.", { status: 400 }) };
  }

  return { data: parsed.data };
}
