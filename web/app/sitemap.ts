import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site-url";

/** Public marketing surfaces only — private pool routes stay out of the sitemap. */
export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();

  return [
    {
      changeFrequency: "weekly",
      priority: 1,
      url: siteUrl,
    },
  ];
}
