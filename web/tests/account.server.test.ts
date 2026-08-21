import { beforeEach, describe, expect, it, vi } from "vitest";

const fromMock = vi.fn();
const hashPassword = vi.fn();
const verifyPassword = vi.fn();
const revokeOtherSessions = vi.fn();

vi.mock("@/lib/supabase.server", () => ({
  getServiceSupabase: () => ({
    from: fromMock,
  }),
}));

vi.mock("@/lib/passwords.server", () => ({
  hashPassword: (...args: unknown[]) => hashPassword(...args),
  verifyPassword: (...args: unknown[]) => verifyPassword(...args),
}));

vi.mock("@/lib/sessions.server", () => ({
  revokeOtherSessions: (...args: unknown[]) => revokeOtherSessions(...args),
}));

describe("account.server", () => {
  beforeEach(() => {
    fromMock.mockReset();
    hashPassword.mockReset();
    verifyPassword.mockReset();
    revokeOtherSessions.mockReset();
    vi.resetModules();
  });

  it("should load an account row", async () => {
    fromMock.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({
              data: {
                email: "otis@example.com",
                id: "user-1",
                name: "Otis",
              },
              error: null,
            }),
        }),
      }),
    });

    const { getAccount } = await import("@/lib/account.server");

    await expect(getAccount("user-1")).resolves.toEqual({
      email: "otis@example.com",
      id: "user-1",
      name: "Otis",
    });
  });

  it("should reject display names that include @", async () => {
    const { updateAccountName } = await import("@/lib/account.server");

    await expect(
      updateAccountName({ name: "otis@friends", userId: "user-1" }),
    ).rejects.toThrow("invalid_name");
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("should map unique violations to name_taken", async () => {
    fromMock.mockReturnValue({
      update: () => ({
        eq: () => ({
          select: () => ({
            maybeSingle: () =>
              Promise.resolve({
                data: null,
                error: { code: "23505", message: "duplicate" },
              }),
          }),
        }),
      }),
    });

    const { updateAccountName } = await import("@/lib/account.server");

    await expect(
      updateAccountName({ name: "Otis", userId: "user-1" }),
    ).rejects.toThrow("name_taken");
  });

  it("should update a display name", async () => {
    fromMock.mockReturnValue({
      update: () => ({
        eq: () => ({
          select: () => ({
            maybeSingle: () =>
              Promise.resolve({
                data: { name: "Otis" },
                error: null,
              }),
          }),
        }),
      }),
    });

    const { updateAccountName } = await import("@/lib/account.server");

    await expect(
      updateAccountName({ name: "  Otis  ", userId: "user-1" }),
    ).resolves.toEqual({ name: "Otis" });
  });

  it("should reject an incorrect current password", async () => {
    fromMock.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({
              data: { password_hash: "scrypt$old" },
              error: null,
            }),
        }),
      }),
    });
    verifyPassword.mockResolvedValue(false);

    const { changeAccountPassword } = await import("@/lib/account.server");

    await expect(
      changeAccountPassword({
        currentPassword: "wrongpass",
        newPassword: "password2",
        userId: "user-1",
      }),
    ).rejects.toThrow("invalid_credentials");
    expect(revokeOtherSessions).not.toHaveBeenCalled();
  });

  it("should update the password hash and revoke other sessions", async () => {
    fromMock.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({
              data: { password_hash: "scrypt$old" },
              error: null,
            }),
        }),
      }),
      update: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    });
    verifyPassword.mockResolvedValue(true);
    hashPassword.mockResolvedValue("scrypt$new");
    revokeOtherSessions.mockResolvedValue(undefined);

    const { changeAccountPassword } = await import("@/lib/account.server");

    await changeAccountPassword({
      currentPassword: "password1",
      newPassword: "password2",
      userId: "user-1",
    });

    expect(hashPassword).toHaveBeenCalledWith("password2");
    expect(revokeOtherSessions).toHaveBeenCalledWith("user-1");
  });

  it("should parse account error codes", async () => {
    const { parseAccountErrorMessage } = await import("@/lib/account.server");

    expect(parseAccountErrorMessage("name_taken")).toBe("name_taken");
    expect(parseAccountErrorMessage("invalid_name")).toBe("invalid_name");
    expect(parseAccountErrorMessage("other")).toBeNull();
  });
});
