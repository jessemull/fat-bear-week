import { z } from "zod";

const DEFAULT_SITE_URL = "https://www.fatbearweek.net";

const siteUrlSchema = z
  .string()
  .trim()
  .url()
  .optional()
  .catch(undefined);

/**
 * Canonical public site origin for robots, sitemap, and absolute links.
 * Prefers NEXT_PUBLIC_SITE_URL when it is a valid URL.
 */
export function getSiteUrl(
  envValue: null | string | undefined = process.env.NEXT_PUBLIC_SITE_URL,
): string {
  const parsed = siteUrlSchema.parse(envValue || undefined);

  return parsed ?? DEFAULT_SITE_URL;
}

export { DEFAULT_SITE_URL };
