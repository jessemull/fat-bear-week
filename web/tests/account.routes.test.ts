import { beforeEach, describe, expect, it, vi } from "vitest";

const consumeRateLimit = vi.fn();
const verifyTurnstileToken = vi.fn();
const getClientIp = vi.fn();
const isEmailConfigured = vi.fn();
const sendPasswordResetEmail = vi.fn();
const issuePasswordReset = vi.fn();
const consumePasswordReset = vi.fn();
const createSession = vi.fn();
const clearSessionCookie = vi.fn();
const getSession = vi.fn();
const updateAccountName = vi.fn();
const changeAccountPassword = vi.fn();

vi.mock("@/lib/rate-limit.server", () => ({
  consumeRateLimit: (...args: unknown[]) => consumeRateLimit(...args),
}));

vi.mock("@/lib/turnstile.server", () => ({
  getClientIp: (...args: unknown[]) => getClientIp(...args),
  verifyTurnstileToken: (...args: unknown[]) => verifyTurnstileToken(...args),
}));

vi.mock("@/lib/email.server", () => ({
  isEmailConfigured: (...args: unknown[]) => isEmailConfigured(...args),
  sendPasswordResetEmail: (...args: unknown[]) => sendPasswordResetEmail(...args),
}));

vi.mock("@/lib/password-reset.server", () => ({
  buildPasswordResetUrl: (token: string) =>
    `http://localhost:3000/reset-password/${token}`,
  consumePasswordReset: (...args: unknown[]) => consumePasswordReset(...args),
  issuePasswordReset: (...args: unknown[]) => issuePasswordReset(...args),
}));

vi.mock("@/lib/sessions.server", () => ({
  clearSessionCookie: (...args: unknown[]) => clearSessionCookie(...args),
  createSession: (...args: unknown[]) => createSession(...args),
  getSession: (...args: unknown[]) => getSession(...args),
}));

vi.mock("@/lib/account.server", () => ({
  changeAccountPassword: (...args: unknown[]) => changeAccountPassword(...args),
  parseAccountErrorMessage: (message: string) => {
    if (message.includes("name_has_at")) {
      return "name_has_at";
    }

    if (message.includes("name_taken")) {
      return "name_taken";
    }

    if (message.includes("invalid_name")) {
      return "invalid_name";
    }

    return null;
  },
  updateAccountName: (...args: unknown[]) => updateAccountName(...args),
}));

const originHeaders = {
  "content-type": "application/json",
  origin: "http://localhost",
  "x-fbw-test-origin-bypass": "1",
};

