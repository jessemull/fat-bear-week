import { describe, expect, it, vi } from "vitest";

describe("robots metadata route", () => {
  it("should point sitemap at the canonical www origin by default", async () => {
    vi.resetModules();
    delete process.env.NEXT_PUBLIC_SITE_URL;

    const robots = (await import("@/app/robots")).default;
    const result = robots();

    expect(result.sitemap).toBe("https://www.fatbearweek.net/sitemap.xml");
    expect(result.rules).toMatchObject({
      allow: "/",
      disallow: ["/admin/", "/api/", "/invite/", "/login", "/pools/"],
      userAgent: "*",
    });
  });
});

describe("sitemap metadata route", () => {
  it("should list the canonical www origin by default", async () => {
    vi.resetModules();
    delete process.env.NEXT_PUBLIC_SITE_URL;

    const sitemap = (await import("@/app/sitemap")).default;
    const result = sitemap();

    expect(result).toEqual([
      {
        changeFrequency: "weekly",
        priority: 1,
        url: "https://www.fatbearweek.net",
      },
    ]);
  });
});
