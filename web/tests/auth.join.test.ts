import { beforeEach, describe, expect, it, vi } from "vitest";

const fromMock = vi.fn();
const rpcMock = vi.fn();
const verifyPassword = vi.fn();

vi.mock("@/lib/supabase.server", () => ({
  getServiceSupabase: () => ({
    from: fromMock,
    rpc: rpcMock,
  }),
}));

vi.mock("@/lib/passwords.server", () => ({
  hashPassword: vi.fn(async () => "scrypt$hashed"),
  verifyPassword: (...args: unknown[]) => verifyPassword(...args),
}));

function mockUnusedInvite(email: null | string = null) {
  fromMock.mockImplementationOnce(() => ({
    select: () => ({
      eq: () => ({
        maybeSingle: () =>
          Promise.resolve({
            data: {
              email,
              expires_at: null,
              id: "inv-1",
              name_hint: null,
              pool_id: "p1",
              pools: { id: "p1", name: "Pool" },
              token_hash: "hashed",
              used_at: null,
            },
            error: null,
          }),
      }),
    }),
  }));
}

describe("auth.server join/sign-in helpers", () => {
  beforeEach(() => {
    fromMock.mockReset();
    rpcMock.mockReset();
    verifyPassword.mockReset();
    vi.resetModules();
  });

  it("should return join result from RPC", async () => {
    mockUnusedInvite(null);
    rpcMock.mockResolvedValue({
      data: [
        {
          entry_id: "e1",
          pool_id: "p1",
          user_id: "u1",
          user_name: "Otis",
        },
      ],
      error: null,
    });

    const { joinWithInvite } = await import("@/lib/auth.server");
    const result = await joinWithInvite({
      name: "Otis",
      password: "password1",
      token: "t".repeat(32),
    });

    expect(result).toEqual({
      entryId: "e1",
      poolId: "p1",
      userId: "u1",
      userName: "Otis",
    });
    expect(rpcMock).toHaveBeenCalledWith(
      "join_pool_with_invite",
      expect.objectContaining({
        p_name: "Otis",
        p_password_hash: "scrypt$hashed",
        p_token_hash: expect.any(String),
      }),
    );
  });

  it("should join an existing user into another pool", async () => {
    mockUnusedInvite("otis@example.com");
    verifyPassword.mockResolvedValue(true);
    fromMock.mockImplementationOnce(() => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({
              data: {
                email: "otis@example.com",
                id: "u1",
                name: "Otis",
                password_hash: "hash",
              },
              error: null,
            }),
        }),
      }),
    }));
    rpcMock.mockResolvedValue({
      data: {
        entry_id: "e2",
        pool_id: "p2",
        user_id: "u1",
        user_name: "Otis",
      },
      error: null,
    });

    const { joinWithInvite } = await import("@/lib/auth.server");
    const result = await joinWithInvite({
      name: "Ignored",
      password: "password1",
      token: "t".repeat(32),
    });

    expect(result).toEqual({
      entryId: "e2",
      poolId: "p2",
      userId: "u1",
      userName: "Otis",
    });
    expect(rpcMock).toHaveBeenCalledWith(
      "join_existing_user_with_invite",
      expect.objectContaining({
        p_token_hash: expect.any(String),
        p_user_id: "u1",
      }),
    );
  });

  it("should reject existing-user join with the wrong password", async () => {
    mockUnusedInvite("otis@example.com");
    verifyPassword.mockResolvedValue(false);
    fromMock.mockImplementationOnce(() => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({
              data: {
                email: "otis@example.com",
                id: "u1",
                name: "Otis",
                password_hash: "hash",
              },
              error: null,
            }),
        }),
      }),
    }));

    const { joinWithInvite } = await import("@/lib/auth.server");

    await expect(
      joinWithInvite({
        name: "Otis",
        password: "wrong-password",
        token: "t".repeat(32),
      }),
    ).rejects.toThrow("email_taken");
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("should map existing-user join RPC error codes", async () => {
    mockUnusedInvite("otis@example.com");
    verifyPassword.mockResolvedValue(true);
    fromMock.mockImplementationOnce(() => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({
              data: {
                email: "otis@example.com",
                id: "u1",
                name: "Otis",
                password_hash: "hash",
              },
              error: null,
            }),
        }),
      }),
    }));
    rpcMock.mockResolvedValue({
      data: null,
      error: { message: "already_in_pool" },
    });

    const { joinWithInvite } = await import("@/lib/auth.server");

    await expect(
      joinWithInvite({
        name: "Otis",
        password: "password1",
        token: "t".repeat(32),
      }),
    ).rejects.toThrow("already_in_pool");
  });

  it("should throw invalid_invite when the invite token is unknown", async () => {
    fromMock.mockImplementationOnce(() => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({
              data: null,
              error: null,
            }),
        }),
      }),
    }));

    const { joinWithInvite } = await import("@/lib/auth.server");

    await expect(
      joinWithInvite({
        name: "Otis",
        password: "password1",
        token: "t".repeat(32),
      }),
    ).rejects.toThrow("invalid_invite");
  });

  it("should map RPC error codes", async () => {
    mockUnusedInvite(null);
    rpcMock.mockResolvedValue({
      data: null,
      error: { message: "invite_used" },
    });

    const { joinWithInvite } = await import("@/lib/auth.server");

    await expect(
      joinWithInvite({
        name: "Otis",
        password: "password1",
        token: "t".repeat(32),
      }),
    ).rejects.toThrow("invite_used");
  });

  it("should find users by exact case-insensitive name", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: "u1",
        name: "Otis",
        password_hash: "hash",
      },
      error: null,
    });

    fromMock.mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          maybeSingle,
        }),
      }),
    }));

    const { findUserByName } = await import("@/lib/auth.server");
    const user = await findUserByName("otis");

    expect(user).toEqual({
      id: "u1",
      name: "Otis",
      passwordHash: "hash",
    });
  });

  it("should find users by email via login identifier", async () => {
    fromMock.mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              email: "otis@example.com",
              id: "u1",
              name: "Otis",
              password_hash: "hash",
            },
            error: null,
          }),
        }),
      }),
    }));

    const { findUserByLoginIdentifier } = await import("@/lib/auth.server");
    const user = await findUserByLoginIdentifier("Otis@Example.com");

    expect(user).toEqual({
      id: "u1",
      name: "Otis",
      passwordHash: "hash",
    });
  });

  it("should return null when name_lower lookup misses", async () => {
    fromMock.mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          maybeSingle: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      }),
    }));

    const { findUserByName } = await import("@/lib/auth.server");

    await expect(findUserByName("otis")).resolves.toBeNull();
  });

  it("should throw on empty RPC results", async () => {
    mockUnusedInvite(null);
    rpcMock.mockResolvedValue({
      data: [],
      error: null,
    });

    const { joinWithInvite } = await import("@/lib/auth.server");

    await expect(
      joinWithInvite({
        name: "Otis",
        password: "password1",
        token: "t".repeat(32),
      }),
    ).rejects.toThrow(/empty result/);
  });

  it("should throw join_failed for unknown RPC errors", async () => {
    mockUnusedInvite(null);
    rpcMock.mockResolvedValue({
      data: null,
      error: { message: "connection reset" },
    });

    const { joinWithInvite } = await import("@/lib/auth.server");

    await expect(
      joinWithInvite({
        name: "Otis",
        password: "password1",
        token: "t".repeat(32),
      }),
    ).rejects.toThrow(/join_failed/);
  });
});
