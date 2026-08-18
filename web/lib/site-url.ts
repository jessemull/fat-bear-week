import { z } from "zod";

const FALLBACK_SITE_URL = "https://www.fatbearweek.net";

const siteUrlSchema = z.string().trim().url();

/**
 * Public site origin for SEO routes (robots / sitemap).
 * Prefers NEXT_PUBLIC_SITE_URL; falls back only for static metadata.
 */
export function getSiteUrl(
  envValue: null | string | undefined = process.env.NEXT_PUBLIC_SITE_URL,
): string {
  const parsed = siteUrlSchema.safeParse(envValue || undefined);

  return parsed.success ? parsed.data : FALLBACK_SITE_URL;
}

/**
 * Required site origin for invite links and other absolute emails.
 * Never falls back to production — misconfig must fail loudly.
 */
export function requireSiteUrl(
  envValue: null | string | undefined = process.env.NEXT_PUBLIC_SITE_URL,
): string {
  const parsed = siteUrlSchema.safeParse(envValue || undefined);

  if (!parsed.success) {
    throw new Error("NEXT_PUBLIC_SITE_URL is not configured.");
  }

  return parsed.data;
}

export { FALLBACK_SITE_URL as DEFAULT_SITE_URL };
