import type { MetadataRoute } from "next";

/**
 * Invite-only pool — allow the public landing page for discovery,
 * but keep future private app surfaces out of crawlers.
 */
export default function robots(): MetadataRoute.Robots {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://fatbearweek.net";

  return {
    rules: {
      allow: "/",
      disallow: ["/admin/", "/api/"],
      userAgent: "*",
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
