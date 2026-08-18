import "server-only";

interface TurnstileSiteverifyResponse {
  "error-codes"?: string[];
  success: boolean;
}

/**
 * Verify a Cloudflare Turnstile token via siteverify.
 * Fail closed in production when the secret is missing.
 * In NODE_ENV=test with no keys configured, accept any non-empty token
 * so unit tests do not need live Cloudflare.
 */
export async function verifyTurnstileToken(
  token: string,
  ip?: null | string,
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim() ?? "";
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";

  if (!secret) {
    if (process.env.NODE_ENV === "test" && !siteKey) {
      return token.length > 0;
    }

    if (process.env.NODE_ENV === "production") {
      return false;
    }

    // Local/dev without keys: reject so misconfig is obvious.
    return false;
  }

  if (!token) {
    return false;
  }

  const body = new URLSearchParams();

  body.set("response", token);
  body.set("secret", secret);

  if (ip) {
    body.set("remoteip", ip);
  }

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        body,
        headers: { "content-type": "application/x-www-form-urlencoded" },
        method: "POST",
      },
    );

    if (!response.ok) {
      return false;
    }

    const json = (await response.json()) as TurnstileSiteverifyResponse;

    return Boolean(json.success);
  } catch {
    return false;
  }
}

export function getClientIp(request: Request): null | string {
  const forwarded = request.headers.get("x-forwarded-for");

  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();

    return first || null;
  }

  return request.headers.get("x-real-ip");
}
