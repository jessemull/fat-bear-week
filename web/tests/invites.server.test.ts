import { describe, expect, it } from "vitest";

import {
  createInviteToken,
  DEFAULT_INVITE_TTL_MS,
  defaultInviteExpiresAt,
  resolveInviteStatus,
} from "@/lib/invites.server";

describe("invites.server", () => {
  it("should create unguessable invite tokens", () => {
    const token = createInviteToken();

    expect(token.length).toBeGreaterThanOrEqual(40);
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("should treat used_at as consumed even when not expired", () => {
    expect(
      resolveInviteStatus({
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        usedAt: new Date().toISOString(),
      }),
    ).toBe("used");
  });

  it("should mark past expires_at as expired when unused", () => {
    expect(
      resolveInviteStatus({
        expiresAt: new Date(Date.now() - 60_000).toISOString(),
        usedAt: null,
      }),
    ).toBe("expired");
  });

  it("should mark future invites as unused", () => {
    expect(
      resolveInviteStatus({
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        usedAt: null,
      }),
    ).toBe("unused");
  });

  it("should default expiry to about 14 days", () => {
    const now = new Date("2026-08-11T12:00:00.000Z");
    const expires = new Date(defaultInviteExpiresAt(now)).getTime();

    expect(expires - now.getTime()).toBe(DEFAULT_INVITE_TTL_MS);
  });
});
