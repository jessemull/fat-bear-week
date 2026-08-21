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
    });
  });
});

describe("reset password referrer policy", () => {
  it("should send no-referrer on reset-password paths", async () => {
    const { default: nextConfig } = await import("../next.config");
    const headers = await nextConfig.headers?.();

    expect(headers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          headers: [
            {
              key: "Referrer-Policy",
              value: "no-referrer",
            },
          ],
          source: "/reset-password/:path*",
        }),
      ]),
    );
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
