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
    sendMock.mockResolvedValue({ data: { id: "msg_1" }, error: null });

    const { buildInviteUrl, sendInviteEmail } = await import(
      "@/lib/email.server"
    );

    const result = await sendInviteEmail({
      expiresAt: "2026-08-25T00:00:00.000Z",
      inviteUrl: "http://localhost:3000/invite/tokentoken",
      nameHint: "Jess",
      poolName: "Friends",
      to: "friend@example.com",
    });

    expect(result.emailSent).toBe(true);
    expect(sendMock).toHaveBeenCalledOnce();
    expect(sendMock.mock.calls[0][0]).toMatchObject({
      from: "Fat Bear Week <invites@fatbearweek.net>",
      to: "friend@example.com",
    });
    expect(sendMock.mock.calls[0][0].subject).toContain("Friends");
    expect(sendMock.mock.calls[0][0].text).toContain(
      "http://localhost:3000/invite/tokentoken",
    );
    expect(buildInviteUrl("abc")).toContain("/invite/abc");
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
});
