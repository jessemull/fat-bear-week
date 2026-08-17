import { beforeEach, describe, expect, it, vi } from "vitest";

const consumeRateLimit = vi.fn();
const verifyTurnstileToken = vi.fn();
const getClientIp = vi.fn();
const joinWithInvite = vi.fn();
const findUserByLoginIdentifier = vi.fn();
const createSession = vi.fn();
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
  parseJoinErrorMessage: (message: string) =>
    message.includes("invite_used") ? "invite_used" : null,
}));

vi.mock("@/lib/sessions.server", () => ({
  createSession: (...args: unknown[]) => createSession(...args),
}));

vi.mock("@/lib/passwords.server", () => ({
  hashPassword: (...args: unknown[]) => hashPassword(...args),
  verifyPassword: (...args: unknown[]) => verifyPassword(...args),
}));

describe("auth route rate limits", () => {
  beforeEach(() => {
    vi.resetModules();
    consumeRateLimit.mockReset();
    verifyTurnstileToken.mockReset();
    getClientIp.mockReset();
    joinWithInvite.mockReset();
    findUserByLoginIdentifier.mockReset();
    createSession.mockReset();
    verifyPassword.mockReset();
    hashPassword.mockReset();
    getClientIp.mockReturnValue("127.0.0.1");
    hashPassword.mockResolvedValue("scrypt$dummy");
  });

  it("should return 429 when join IP rate limit denies", async () => {
    consumeRateLimit.mockReturnValue(false);

    const { POST } = await import("@/app/api/auth/join/route");
    const response = await POST(
      new Request("http://localhost/api/auth/join", {
        headers: {
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
});
