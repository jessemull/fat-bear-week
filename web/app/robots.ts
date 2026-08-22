import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site-url";

/**
 * Invite-only pool — allow the public landing page for discovery,
 * but keep future private app surfaces out of crawlers.
 */
export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      allow: "/",
      disallow: [
        "/admin/",
        "/api/",
        "/forgot-password",
        "/invite/",
        "/login",
        "/pools/",
        "/reset-password/",
        "/settings",
      ],

      userAgent: "*",
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
