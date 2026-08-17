import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createPoolBodySchema,
  joinBodySchema,
  mintInviteBodySchema,
  mintInvitesBodySchema,
  signInBodySchema,
  updateInviteBodySchema,
} from "@/lib/auth-schemas";

describe("auth-schemas", () => {
  it("should accept a valid join body", () => {
    const parsed = joinBodySchema.parse({
      name: "  Otis  ",
      password: "password1",
      passwordConfirm: "password1",
      token: "a".repeat(32),
      turnstileToken: "turnstile-ok",
    });

    expect(parsed.name).toBe("Otis");
  });

  it("should allow @ in join name at the schema layer", () => {
    const parsed = joinBodySchema.parse({
      name: "otis@friends",
      password: "password1",
      passwordConfirm: "password1",
      token: "a".repeat(32),
      turnstileToken: "turnstile-ok",
    });

    expect(parsed.name).toBe("otis@friends");
  });

  it("should reject short passwords on join", () => {
    const result = joinBodySchema.safeParse({
      name: "Otis",
      password: "short",
      passwordConfirm: "short",
      token: "a".repeat(32),
      turnstileToken: "turnstile-ok",
    });

    expect(result.success).toBe(false);
  });

  it("should reject mismatched password confirmation", () => {
    const result = joinBodySchema.safeParse({
      name: "Otis",
      password: "password1",
      passwordConfirm: "password2",
      token: "a".repeat(32),
      turnstileToken: "turnstile-ok",
    });

    expect(result.success).toBe(false);
  });

  it("should accept a valid sign-in body", () => {
    expect(
      signInBodySchema.parse({
        identifier: "Otis",
        password: "password1",
        turnstileToken: "turnstile-ok",
      }),
    ).toMatchObject({ identifier: "Otis" });

    expect(
      signInBodySchema.parse({
        identifier: "otis@example.com",
        password: "password1",
        turnstileToken: "turnstile-ok",
      }),
    ).toMatchObject({ identifier: "otis@example.com" });
  });

  it("should require email when minting invites", () => {
    expect(
      mintInviteBodySchema.safeParse({
        nameHint: "Jess",
      }).success,
    ).toBe(false);

    expect(
      mintInviteBodySchema.parse({
        email: "friend@example.com",
        nameHint: "Friend",
      }).email,
    ).toBe("friend@example.com");
  });

  it("should accept bulk invite emails", () => {
    expect(
      mintInvitesBodySchema.parse({
        invites: [
          { email: "a@example.com", nameHint: "A" },
          { email: "b@example.com" },
        ],
      }).invites,
    ).toEqual([
      { email: "a@example.com", nameHint: "A" },
      { email: "b@example.com" },
    ]);

    expect(mintInvitesBodySchema.safeParse({ invites: [] }).success).toBe(
      false,
    );
  });

  it("should accept invite updates", () => {
    expect(
      updateInviteBodySchema.parse({
        email: "friend@example.com",
        nameHint: null,
      }),
    ).toMatchObject({ email: "friend@example.com", nameHint: null });
  });

  it("should default pool create fields", () => {
    const parsed = createPoolBodySchema.parse({
      name: "Friends 2026",
      tournamentId: "11111111-1111-4111-8111-111111111111",
    });

    expect(parsed.maxPlayers).toBe(100);
    expect(parsed.scoringSystem).toBe("standard_1_2_4_8");
    expect(parsed.showBracketsBeforeLock).toBe(false);
  });
});

describe("turnstile.server", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("should accept tokens in test when keys are unset", async () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "");

    const { verifyTurnstileToken } = await import("@/lib/turnstile.server");

    await expect(verifyTurnstileToken("any-token")).resolves.toBe(true);
    await expect(verifyTurnstileToken("")).resolves.toBe(false);
  });

  it("should fail closed in production without a secret", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "site");

    const { verifyTurnstileToken } = await import("@/lib/turnstile.server");

    await expect(verifyTurnstileToken("token")).resolves.toBe(false);
  });

  it("should verify via Cloudflare siteverify", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "secret");
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "site");

    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ success: true }),
      ok: true,
    });

    vi.stubGlobal("fetch", fetchMock);

    const { verifyTurnstileToken } = await import("@/lib/turnstile.server");

    await expect(verifyTurnstileToken("tok", "1.2.3.4")).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalled();
  });

  it("should return false when siteverify fails", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "secret");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({ success: false }),
        ok: true,
      }),
    );

    const { verifyTurnstileToken } = await import("@/lib/turnstile.server");

    await expect(verifyTurnstileToken("tok")).resolves.toBe(false);
  });

  it("should reject empty tokens when a secret is configured", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "secret");

    const { verifyTurnstileToken } = await import("@/lib/turnstile.server");

    await expect(verifyTurnstileToken("")).resolves.toBe(false);
  });

  it("should reject in development when secret is missing", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "");

    const { verifyTurnstileToken } = await import("@/lib/turnstile.server");

    await expect(verifyTurnstileToken("tok")).resolves.toBe(false);
  });

  it("should return false when siteverify HTTP fails or throws", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "secret");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
      }),
    );

    const { verifyTurnstileToken } = await import("@/lib/turnstile.server");

    await expect(verifyTurnstileToken("tok")).resolves.toBe(false);

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    vi.resetModules();

    const again = await import("@/lib/turnstile.server");

    await expect(again.verifyTurnstileToken("tok")).resolves.toBe(false);
  });

  it("should read client IP from forwarded headers", async () => {
    const { getClientIp } = await import("@/lib/turnstile.server");

    expect(
      getClientIp(
        new Request("http://localhost", {
          headers: { "x-forwarded-for": "1.1.1.1, 2.2.2.2" },
        }),
      ),
    ).toBe("1.1.1.1");

    expect(
      getClientIp(
        new Request("http://localhost", {
          headers: { "x-real-ip": "9.9.9.9" },
        }),
      ),
    ).toBe("9.9.9.9");

    expect(getClientIp(new Request("http://localhost"))).toBeNull();
  });
});