describe("forgot / reset / account routes", () => {
  beforeEach(() => {
    vi.resetModules();
    consumeRateLimit.mockReset();
    verifyTurnstileToken.mockReset();
    getClientIp.mockReset();
    isEmailConfigured.mockReset();
    sendPasswordResetEmail.mockReset();
    issuePasswordReset.mockReset();
    consumePasswordReset.mockReset();
    createSession.mockReset();
    clearSessionCookie.mockReset();
    getSession.mockReset();
    updateAccountName.mockReset();
    changeAccountPassword.mockReset();
    getClientIp.mockReturnValue("127.0.0.1");
    consumeRateLimit.mockReturnValue(true);
    verifyTurnstileToken.mockResolvedValue(true);
    isEmailConfigured.mockReturnValue(true);
    getSession.mockResolvedValue({
      id: "user-1",
      isCommissioner: false,
      name: "Otis",
    });
  });

  it("should return 429 when forgot-password IP rate limit denies", async () => {
    consumeRateLimit.mockReturnValue(false);

    const { POST } = await import("@/app/api/auth/forgot-password/route");
    const response = await POST(
      new Request("http://localhost/api/auth/forgot-password", {
        body: JSON.stringify({
          email: "otis@example.com",
          turnstileToken: "token",
        }),
        headers: originHeaders,
        method: "POST",
      }),
    );

    expect(response.status).toBe(429);
    expect(issuePasswordReset).not.toHaveBeenCalled();
  });

  it("should return 503 when email is not configured", async () => {
    isEmailConfigured.mockReturnValue(false);

    const { POST } = await import("@/app/api/auth/forgot-password/route");
    const response = await POST(
      new Request("http://localhost/api/auth/forgot-password", {
        body: JSON.stringify({
          email: "otis@example.com",
          turnstileToken: "token",
        }),
        headers: originHeaders,
        method: "POST",
      }),
    );

    expect(response.status).toBe(503);
    expect(issuePasswordReset).not.toHaveBeenCalled();
  });

  it("should return generic success when the email is unknown", async () => {
    issuePasswordReset.mockResolvedValue(null);

    const { POST } = await import("@/app/api/auth/forgot-password/route");
    const response = await POST(
      new Request("http://localhost/api/auth/forgot-password", {
        body: JSON.stringify({
          email: "missing@example.com",
          turnstileToken: "token",
        }),
        headers: originHeaders,
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ data: { ok: true } });
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("should send a reset email when an account exists", async () => {
    issuePasswordReset.mockResolvedValue({
      expiresAt: "2026-08-20T21:00:00.000Z",
      name: "Otis",
      to: "otis@example.com",
      token: "t".repeat(32),
    });
    sendPasswordResetEmail.mockResolvedValue({ emailSent: true });

    const { POST } = await import("@/app/api/auth/forgot-password/route");
    const response = await POST(
      new Request("http://localhost/api/auth/forgot-password", {
        body: JSON.stringify({
          email: "otis@example.com",
          turnstileToken: "token",
        }),
        headers: originHeaders,
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    expect(sendPasswordResetEmail).toHaveBeenCalled();
  });

  it("should still return success when reset email send fails", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    issuePasswordReset.mockResolvedValue({
      expiresAt: "2026-08-20T21:00:00.000Z",
      name: "Otis",
      to: "otis@example.com",
      token: "t".repeat(32),
    });
    sendPasswordResetEmail.mockResolvedValue({
      emailSent: false,
      errorMessage: "boom",
    });

    const { POST } = await import("@/app/api/auth/forgot-password/route");
    const response = await POST(
      new Request("http://localhost/api/auth/forgot-password", {
        body: JSON.stringify({
          email: "otis@example.com",
          turnstileToken: "token",
        }),
        headers: originHeaders,
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    expect(errorSpy).toHaveBeenCalledWith("forgot-password send failed");
    expect(errorSpy.mock.calls.flat()).not.toContain("boom");
    errorSpy.mockRestore();
  });

  it("should still return success when issuing a reset throws", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    issuePasswordReset.mockRejectedValue(new Error("otis@example.com boom"));

    const { POST } = await import("@/app/api/auth/forgot-password/route");
    const response = await POST(
      new Request("http://localhost/api/auth/forgot-password", {
        body: JSON.stringify({
          email: "otis@example.com",
          turnstileToken: "token",
        }),
        headers: originHeaders,
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    expect(errorSpy).toHaveBeenCalledWith("forgot-password issue failed");
    expect(errorSpy.mock.calls.flat()).not.toContain("otis@example.com boom");
    errorSpy.mockRestore();
  });

  it("should consume a reset token and create a session", async () => {
    consumePasswordReset.mockResolvedValue({
      userId: "user-1",
      userName: "Otis",
    });
    createSession.mockResolvedValue(undefined);

    const { POST } = await import("@/app/api/auth/reset-password/route");
    const response = await POST(
      new Request("http://localhost/api/auth/reset-password", {
        body: JSON.stringify({
          password: "password1",
          passwordConfirm: "password1",
          token: "t".repeat(32),
          turnstileToken: "token",
        }),
        headers: originHeaders,
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: {
        needsSignIn: false,
      },
    });
  });

  it("should return needsSignIn when reset session create fails", async () => {
    consumePasswordReset.mockResolvedValue({
      userId: "user-1",
      userName: "Otis",
    });
    createSession.mockRejectedValue(new Error("session failed"));
    clearSessionCookie.mockResolvedValue(undefined);

    const { POST } = await import("@/app/api/auth/reset-password/route");
    const response = await POST(
      new Request("http://localhost/api/auth/reset-password", {
        body: JSON.stringify({
          password: "password1",
          passwordConfirm: "password1",
          token: "t".repeat(32),
          turnstileToken: "token",
        }),
        headers: originHeaders,
        method: "POST",
      }),
    );

    expect(clearSessionCookie).toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({
      data: {
        needsSignIn: true,
      },
    });
  });

  it("should map used reset tokens to 400", async () => {
    consumePasswordReset.mockRejectedValue(new Error("reset_token_used"));

    const { POST } = await import("@/app/api/auth/reset-password/route");
    const response = await POST(
      new Request("http://localhost/api/auth/reset-password", {
        body: JSON.stringify({
          password: "password1",
          passwordConfirm: "password1",
          token: "t".repeat(32),
          turnstileToken: "token",
        }),
        headers: originHeaders,
        method: "POST",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "This reset link has already been used.",
    });
  });

  it("should reject account name updates when signed out", async () => {
    getSession.mockResolvedValue(null);

    const { PATCH } = await import("@/app/api/account/route");
    const response = await PATCH(
      new Request("http://localhost/api/account", {
        body: JSON.stringify({ name: "Otis" }),
        headers: originHeaders,
        method: "PATCH",
      }),
    );

    expect(response.status).toBe(401);
    expect(updateAccountName).not.toHaveBeenCalled();
  });

  it("should update the display name", async () => {
    updateAccountName.mockResolvedValue({ name: "Otis" });

    const { PATCH } = await import("@/app/api/account/route");
    const response = await PATCH(
      new Request("http://localhost/api/account", {
        body: JSON.stringify({ name: "Otis" }),
        headers: originHeaders,
        method: "PATCH",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: { name: "Otis" },
    });
  });

  it("should map name_has_at from the helper", async () => {
    updateAccountName.mockRejectedValue(new Error("name_has_at"));

    const { PATCH } = await import("@/app/api/account/route");
    const response = await PATCH(
      new Request("http://localhost/api/account", {
        body: JSON.stringify({ name: "Otis" }),
        headers: originHeaders,
        method: "PATCH",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Display names cannot include @.",
    });
  });

  it("should return 400 for a blank display name from the helper", async () => {
    updateAccountName.mockRejectedValue(new Error("invalid_name"));

    const { PATCH } = await import("@/app/api/account/route");
    const response = await PATCH(
      new Request("http://localhost/api/account", {
        body: JSON.stringify({ name: "Otis" }),
        headers: originHeaders,
        method: "PATCH",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Enter a display name.",
    });
  });

  it("should return 409 when the display name is taken", async () => {
    updateAccountName.mockRejectedValue(new Error("name_taken"));

    const { PATCH } = await import("@/app/api/account/route");
    const response = await PATCH(
      new Request("http://localhost/api/account", {
        body: JSON.stringify({ name: "Otis" }),
        headers: originHeaders,
        method: "PATCH",
      }),
    );

    expect(response.status).toBe(409);
  });

  it("should change password for a signed-in user", async () => {
    changeAccountPassword.mockResolvedValue(undefined);

    const { POST } = await import("@/app/api/account/password/route");
    const response = await POST(
      new Request("http://localhost/api/account/password", {
        body: JSON.stringify({
          currentPassword: "password1",
          password: "password2",
          passwordConfirm: "password2",
        }),
        headers: originHeaders,
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    expect(changeAccountPassword).toHaveBeenCalled();
  });

  it("should return 429 when account password IP rate limit denies", async () => {
    consumeRateLimit.mockReturnValue(false);

    const { POST } = await import("@/app/api/account/password/route");
    const response = await POST(
      new Request("http://localhost/api/account/password", {
        body: JSON.stringify({
          currentPassword: "password1",
          password: "password2",
          passwordConfirm: "password2",
        }),
        headers: originHeaders,
        method: "POST",
      }),
    );

    expect(response.status).toBe(429);
    expect(changeAccountPassword).not.toHaveBeenCalled();
  });

  it("should return 429 when account password user rate limit denies", async () => {
    consumeRateLimit.mockImplementation((params: { key: string }) => {
      return !params.key.startsWith("auth:account-password:user:");
    });

    const { POST } = await import("@/app/api/account/password/route");
    const response = await POST(
      new Request("http://localhost/api/account/password", {
        body: JSON.stringify({
          currentPassword: "password1",
          password: "password2",
          passwordConfirm: "password2",
        }),
        headers: originHeaders,
        method: "POST",
      }),
    );

    expect(response.status).toBe(429);
    expect(changeAccountPassword).not.toHaveBeenCalled();
  });

  it("should return 401 for an incorrect current password", async () => {
    changeAccountPassword.mockRejectedValue(new Error("invalid_credentials"));

    const { POST } = await import("@/app/api/account/password/route");
    const response = await POST(
      new Request("http://localhost/api/account/password", {
        body: JSON.stringify({
          currentPassword: "password1",
          password: "password2",
          passwordConfirm: "password2",
        }),
        headers: originHeaders,
        method: "POST",
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Current password is incorrect.",
    });
  });
});
