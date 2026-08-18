import { describe, expect, it } from "vitest";

import {
  createRawSessionTokenForTests,
  hashSessionTokenForTests,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/sessions.server";

describe("sessions.server", () => {
  it("should export the shared cookie contract", () => {
    expect(SESSION_COOKIE_NAME).toBe("fbw_session");
    expect(SESSION_MAX_AGE_SECONDS).toBe(60 * 60 * 24 * 30);
  });

  it("should create opaque base64url tokens", () => {
    const token = createRawSessionTokenForTests();

    expect(token.length).toBeGreaterThanOrEqual(40);
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("should hash tokens stably with sha256 hex", () => {
    const token = "test-session-token-value";
    const first = hashSessionTokenForTests(token);
    const second = hashSessionTokenForTests(token);

    expect(first).toBe(second);
    expect(first).toMatch(/^[a-f0-9]{64}$/);
    expect(hashSessionTokenForTests("other")).not.toBe(first);
  });
});
