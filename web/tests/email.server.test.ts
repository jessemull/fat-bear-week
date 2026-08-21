import { afterEach, describe, expect, it, vi } from "vitest";

const sendMock = vi.fn();

vi.mock("resend", () => ({
  Resend: class {
    emails = {
      send: sendMock,
    };
  },
}));

describe("email.server", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    sendMock.mockReset();
  });

  it("should return emailSent false when env is missing", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("EMAIL_FROM", "");

    const { sendInviteEmail } = await import("@/lib/email.server");

    const result = await sendInviteEmail({
      expiresAt: "2026-08-25T00:00:00.000Z",
      inviteUrl: "http://localhost:3000/invite/abc",
      poolName: "Friends",
      to: "friend@example.com",
    });

    expect(result.emailSent).toBe(false);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("should send via Resend when configured", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("EMAIL_FROM", "Fat Bear Week <invites@fatbearweek.net>");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
    sendMock.mockResolvedValue({ data: { id: "msg_1" }, error: null });

    const { buildInviteUrl, sendInviteEmail } = await import(
      "@/lib/email.server"
    );

    const result = await sendInviteEmail({
      expiresAt: "2026-08-25T00:00:00.000Z",
      inviteUrl: "http://localhost:3000/invite/tokentoken",
      nameHint: "Jess <script>",
      poolName: "Friends & Co",
      to: "friend@example.com",
    });

    expect(result.emailSent).toBe(true);
    expect(sendMock).toHaveBeenCalledOnce();
    expect(sendMock.mock.calls[0][0]).toMatchObject({
      from: "Fat Bear Week <invites@fatbearweek.net>",
      to: "friend@example.com",
    });
    expect(sendMock.mock.calls[0][0].subject).toContain("Friends & Co");
    expect(sendMock.mock.calls[0][0].html).toContain("Jess &lt;script&gt;");
    expect(sendMock.mock.calls[0][0].html).toContain("Friends &amp; Co");
    expect(sendMock.mock.calls[0][0].text).toContain(
      "http://localhost:3000/invite/tokentoken",
    );
    expect(buildInviteUrl("abc")).toContain("/invite/abc");
  });

  it("should strip CR/LF from pool names in email subjects", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("EMAIL_FROM", "invites@fatbearweek.net");
    sendMock.mockResolvedValue({ data: { id: "msg_1" }, error: null });

    const { sendInviteEmail } = await import("@/lib/email.server");

    await sendInviteEmail({
      expiresAt: "2026-08-25T00:00:00.000Z",
      inviteUrl: "http://localhost:3000/invite/abc",
      poolName: "Friends\r\nBcc: evil@example.com",
      to: "friend@example.com",
    });

    expect(sendMock.mock.calls[0][0].subject).toBe(
      "You're invited to Friends Bcc: evil@example.com — Fat Bear Week Fantasy Bracket",
    );
    expect(sendMock.mock.calls[0][0].subject).not.toMatch(/[\r\n]/);
  });

  it("should fail buildInviteUrl without NEXT_PUBLIC_SITE_URL", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");

    const { buildInviteUrl } = await import("@/lib/email.server");

    expect(() => buildInviteUrl("abc")).toThrow(
      "NEXT_PUBLIC_SITE_URL is not configured.",
    );
  });

  it("should return emailSent false when Resend errors", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("EMAIL_FROM", "invites@fatbearweek.net");
    sendMock.mockResolvedValue({
      data: null,
      error: { message: "boom" },
    });

    const { sendInviteEmail } = await import("@/lib/email.server");

    const result = await sendInviteEmail({
      expiresAt: "2026-08-25T00:00:00.000Z",
      inviteUrl: "http://localhost:3000/invite/abc",
      poolName: "Friends",
      to: "friend@example.com",
    });

    expect(result.emailSent).toBe(false);
    expect(result.errorMessage).toBe("boom");
  });

  it("should return emailSent false when Resend throws", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("EMAIL_FROM", "invites@fatbearweek.net");
    sendMock.mockRejectedValue(new Error("network down"));

    const { sendInviteEmail } = await import("@/lib/email.server");

    const result = await sendInviteEmail({
      expiresAt: "2026-08-25T00:00:00.000Z",
      inviteUrl: "http://localhost:3000/invite/abc",
      nameHint: "Jess",
      poolName: "Friends",
      to: "friend@example.com",
    });

    expect(result.emailSent).toBe(false);
    expect(result.errorMessage).toBe("network down");
  });

  it("should report when email is not configured", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("EMAIL_FROM", "");

    const { isEmailConfigured } = await import("@/lib/email.server");

    expect(isEmailConfigured()).toBe(false);
  });

  it("should send a password reset email when configured", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("EMAIL_FROM", "Fat Bear Week <invites@fatbearweek.net>");
    sendMock.mockResolvedValue({ data: { id: "msg_1" }, error: null });

    const { isEmailConfigured, sendPasswordResetEmail } = await import(
      "@/lib/email.server"
    );

    expect(isEmailConfigured()).toBe(true);

    const result = await sendPasswordResetEmail({
      expiresAt: "2026-08-25T00:00:00.000Z",
      name: "Jess <script>",
      resetUrl: "http://localhost:3000/reset-password/tokentoken",
      to: "friend@example.com",
    });

    expect(result.emailSent).toBe(true);
    expect(sendMock.mock.calls[0][0].subject).toBe(
      "Reset your Fat Bear Week password",
    );
    expect(sendMock.mock.calls[0][0].html).toContain("Jess &lt;script&gt;");
    expect(sendMock.mock.calls[0][0].text).toContain(
      "http://localhost:3000/reset-password/tokentoken",
    );
  });
});
