import { afterEach, describe, expect, it } from "vitest";

import {
  consumeRateLimit,
  resetRateLimitBucketsForTests,
} from "@/lib/rate-limit.server";

describe("rate-limit.server", () => {
  afterEach(() => {
    resetRateLimitBucketsForTests();
  });

  it("should allow requests under the limit and block when exceeded", () => {
    expect(
      consumeRateLimit({ key: "t", limit: 2, windowMs: 60_000 }),
    ).toBe(true);
    expect(
      consumeRateLimit({ key: "t", limit: 2, windowMs: 60_000 }),
    ).toBe(true);
    expect(
      consumeRateLimit({ key: "t", limit: 2, windowMs: 60_000 }),
    ).toBe(false);
  });
});
