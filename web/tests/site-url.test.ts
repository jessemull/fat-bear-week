import { afterEach, describe, expect, it } from "vitest";

import {
  DEFAULT_SITE_URL,
  getSiteUrl,
  requireSiteUrl,
} from "@/lib/site-url";

describe("getSiteUrl", () => {
  const original = process.env.NEXT_PUBLIC_SITE_URL;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    } else {
      process.env.NEXT_PUBLIC_SITE_URL = original;
    }
  });

  it("should default to the canonical www origin when unset", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;

    expect(getSiteUrl(undefined)).toBe(DEFAULT_SITE_URL);
    expect(DEFAULT_SITE_URL).toBe("https://www.fatbearweek.net");
  });

  it("should use a valid NEXT_PUBLIC_SITE_URL override", () => {
    expect(getSiteUrl("https://preview.example.com")).toBe(
      "https://preview.example.com",
    );
  });

  it("should fall back when the override is not a URL", () => {
    expect(getSiteUrl("not-a-url")).toBe(DEFAULT_SITE_URL);
    expect(getSiteUrl("")).toBe(DEFAULT_SITE_URL);
  });

  it("should require a configured site URL for invite links", () => {
    expect(() => requireSiteUrl(undefined)).toThrow(
      "NEXT_PUBLIC_SITE_URL is not configured.",
    );
    expect(requireSiteUrl("https://preview.example.com")).toBe(
      "https://preview.example.com",
    );
  });
});
