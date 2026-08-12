import { beforeEach, describe, expect, it, vi } from "vitest";

const fromMock = vi.fn();

vi.mock("@/lib/supabase.server", () => ({
  getServiceSupabase: () => ({
    from: fromMock,
  }),
}));

describe("pools.server", () => {
  beforeEach(() => {
    fromMock.mockReset();
    vi.resetModules();
  });

  it("should create a pool", async () => {
    const single = vi.fn().mockResolvedValue({
      data: {
        bracket_deadline: null,
        id: "pool-1",
        max_players: 100,
        name: "Friends",
        scoring_system: "standard_1_2_4_8",
        show_brackets_before_lock: false,
        tournament_id: "tour-1",
      },
      error: null,
    });

    fromMock.mockReturnValue({
      insert: () => ({
        select: () => ({
          single,
        }),
      }),
    });

    const { createPool } = await import("@/lib/pools.server");
    const pool = await createPool({
      maxPlayers: 100,
      name: "Friends",
      scoringSystem: "standard_1_2_4_8",
      showBracketsBeforeLock: false,
      tournamentId: "tour-1",
    });

    expect(pool.id).toBe("pool-1");
    expect(pool.name).toBe("Friends");
  });

  it("should map foreign key failures to unknown_tournament", async () => {
    fromMock.mockReturnValue({
      insert: () => ({
        select: () => ({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: "foreign key violation on tournament_id" },
          }),
        }),
      }),
    });

    const { createPool } = await import("@/lib/pools.server");

    await expect(
      createPool({
        maxPlayers: 10,
        name: "X",
        scoringSystem: "standard_1_2_4_8",
        showBracketsBeforeLock: false,
        tournamentId: "missing",
      }),
    ).rejects.toThrow("unknown_tournament");
  });

  it("should list member pools and mark commissioner role", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "entries") {
        return {
          select: (_cols: string, opts?: { count?: string; head?: boolean }) => {
            if (opts?.head) {
              return {
                eq: () =>
                  Promise.resolve({
                    count: 2,
                    error: null,
                  }),
              };
            }

            return {
              eq: () =>
                Promise.resolve({
                  data: [{ pool_id: "pool-1" }],
                  error: null,
                }),
            };
          },
        };
      }

      const pools = [
        {
          bracket_deadline: null,
          id: "pool-1",
          max_players: 10,
          name: "Friends",
          scoring_system: "standard_1_2_4_8",
          show_brackets_before_lock: false,
          tournament_id: "tour-1",
        },
      ];

      return {
        select: () => ({
          order: () =>
            Promise.resolve({
              data: pools,
              error: null,
            }),
        }),
      };
    });

    const { listPoolsForUser } = await import("@/lib/pools.server");
    const result = await listPoolsForUser({
      isCommissioner: true,
      userId: "u1",
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.role).toBe("commissioner");
    expect(result[0]?.entryCount).toBe(2);
  });

  it("should allow commissioner manage checks", async () => {
    fromMock.mockReturnValue({
      eq: () => ({
        maybeSingle: () =>
          Promise.resolve({
            data: { id: "pool-1" },
            error: null,
          }),
      }),
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({
              data: { id: "pool-1" },
              error: null,
            }),
        }),
      }),
    });

    const { userCanManagePool } = await import("@/lib/pools.server");

    await expect(
      userCanManagePool({ isCommissioner: false, poolId: "pool-1" }),
    ).resolves.toBe(false);
    await expect(
      userCanManagePool({ isCommissioner: true, poolId: "pool-1" }),
    ).resolves.toBe(true);
  });

  it("should return empty list for members with no entries", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "entries") {
        return {
          select: () => ({
            eq: async () => ({
              data: [],
              error: null,
            }),
          }),
        };
      }

      throw new Error(`unexpected table ${table}`);
    });

    const { listPoolsForUser } = await import("@/lib/pools.server");
    const pools = await listPoolsForUser({
      isCommissioner: false,
      userId: "u1",
    });

    expect(pools).toEqual([]);
  });

  it("should reject missing pool on manage check", async () => {
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

    const { userCanManagePool } = await import("@/lib/pools.server");

    await expect(
      userCanManagePool({ isCommissioner: true, poolId: "missing" }),
    ).resolves.toBe(false);
  });

  it("should throw on generic create failures", async () => {
    fromMock.mockReturnValue({
      insert: () => ({
        select: () => ({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: "disk full" },
          }),
        }),
      }),
    });

    const { createPool } = await import("@/lib/pools.server");

    await expect(
      createPool({
        maxPlayers: 10,
        name: "X",
        scoringSystem: "standard_1_2_4_8",
        showBracketsBeforeLock: false,
        tournamentId: "tour-1",
      }),
    ).rejects.toThrow(/Failed to create pool/);
  });
});
