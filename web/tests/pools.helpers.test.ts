import { describe, expect, it } from "vitest";

import { resolveInviteStatus } from "@/lib/invites.server";

describe("pools helpers (invite status reuse)", () => {
  it("should treat null used_at and null expiry as unused", () => {
    expect(
      resolveInviteStatus({
        expiresAt: null,
        usedAt: null,
      }),
    ).toBe("unused");
  });
});
