import type { MetadataRoute } from "next";

/** Public marketing surfaces only — private pool routes stay out of the sitemap. */
export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://fatbearweek.net";

  return [
    {
      changeFrequency: "weekly",
      priority: 1,
      url: siteUrl,
    },
  ];
}
