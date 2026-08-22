import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createPasswordResetTokenForTests,
  hashPasswordResetTokenForTests,
  PASSWORD_RESET_TTL_MS,
  resolvePasswordResetStatus,
} from "@/lib/password-reset.server";

describe("password-reset.server helpers", () => {
  it("should create opaque base64url tokens", () => {
    const token = createPasswordResetTokenForTests();

    expect(token.length).toBeGreaterThanOrEqual(40);
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("should hash tokens stably with sha256 hex", () => {
    const token = "test-reset-token-value";
    const first = hashPasswordResetTokenForTests(token);

    expect(first).toBe(hashPasswordResetTokenForTests(token));
    expect(first).toMatch(/^[a-f0-9]{64}$/);
    expect(hashPasswordResetTokenForTests("other")).not.toBe(first);
  });

  it("should treat used_at as consumed even when not expired", () => {
    expect(
      resolvePasswordResetStatus({
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        usedAt: new Date().toISOString(),
      }),
    ).toBe("used");
  });

  it("should mark past expires_at as expired when unused", () => {
    expect(
      resolvePasswordResetStatus({
        expiresAt: new Date(Date.now() - 60_000).toISOString(),
        usedAt: null,
      }),
    ).toBe("expired");
  });

  it("should mark future unused tokens as unused", () => {
    expect(
      resolvePasswordResetStatus({
        expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS).toISOString(),
        usedAt: null,
      }),
    ).toBe("unused");
  });
});

const fromMock = vi.fn();
const findUserByEmail = vi.fn();
const hashPassword = vi.fn();
const revokeSessionsForUser = vi.fn();

vi.mock("@/lib/supabase.server", () => ({
  getServiceSupabase: () => ({
    from: fromMock,
  }),
}));

vi.mock("@/lib/auth.server", () => ({
  findUserByEmail: (...args: unknown[]) => findUserByEmail(...args),
}));

vi.mock("@/lib/passwords.server", () => ({
  hashPassword: (...args: unknown[]) => hashPassword(...args),
}));

vi.mock("@/lib/sessions.server", () => ({
  revokeSessionsForUser: (...args: unknown[]) => revokeSessionsForUser(...args),
}));

describe("password-reset.server data access", () => {
  beforeEach(() => {
    fromMock.mockReset();
    findUserByEmail.mockReset();
    hashPassword.mockReset();
    revokeSessionsForUser.mockReset();
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
  });

  it("should return null for an unknown reset token", async () => {
    fromMock.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    });

    const { getPasswordResetByToken } = await import(
      "@/lib/password-reset.server"
    );

    await expect(getPasswordResetByToken("t".repeat(32))).resolves.toBeNull();
    await expect(getPasswordResetByToken("   ")).resolves.toBeNull();
  });

  it("should look up an unused reset token", async () => {
    fromMock.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({
              data: {
                expires_at: new Date(Date.now() + 60_000).toISOString(),
                id: "prt-1",
                used_at: null,
                user_id: "user-1",
              },
              error: null,
            }),
        }),
      }),
    });

    const { getPasswordResetByToken } = await import(
      "@/lib/password-reset.server"
    );
    const lookup = await getPasswordResetByToken("t".repeat(32));

    expect(lookup).toEqual({
      status: "unused",
      userId: "user-1",
    });
  });

  it("should return null when issuing a reset for an unknown email", async () => {
    findUserByEmail.mockResolvedValue(null);

    const { issuePasswordReset } = await import("@/lib/password-reset.server");

    await expect(issuePasswordReset("missing@example.com")).resolves.toBeNull();
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("should issue a reset token after rotating unused ones", async () => {
    findUserByEmail.mockResolvedValue({
      email: "otis@example.com",
      id: "user-1",
      name: "Otis",
      passwordHash: "hash",
    });
    fromMock.mockReturnValue({
      delete: () => ({
        eq: () => ({
          is: () => Promise.resolve({ error: null }),
        }),
      }),
      insert: () => Promise.resolve({ error: null }),
    });

    const { issuePasswordReset } = await import("@/lib/password-reset.server");
    const issued = await issuePasswordReset("otis@example.com");

    expect(issued).toMatchObject({
      name: "Otis",
      to: "otis@example.com",
    });
    expect(issued?.token.length).toBeGreaterThanOrEqual(40);
  });

  it("should consume a valid reset token", async () => {
    hashPassword.mockResolvedValue("scrypt$new");
    revokeSessionsForUser.mockResolvedValue(undefined);
    fromMock.mockImplementation((table: string) => {
      if (table === "password_reset_tokens") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () =>
                Promise.resolve({
                  data: {
                    expires_at: new Date(Date.now() + 60_000).toISOString(),
                    id: "prt-1",
                    used_at: null,
                    user_id: "user-1",
                  },
                  error: null,
                }),
            }),
          }),
          update: () => ({
            eq: () => ({
              is: () => ({
                gt: () => ({
                  select: () => ({
                    maybeSingle: () =>
                      Promise.resolve({
                        data: { user_id: "user-1" },
                        error: null,
                      }),
                  }),
                }),
              }),
            }),
          }),
        };
      }

      return {
        select: () => ({
          eq: () => ({
            maybeSingle: () =>
              Promise.resolve({
                data: { id: "user-1", name: "Otis" },
                error: null,
              }),
          }),
        }),
        update: () => ({
          eq: () => Promise.resolve({ error: null }),
        }),
      };
    });

    const { consumePasswordReset } = await import("@/lib/password-reset.server");
    const result = await consumePasswordReset({
      password: "password1",
      token: "t".repeat(32),
    });

    expect(result).toEqual({ userId: "user-1", userName: "Otis" });
    expect(revokeSessionsForUser).toHaveBeenCalledWith({ userId: "user-1" });
    expect(revokeSessionsForUser.mock.invocationCallOrder[0]).toBeLessThan(
      hashPassword.mock.invocationCallOrder[0] ?? Number.POSITIVE_INFINITY,
    );
  });

  it("should fail closed when the consume update matches zero rows", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "password_reset_tokens") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () =>
                Promise.resolve({
                  data: {
                    expires_at: new Date(Date.now() + 60_000).toISOString(),
                    id: "prt-1",
                    used_at: null,
                    user_id: "user-1",
                  },
                  error: null,
                }),
            }),
          }),
          update: () => ({
            eq: () => ({
              is: () => ({
                gt: () => ({
                  select: () => ({
                    maybeSingle: () =>
                      Promise.resolve({ data: null, error: null }),
                  }),
                }),
              }),
            }),
          }),
        };
      }

      return {};
    });

    const { consumePasswordReset } = await import("@/lib/password-reset.server");

    await expect(
      consumePasswordReset({ password: "password1", token: "t".repeat(32) }),
    ).rejects.toThrow("reset_token_used");
    expect(hashPassword).not.toHaveBeenCalled();
    expect(revokeSessionsForUser).not.toHaveBeenCalled();
  });

  it("should fail closed when marking the token used errors", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "password_reset_tokens") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () =>
                Promise.resolve({
                  data: {
                    expires_at: new Date(Date.now() + 60_000).toISOString(),
                    id: "prt-1",
                    used_at: null,
                    user_id: "user-1",
                  },
                  error: null,
                }),
            }),
          }),
          update: () => ({
            eq: () => ({
              is: () => ({
                gt: () => ({
                  select: () => ({
                    maybeSingle: () =>
                      Promise.resolve({
                        data: null,
                        error: { message: "write failed" },
                      }),
                  }),
                }),
              }),
            }),
          }),
        };
      }

      return {};
    });

    const { consumePasswordReset } = await import("@/lib/password-reset.server");

    await expect(
      consumePasswordReset({ password: "password1", token: "t".repeat(32) }),
    ).rejects.toThrow("Failed to consume reset token");
    expect(revokeSessionsForUser).not.toHaveBeenCalled();
  });

  it("should fail closed when session revoke fails before writing the new hash", async () => {
    hashPassword.mockResolvedValue("scrypt$new");
    revokeSessionsForUser.mockRejectedValue(
      new Error("Failed to revoke user sessions: boom"),
    );
    let passwordUpdated = false;

    fromMock.mockImplementation((table: string) => {
      if (table === "password_reset_tokens") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () =>
                Promise.resolve({
                  data: {
                    expires_at: new Date(Date.now() + 60_000).toISOString(),
                    id: "prt-1",
                    used_at: null,
                    user_id: "user-1",
                  },
                  error: null,
                }),
            }),
          }),
          update: () => ({
            eq: () => ({
              is: () => ({
                gt: () => ({
                  select: () => ({
                    maybeSingle: () =>
                      Promise.resolve({
                        data: { user_id: "user-1" },
                        error: null,
                      }),
                  }),
                }),
              }),
            }),
          }),
        };
      }

      return {
        select: () => ({
          eq: () => ({
            maybeSingle: () =>
              Promise.resolve({
                data: { id: "user-1", name: "Otis" },
                error: null,
              }),
          }),
        }),
        update: () => ({
          eq: () => {
            passwordUpdated = true;

            return Promise.resolve({ error: null });
          },
        }),
      };
    });

    const { consumePasswordReset } = await import("@/lib/password-reset.server");

    await expect(
      consumePasswordReset({ password: "password1", token: "t".repeat(32) }),
    ).rejects.toThrow("Failed to revoke user sessions");
    expect(hashPassword).not.toHaveBeenCalled();
    expect(passwordUpdated).toBe(false);
  });

  it("should reject used reset tokens", async () => {
    fromMock.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({
              data: {
                expires_at: new Date(Date.now() + 60_000).toISOString(),
                id: "prt-1",
                used_at: new Date().toISOString(),
                user_id: "user-1",
              },
              error: null,
            }),
        }),
      }),
    });

    const { consumePasswordReset } = await import("@/lib/password-reset.server");

    await expect(
      consumePasswordReset({ password: "password1", token: "t".repeat(32) }),
    ).rejects.toThrow("reset_token_used");
  });

  it("should build a reset URL from the site origin", async () => {
    const { buildPasswordResetUrl } = await import(
      "@/lib/password-reset.server"
    );

    expect(buildPasswordResetUrl("abc")).toBe(
      "http://localhost:3000/reset-password/abc",
    );
  });
});
