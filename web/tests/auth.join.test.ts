import { beforeEach, describe, expect, it, vi } from "vitest";

const fromMock = vi.fn();
const rpcMock = vi.fn();

vi.mock("@/lib/supabase.server", () => ({
  getServiceSupabase: () => ({
    from: fromMock,
    rpc: rpcMock,
  }),
}));

vi.mock("@/lib/passwords.server", () => ({
  hashPassword: vi.fn(async () => "scrypt$hashed"),
  verifyPassword: vi.fn(),
}));

describe("auth.server join/sign-in helpers", () => {
  beforeEach(() => {
    fromMock.mockReset();
    rpcMock.mockReset();
    vi.resetModules();
  });

  it("should return join result from RPC", async () => {
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

  it("should map RPC error codes", async () => {
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

    // Chain: from().select().ilike().maybeSingle()
    fromMock.mockImplementation(() => ({
      select: () => ({
        ilike: () => ({
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
        ilike: () => ({
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

  it("should reject name mismatches from ilike", async () => {
    fromMock.mockImplementation(() => ({
      select: () => ({
        ilike: () => ({
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              id: "u1",
              name: "Otter",
              password_hash: "hash",
            },
            error: null,
          }),
        }),
      }),
    }));

    const { findUserByName } = await import("@/lib/auth.server");

    await expect(findUserByName("otis")).resolves.toBeNull();
  });

  it("should throw on empty RPC results", async () => {
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
