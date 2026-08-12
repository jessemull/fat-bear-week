import { beforeEach, describe, expect, it, vi } from "vitest";

const fromMock = vi.fn();

vi.mock("@/lib/supabase.server", () => ({
  getServiceSupabase: () => ({
    from: fromMock,
  }),
}));

describe("matchups.server", () => {
  beforeEach(() => {
    fromMock.mockReset();
    vi.resetModules();
  });

  it("should list matchups for a tournament", async () => {
    fromMock.mockReturnValue({
      select: () => ({
        eq: () => ({
          order: () => ({
            order: () =>
              Promise.resolve({
                data: [
                  {
                    bear_a_id: "b1",
                    bear_b_id: "b2",
                    ends_at: null,
                    id: "m1",
                    official_votes_a: null,
                    official_votes_b: null,
                    position: 0,
                    round: 1,
                    starts_at: null,
                    status: "upcoming",
                    tournament_id: "t1",
                    winner_id: null,
                  },
                ],
                error: null,
              }),
          }),
        }),
      }),
    });

    const { listMatchupsForTournament } = await import("@/lib/matchups.server");
    const rows = await listMatchupsForTournament("t1");

    expect(rows[0]).toMatchObject({
      bearAId: "b1",
      bearBId: "b2",
      id: "m1",
      tournamentId: "t1",
    });
  });

  it("should refuse seeding when the tournament is not draft", async () => {
    fromMock.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({
              data: {
                ends_at: null,
                id: "t1",
                starts_at: null,
                status: "live",
                year: 2026,
              },
              error: null,
            }),
        }),
      }),
    });

    const { seedBracketFromBears } = await import("@/lib/matchups.server");

    await expect(
      seedBracketFromBears("t1", ["b1", "b2", "b3", "b4"]),
    ).rejects.toThrow("not_draft");
  });

  it("should seed a draft bracket and auto-resolve byes", async () => {
    const bearIds = ["b0", "b1", "b2", "b3", "b4"];
    let inserted: unknown[] = [];

    fromMock.mockImplementation((table: string) => {
      if (table === "tournaments") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () =>
                Promise.resolve({
                  data: {
                    ends_at: null,
                    id: "t1",
                    starts_at: null,
                    status: "draft",
                    year: 2026,
                  },
                  error: null,
                }),
            }),
          }),
        };
      }

      if (table === "bears") {
        return {
          select: () => ({
            in: () =>
              Promise.resolve({
                data: bearIds.map((id) => ({ id })),
                error: null,
              }),
          }),
        };
      }

      // matchups
      return {
        delete: () => ({
          eq: () => Promise.resolve({ error: null }),
        }),
        insert: (rows: unknown[]) => {
          inserted = rows;

          return Promise.resolve({ error: null });
        },
        select: () => ({
          eq: () => ({
            order: () => ({
              order: () =>
                Promise.resolve({
                  data: (inserted as Array<Record<string, unknown>>).map(
                    (row, index) => ({
                      ...row,
                      ends_at: null,
                      id: `m${index}`,
                      official_votes_a: null,
                      official_votes_b: null,
                      starts_at: null,
                    }),
                  ),
                  error: null,
                }),
            }),
          }),
        }),
      };
    });

    const { seedBracketFromBears } = await import("@/lib/matchups.server");
    const rows = await seedBracketFromBears("t1", bearIds);

    expect(inserted.length).toBe(7);

    const byeRows = (inserted as Array<Record<string, unknown>>).filter(
      (row) => row.round === 1 && row.winner_id,
    );

    expect(byeRows).toHaveLength(3);
    expect(byeRows.every((row) => row.status === "complete")).toBe(true);

    const round2 = (inserted as Array<Record<string, unknown>>).filter(
      (row) => row.round === 2,
    );

    expect(round2).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          bear_a_id: "b0",
          bear_b_id: "b1",
          position: 0,
          round: 2,
        }),
        expect.objectContaining({
          bear_a_id: "b2",
          position: 1,
          round: 2,
        }),
      ]),
    );

    expect(rows).toHaveLength(7);
  });

  it("should set a matchup winner and advance", async () => {
    const updates: Array<{ id: string; patch: Record<string, unknown> }> = [];

    fromMock.mockImplementation((table: string) => {
      if (table !== "matchups") {
        return {};
      }

      return {
        select: () => ({
          eq: (col: string, _value: string) => {
            if (col === "id") {
              return {
                maybeSingle: () =>
                  Promise.resolve({
                    data: {
                      bear_a_id: "b3",
                      bear_b_id: "b4",
                      ends_at: null,
                      id: "m3",
                      official_votes_a: null,
                      official_votes_b: null,
                      position: 3,
                      round: 1,
                      starts_at: null,
                      status: "upcoming",
                      tournament_id: "t1",
                      winner_id: null,
                    },
                    error: null,
                  }),
              };
            }

            // list for tournament
            return {
              order: () => ({
                order: () =>
                  Promise.resolve({
                    data: [
                      {
                        bear_a_id: "b0",
                        bear_b_id: null,
                        ends_at: null,
                        id: "m0",
                        official_votes_a: null,
                        official_votes_b: null,
                        position: 0,
                        round: 1,
                        starts_at: null,
                        status: "complete",
                        tournament_id: "t1",
                        winner_id: "b0",
                      },
                      {
                        bear_a_id: "b1",
                        bear_b_id: null,
                        ends_at: null,
                        id: "m1",
                        official_votes_a: null,
                        official_votes_b: null,
                        position: 1,
                        round: 1,
                        starts_at: null,
                        status: "complete",
                        tournament_id: "t1",
                        winner_id: "b1",
                      },
                      {
                        bear_a_id: "b2",
                        bear_b_id: null,
                        ends_at: null,
                        id: "m2",
                        official_votes_a: null,
                        official_votes_b: null,
                        position: 2,
                        round: 1,
                        starts_at: null,
                        status: "complete",
                        tournament_id: "t1",
                        winner_id: "b2",
                      },
                      {
                        bear_a_id: "b3",
                        bear_b_id: "b4",
                        ends_at: null,
                        id: "m3",
                        official_votes_a: null,
                        official_votes_b: null,
                        position: 3,
                        round: 1,
                        starts_at: null,
                        status: "upcoming",
                        tournament_id: "t1",
                        winner_id: null,
                      },
                      {
                        bear_a_id: "b0",
                        bear_b_id: "b1",
                        ends_at: null,
                        id: "m4",
                        official_votes_a: null,
                        official_votes_b: null,
                        position: 0,
                        round: 2,
                        starts_at: null,
                        status: "upcoming",
                        tournament_id: "t1",
                        winner_id: null,
                      },
                      {
                        bear_a_id: "b2",
                        bear_b_id: null,
                        ends_at: null,
                        id: "m5",
                        official_votes_a: null,
                        official_votes_b: null,
                        position: 1,
                        round: 2,
                        starts_at: null,
                        status: "upcoming",
                        tournament_id: "t1",
                        winner_id: null,
                      },
                      {
                        bear_a_id: null,
                        bear_b_id: null,
                        ends_at: null,
                        id: "m6",
                        official_votes_a: null,
                        official_votes_b: null,
                        position: 0,
                        round: 3,
                        starts_at: null,
                        status: "upcoming",
                        tournament_id: "t1",
                        winner_id: null,
                      },
                    ],
                    error: null,
                  }),
              }),
            };
          },
        }),
        update: (patch: Record<string, unknown>) => ({
          eq: (_col: string, id: string) => {
            updates.push({ id, patch });

            return Promise.resolve({ error: null });
          },
        }),
      };
    });

    const { setMatchupWinner } = await import("@/lib/matchups.server");
    const rows = await setMatchupWinner({
      matchupId: "m3",
      officialVotesA: 10,
      officialVotesB: 20,
      winnerId: "b4",
    });

    expect(updates.some((u) => u.id === "m3" && u.patch.winner_id === "b4")).toBe(
      true,
    );
    expect(
      updates.some(
        (u) => u.id === "m5" && u.patch.bear_b_id === "b4",
      ),
    ).toBe(true);
    expect(rows.length).toBeGreaterThan(0);
  });

  it("should reject winners that are not participants", async () => {
    fromMock.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({
              data: {
                bear_a_id: "b1",
                bear_b_id: "b2",
                ends_at: null,
                id: "m1",
                official_votes_a: null,
                official_votes_b: null,
                position: 0,
                round: 1,
                starts_at: null,
                status: "upcoming",
                tournament_id: "t1",
                winner_id: null,
              },
              error: null,
            }),
        }),
      }),
    });

    const { setMatchupWinner } = await import("@/lib/matchups.server");

    await expect(
      setMatchupWinner({ matchupId: "m1", winnerId: "b9" }),
    ).rejects.toThrow("invalid_winner");
  });

  it("should reject matchups that do not belong to the given tournament", async () => {
    fromMock.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({
              data: {
                bear_a_id: "b1",
                bear_b_id: "b2",
                ends_at: null,
                id: "m1",
                official_votes_a: null,
                official_votes_b: null,
                position: 0,
                round: 1,
                starts_at: null,
                status: "upcoming",
                tournament_id: "t1",
                winner_id: null,
              },
              error: null,
            }),
        }),
      }),
    });

    const { setMatchupWinner } = await import("@/lib/matchups.server");

    await expect(
      setMatchupWinner({
        matchupId: "m1",
        tournamentId: "other-tournament",
        winnerId: "b1",
      }),
    ).rejects.toThrow("not_found");
  });
});
