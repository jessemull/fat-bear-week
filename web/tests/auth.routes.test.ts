import { beforeEach, describe, expect, it, vi } from "vitest";

const consumeRateLimit = vi.fn();
const verifyTurnstileToken = vi.fn();
const getClientIp = vi.fn();
const joinWithInvite = vi.fn();
const findUserByLoginIdentifier = vi.fn();
const createSession = vi.fn();
const clearSessionCookie = vi.fn();
const verifyPassword = vi.fn();
const hashPassword = vi.fn();

vi.mock("@/lib/rate-limit.server", () => ({
  consumeRateLimit: (...args: unknown[]) => consumeRateLimit(...args),
}));

vi.mock("@/lib/turnstile.server", () => ({
  getClientIp: (...args: unknown[]) => getClientIp(...args),
  verifyTurnstileToken: (...args: unknown[]) => verifyTurnstileToken(...args),
}));

vi.mock("@/lib/auth.server", () => ({
  findUserByLoginIdentifier: (...args: unknown[]) =>
    findUserByLoginIdentifier(...args),
  joinWithInvite: (...args: unknown[]) => joinWithInvite(...args),
  parseJoinErrorMessage: (message: string) => {
    if (message.includes("invalid_credentials")) {
      return "invalid_credentials";
    }

    if (message.includes("invite_used")) {
      return "invite_used";
    }

    return null;
  },
}));

vi.mock("@/lib/sessions.server", () => ({
  clearSessionCookie: (...args: unknown[]) => clearSessionCookie(...args),
  createSession: (...args: unknown[]) => createSession(...args),
}));

vi.mock("@/lib/passwords.server", () => ({
  hashPassword: (...args: unknown[]) => hashPassword(...args),
  verifyPassword: (...args: unknown[]) => verifyPassword(...args),
}));

const joinBody = {
  name: "Otis",
  password: "password1",
  passwordConfirm: "password1",
  token: "t".repeat(32),
  turnstileToken: "token",
};

describe("auth route rate limits", () => {
  beforeEach(() => {
    vi.resetModules();
    consumeRateLimit.mockReset();
    verifyTurnstileToken.mockReset();
    getClientIp.mockReset();
    joinWithInvite.mockReset();
    findUserByLoginIdentifier.mockReset();
    createSession.mockReset();
    clearSessionCookie.mockReset();
    verifyPassword.mockReset();
    hashPassword.mockReset();
    getClientIp.mockReturnValue("127.0.0.1");
    hashPassword.mockResolvedValue("scrypt$dummy");
    verifyTurnstileToken.mockResolvedValue(true);
    clearSessionCookie.mockResolvedValue(undefined);
  });

  it("should return 429 when join IP rate limit denies", async () => {
    consumeRateLimit.mockReturnValue(false);

    const { POST } = await import("@/app/api/auth/join/route");
    const response = await POST(
      new Request("http://localhost/api/auth/join", {
        body: JSON.stringify(joinBody),
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
          "x-fbw-test-origin-bypass": "1",
        },
        method: "POST",
      }),
    );

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      error: "Too many join attempts. Try again shortly.",
    });
  });

  it("should return 429 when sign-in IP rate limit denies", async () => {
    consumeRateLimit.mockReturnValue(false);

    const { POST } = await import("@/app/api/auth/sign-in/route");
    const response = await POST(
      new Request("http://localhost/api/auth/sign-in", {
        body: JSON.stringify({
          identifier: "otis",
          password: "password1",
          turnstileToken: "token",
        }),
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
          "x-fbw-test-origin-bypass": "1",
        },
        method: "POST",
      }),
    );

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      error: "Too many sign-in attempts. Try again shortly.",
    });
  });

  it("should return 429 when sign-in identifier rate limit denies", async () => {
    consumeRateLimit.mockImplementation((params: { key: string }) => {
      return !params.key.startsWith("auth:sign-in:id:");
    });

    const { POST } = await import("@/app/api/auth/sign-in/route");
    const response = await POST(
      new Request("http://localhost/api/auth/sign-in", {
        body: JSON.stringify({
          identifier: "otis@example.com",
          password: "password1",
          turnstileToken: "token",
        }),
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
          "x-fbw-test-origin-bypass": "1",
        },
        method: "POST",
      }),
    );

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      error: "Too many sign-in attempts. Try again shortly.",
    });
    expect(findUserByLoginIdentifier).not.toHaveBeenCalled();
  });

  it("should return needsSignIn when join succeeds but session create fails", async () => {
    consumeRateLimit.mockReturnValue(true);
    joinWithInvite.mockResolvedValue({
      entryId: "e1",
      poolId: "p1",
      userId: "u1",
      userName: "Otis",
    });
    createSession.mockRejectedValue(new Error("session failed"));

    const { POST } = await import("@/app/api/auth/join/route");
    const response = await POST(
      new Request("http://localhost/api/auth/join", {
        body: JSON.stringify(joinBody),
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
          "x-fbw-test-origin-bypass": "1",
        },
        method: "POST",
      }),
    );

    expect(response.status).toBe(201);
    expect(clearSessionCookie).toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({
      data: {
        entryId: "e1",
        needsSignIn: true,
        poolId: "p1",
        userId: "u1",
        userName: "Otis",
      },
    });
  });

  it("should return 401 for invalid credentials on existing-user join", async () => {
    consumeRateLimit.mockReturnValue(true);
    joinWithInvite.mockRejectedValue(new Error("invalid_credentials"));

    const { POST } = await import("@/app/api/auth/join/route");
    const response = await POST(
      new Request("http://localhost/api/auth/join", {
        body: JSON.stringify(joinBody),
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
          "x-fbw-test-origin-bypass": "1",
        },
        method: "POST",
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Incorrect password for this account.",
    });
  });
});
