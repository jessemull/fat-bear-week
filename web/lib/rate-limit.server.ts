import "server-only";

interface RateBucket {
  hits: number[];
}

const buckets = new Map<string, RateBucket>();

/**
 * Sliding-window rate limit (in-memory per Node process / Vercel isolate).
 * Not shared across instances — use as a soft companion to Turnstile, not a
 * durable global limiter. Returns true when the call is allowed.
 */
export function consumeRateLimit(params: {
  key: string;
  limit: number;
  windowMs: number;
}): boolean {
  const { key, limit, windowMs } = params;
  const now = Date.now();
  const bucket = buckets.get(key) ?? { hits: [] };
  const recent = bucket.hits.filter((hit) => now - hit < windowMs);

  if (recent.length >= limit) {
    buckets.set(key, { hits: recent });
    return false;
  }

  recent.push(now);
  buckets.set(key, { hits: recent });

  return true;
}

/** Test helper — clear all buckets between cases. */
export function resetRateLimitBucketsForTests(): void {
  buckets.clear();
}
