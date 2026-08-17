import { beforeEach, describe, expect, it, vi } from "vitest";

const fromMock = vi.fn();

vi.mock("@/lib/supabase.server", () => ({
  getServiceSupabase: () => ({
    from: fromMock,
  }),
}));

describe("invites.server data access", () => {
  beforeEach(() => {
    fromMock.mockReset();
    vi.resetModules();
  });

  it("should validate an unused invite by token", async () => {
    fromMock.mockReturnValue({
      eq: () => ({
        maybeSingle: () =>
          Promise.resolve({
            data: {
              email: "a@example.com",
              expires_at: new Date(Date.now() + 60_000).toISOString(),
              id: "inv-1",
              name_hint: "Alex",
              pool_id: "pool-1",
              pools: { id: "pool-1", name: "Friends" },
              token_hash: "hashed",
              used_at: null,
            },
            error: null,
          }),
      }),
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({
              data: {
                email: "a@example.com",
                expires_at: new Date(Date.now() + 60_000).toISOString(),
                id: "inv-1",
                name_hint: "Alex",
                pool_id: "pool-1",
                pools: { id: "pool-1", name: "Friends" },
                token_hash: "hashed",
                used_at: null,
              },
              error: null,
            }),
        }),
      }),
    });

    const { getInviteByToken } = await import("@/lib/invites.server");
    const invite = await getInviteByToken("t".repeat(32));

    expect(invite?.status).toBe("unused");
    expect(invite?.poolName).toBe("Friends");
  });

  it("should mint an invite row", async () => {
    fromMock.mockImplementation(() => ({
      insert: () => ({
        select: () => ({
          single: () =>
            Promise.resolve({
              data: {
                email: "a@example.com",
                expires_at: "2026-08-25T00:00:00.000Z",
                id: "inv-1",
                name_hint: "Alex",
              },
              error: null,
            }),
        }),
      }),
      select: () => ({
        eq: () => ({
          is: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: null, error: null }),
            }),
          }),
        }),
      }),
    }));

    const { mintInvite } = await import("@/lib/invites.server");
    const invite = await mintInvite({
      email: "a@example.com",
      nameHint: "Alex",
      poolId: "pool-1",
    });

    expect(invite.id).toBe("inv-1");
    expect(invite.email).toBe("a@example.com");
    expect(invite.token.length).toBeGreaterThan(20);
  });

  it("should reject a duplicate unused invite email", async () => {
    fromMock.mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          is: () => ({
            eq: () => ({
              maybeSingle: () =>
                Promise.resolve({ data: { id: "existing" }, error: null }),
            }),
          }),
        }),
      }),
    }));

    const { mintInvite } = await import("@/lib/invites.server");

    await expect(
      mintInvite({
        email: "a@example.com",
        poolId: "pool-1",
      }),
    ).rejects.toThrow("email_invited");
  });

  it("should validate an unused invite email on getInviteByToken", async () => {
    fromMock.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({
              data: {
                email: "a@example.com",
                expires_at: new Date(Date.now() + 60_000).toISOString(),
                id: "inv-1",
                name_hint: "Alex",
                pool_id: "pool-1",
                pools: { id: "pool-1", name: "Friends" },
                token_hash: "hashed",
                used_at: null,
              },
              error: null,
            }),
        }),
      }),
    });

    const { getInviteByToken } = await import("@/lib/invites.server");
    const invite = await getInviteByToken("t".repeat(32));

    expect(invite?.email).toBe("a@example.com");
  });

  it("should list invites for a pool", async () => {
    fromMock.mockReturnValue({
      eq: () => ({
        order: () =>
          Promise.resolve({
            data: [
              {
                email: "a@example.com",
                expires_at: null,
                id: "inv-1",
                name_hint: null,
                used_at: "2026-08-01T00:00:00.000Z",
              },
            ],
            error: null,
          }),
      }),
      select: () => ({
        eq: () => ({
          order: () =>
            Promise.resolve({
              data: [
                {
                  email: "a@example.com",
                  expires_at: null,
                  id: "inv-1",
                  name_hint: null,
                  used_at: "2026-08-01T00:00:00.000Z",
                },
              ],
              error: null,
            }),
        }),
      }),
    });

    const { listInvitesForPool } = await import("@/lib/invites.server");
    const invites = await listInvitesForPool("pool-1");

    expect(invites[0]?.status).toBe("used");
  });

  it("should return null for non-resendable invites", async () => {
    fromMock.mockReturnValue({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: () =>
              Promise.resolve({
                data: {
                  email: "a@example.com",
                  expires_at: null,
                  id: "inv-1",
                  name_hint: null,
                  used_at: "2026-08-01T00:00:00.000Z",
                },
                error: null,
              }),
          }),
        }),
      }),
    });

    const { getResendableInvite } = await import("@/lib/invites.server");
    const invite = await getResendableInvite({
      inviteId: "inv-1",
      poolId: "pool-1",
    });

    expect(invite).toBeNull();
  });

  it("should return resendable unused invites", async () => {
    fromMock
      .mockReturnValueOnce({
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: () =>
                Promise.resolve({
                  data: {
                    email: "a@example.com",
                    expires_at: new Date(Date.now() + 60_000).toISOString(),
                    id: "inv-1",
                    name_hint: "Alex",
                    used_at: null,
                  },
                  error: null,
                }),
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        update: () => ({
          eq: () => ({
            eq: () => ({
              is: () => ({
                select: () => ({
                  maybeSingle: () =>
                    Promise.resolve({
                      data: {
                        email: "a@example.com",
                        expires_at: new Date(Date.now() + 60_000).toISOString(),
                        id: "inv-1",
                        name_hint: "Alex",
                        used_at: null,
                      },
                      error: null,
                    }),
                }),
              }),
            }),
          }),
        }),
      });

    const { getResendableInvite } = await import("@/lib/invites.server");
    const invite = await getResendableInvite({
      inviteId: "inv-1",
      poolId: "pool-1",
    });

    expect(invite?.email).toBe("a@example.com");
    expect(invite?.token.length).toBeGreaterThan(20);
  });

  it("should resend expired unused invites with refreshed expiry", async () => {
    const refreshedExpiry = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    fromMock
      .mockReturnValueOnce({
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: () =>
                Promise.resolve({
                  data: {
                    email: "a@example.com",
                    expires_at: new Date(Date.now() - 60_000).toISOString(),
                    id: "inv-1",
                    name_hint: "Alex",
                    used_at: null,
                  },
                  error: null,
                }),
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        update: (patch: Record<string, unknown>) => {
          expect(patch.expires_at).toEqual(expect.any(String));
          expect(patch.token_hash).toEqual(expect.any(String));

          return {
            eq: () => ({
              eq: () => ({
                is: () => ({
                  select: () => ({
                    maybeSingle: () =>
                      Promise.resolve({
                        data: {
                          email: "a@example.com",
                          expires_at: refreshedExpiry,
                          id: "inv-1",
                          name_hint: "Alex",
                          used_at: null,
                        },
                        error: null,
                      }),
                  }),
                }),
              }),
            }),
          };
        },
      });

    const { getResendableInvite } = await import("@/lib/invites.server");
    const invite = await getResendableInvite({
      inviteId: "inv-1",
      poolId: "pool-1",
    });

    expect(invite?.expiresAt).toBe(refreshedExpiry);
  });

  it("should unwrap pool arrays from joins", async () => {
    fromMock.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({
              data: {
                email: null,
                expires_at: null,
                id: "inv-1",
                name_hint: null,
                pool_id: "pool-1",
                pools: [{ id: "pool-1", name: "Friends" }],
                token_hash: "hashed",
                used_at: null,
              },
              error: null,
            }),
        }),
      }),
    });

    const { getInviteByToken } = await import("@/lib/invites.server");
    const invite = await getInviteByToken("t".repeat(32));

    expect(invite?.poolName).toBe("Friends");
  });

  it("should return null when invite token is unknown", async () => {
    fromMock.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({
              data: null,
              error: null,
            }),
        }),
      }),
    });

    const { getInviteByToken } = await import("@/lib/invites.server");

    await expect(getInviteByToken("t".repeat(32))).resolves.toBeNull();
  });

  it("should return null when pool join is missing", async () => {
    fromMock.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({
              data: {
                email: null,
                expires_at: null,
                id: "inv-1",
                name_hint: null,
                pool_id: "pool-1",
                pools: null,
                token_hash: "hashed",
                used_at: null,
              },
              error: null,
            }),
        }),
      }),
    });

    const { getInviteByToken } = await import("@/lib/invites.server");

    await expect(getInviteByToken("t".repeat(32))).resolves.toBeNull();
  });

  it("should throw when mint insert fails", async () => {
    fromMock.mockImplementation(() => ({
      insert: () => ({
        select: () => ({
          single: () =>
            Promise.resolve({
              data: null,
              error: { message: "connection failed" },
            }),
        }),
      }),
      select: () => ({
        eq: () => ({
          is: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: null, error: null }),
            }),
          }),
        }),
      }),
    }));

    const { mintInvite } = await import("@/lib/invites.server");

    await expect(
      mintInvite({
        email: "a@example.com",
        poolId: "pool-1",
      }),
    ).rejects.toThrow(/Failed to mint invite/);
  });

  it("should map unique insert collisions to email_invited", async () => {
    fromMock.mockImplementation(() => ({
      insert: () => ({
        select: () => ({
          single: () =>
            Promise.resolve({
              data: null,
              error: { message: "duplicate key unique" },
            }),
        }),
      }),
      select: () => ({
        eq: () => ({
          is: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: null, error: null }),
            }),
          }),
        }),
      }),
    }));

    const { mintInvite } = await import("@/lib/invites.server");

    await expect(
      mintInvite({
        email: "a@example.com",
        poolId: "pool-1",
      }),
    ).rejects.toThrow("email_invited");
  });

  it("should get and update invites for a pool", async () => {
    fromMock.mockReturnValueOnce({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: () =>
              Promise.resolve({
                data: {
                  email: "a@example.com",
                  expires_at: null,
                  id: "inv-1",
                  name_hint: "Alex",
                  used_at: null,
                },
                error: null,
              }),
          }),
        }),
      }),
    });

    const { getInviteForPool, updateInvite } = await import(
      "@/lib/invites.server"
    );

    await expect(
      getInviteForPool({ inviteId: "inv-1", poolId: "pool-1" }),
    ).resolves.toMatchObject({
      email: "a@example.com",
      status: "unused",
    });

    fromMock.mockReturnValueOnce({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: () =>
              Promise.resolve({
                data: {
                  email: "a@example.com",
                  expires_at: null,
                  id: "inv-1",
                  name_hint: "Alex",
                  used_at: "2026-08-01T00:00:00.000Z",
                },
                error: null,
              }),
          }),
        }),
      }),
    });

    await expect(
      updateInvite({
        email: "b@example.com",
        inviteId: "inv-1",
        poolId: "pool-1",
      }),
    ).rejects.toThrow("invite_used");

    fromMock
      .mockReturnValueOnce({
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: () =>
                Promise.resolve({
                  data: {
                    email: "a@example.com",
                    expires_at: null,
                    id: "inv-1",
                    name_hint: "Alex",
                    used_at: null,
                  },
                  error: null,
                }),
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        select: () => ({
          eq: () => ({
            is: () => ({
              eq: () => ({
                neq: () => ({
                  maybeSingle: () =>
                    Promise.resolve({ data: null, error: null }),
                }),
              }),
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        update: (patch: Record<string, unknown>) => {
          expect(patch.token_hash).toEqual(expect.any(String));
          expect(patch.email).toBe("b@example.com");

          return {
            eq: () => ({
              eq: () => ({
                select: () => ({
                  maybeSingle: () =>
                    Promise.resolve({
                      data: {
                        email: "b@example.com",
                        expires_at: null,
                        id: "inv-1",
                        name_hint: "Bea",
                        used_at: null,
                      },
                      error: null,
                    }),
                }),
              }),
            }),
          };
        },
      });

    await expect(
      updateInvite({
        email: "b@example.com",
        inviteId: "inv-1",
        nameHint: "Bea",
        poolId: "pool-1",
      }),
    ).resolves.toMatchObject({
      email: "b@example.com",
      nameHint: "Bea",
      tokenRotated: true,
    });

    fromMock
      .mockReturnValueOnce({
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: () =>
                Promise.resolve({
                  data: {
                    email: "a@example.com",
                    expires_at: null,
                    id: "inv-1",
                    name_hint: "Alex",
                    used_at: null,
                  },
                  error: null,
                }),
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        select: () => ({
          eq: () => ({
            is: () => ({
              eq: () => ({
                neq: () => ({
                  maybeSingle: () =>
                    Promise.resolve({ data: null, error: null }),
                }),
              }),
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        update: (patch: Record<string, unknown>) => {
          expect(patch.token_hash).toBeUndefined();
          expect(patch.name_hint).toBe("Alexandra");

          return {
            eq: () => ({
              eq: () => ({
                select: () => ({
                  maybeSingle: () =>
                    Promise.resolve({
                      data: {
                        email: "a@example.com",
                        expires_at: null,
                        id: "inv-1",
                        name_hint: "Alexandra",
                        used_at: null,
                      },
                      error: null,
                    }),
                }),
              }),
            }),
          };
        },
      });

    await expect(
      updateInvite({
        email: "a@example.com",
        inviteId: "inv-1",
        nameHint: "Alexandra",
        poolId: "pool-1",
      }),
    ).resolves.toMatchObject({
      email: "a@example.com",
      nameHint: "Alexandra",
      tokenRotated: false,
    });
  });
});
