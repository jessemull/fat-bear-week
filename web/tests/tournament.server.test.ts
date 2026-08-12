import { beforeEach, describe, expect, it, vi } from "vitest";

const fromMock = vi.fn();

vi.mock("@/lib/supabase.server", () => ({
  getServiceSupabase: () => ({
    from: fromMock,
  }),
}));

describe("tournament.server", () => {
  beforeEach(() => {
    fromMock.mockReset();
    vi.resetModules();
  });

  it("should list tournaments newest year first", async () => {
    fromMock.mockReturnValue({
      select: () => ({
        order: () =>
          Promise.resolve({
            data: [
              {
                ends_at: null,
                id: "t1",
                starts_at: null,
                status: "draft",
                year: 2026,
              },
            ],
            error: null,
          }),
      }),
    });

    const { listTournaments } = await import("@/lib/tournament.server");
    const rows = await listTournaments();

    expect(rows).toEqual([
      {
        endsAt: null,
        id: "t1",
        startsAt: null,
        status: "draft",
        year: 2026,
      },
    ]);
  });

  it("should create a draft tournament", async () => {
    fromMock.mockReturnValue({
      insert: () => ({
        select: () => ({
          single: () =>
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
    });

    const { createTournament } = await import("@/lib/tournament.server");
    const row = await createTournament({ year: 2026 });

    expect(row).toMatchObject({ status: "draft", year: 2026 });
  });

  it("should map duplicate years to year_taken", async () => {
    fromMock.mockReturnValue({
      insert: () => ({
        select: () => ({
          single: () =>
            Promise.resolve({
              data: null,
              error: { message: "duplicate key value violates unique" },
            }),
        }),
      }),
    });

    const { createTournament } = await import("@/lib/tournament.server");

    await expect(createTournament({ year: 2026 })).rejects.toThrow(
      "year_taken",
    );
  });

  it("should get a tournament or return null", async () => {
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
                year: 2025,
              },
              error: null,
            }),
        }),
      }),
    });

    const { getTournament } = await import("@/lib/tournament.server");

    await expect(getTournament("t1")).resolves.toMatchObject({
      status: "live",
      year: 2025,
    });
  });

  it("should reject transitioning to the same status", async () => {
    fromMock.mockReturnValue({
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
    });

    const { transitionTournamentStatus } = await import(
      "@/lib/tournament.server"
    );

    await expect(transitionTournamentStatus("t1", "draft")).rejects.toThrow(
      "invalid_transition",
    );
  });

  it("should allow reverting complete to draft", async () => {
    let call = 0;

    fromMock.mockImplementation(() => {
      call += 1;

      if (call === 1) {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () =>
                Promise.resolve({
                  data: {
                    ends_at: null,
                    id: "t1",
                    starts_at: null,
                    status: "complete",
                    year: 2026,
                  },
                  error: null,
                }),
            }),
          }),
        };
      }

      return {
        update: () => ({
          eq: () => ({
            select: () => ({
              single: () =>
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
        }),
      };
    });

    const { transitionTournamentStatus } = await import(
      "@/lib/tournament.server"
    );
    const row = await transitionTournamentStatus("t1", "draft");

    expect(row.status).toBe("draft");
  });

  it("should transition draft to live", async () => {
    let call = 0;

    fromMock.mockImplementation(() => {
      call += 1;

      if (call === 1) {
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

      return {
        update: () => ({
          eq: () => ({
            select: () => ({
              single: () =>
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
        }),
      };
    });

    const { transitionTournamentStatus } = await import(
      "@/lib/tournament.server"
    );
    const row = await transitionTournamentStatus("t1", "live");

    expect(row.status).toBe("live");
  });

  it("should update tournament meta", async () => {
    fromMock.mockReturnValue({
      update: () => ({
        eq: () => ({
          select: () => ({
            maybeSingle: () =>
              Promise.resolve({
                data: {
                  ends_at: "2026-10-10T00:00:00.000Z",
                  id: "t1",
                  starts_at: null,
                  status: "draft",
                  year: 2026,
                },
                error: null,
              }),
          }),
        }),
      }),
    });

    const { updateTournamentMeta } = await import("@/lib/tournament.server");
    const row = await updateTournamentMeta("t1", {
      endsAt: "2026-10-10T00:00:00.000Z",
    });

    expect(row.endsAt).toBe("2026-10-10T00:00:00.000Z");
  });

  it("should return null when tournament is missing", async () => {
    fromMock.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    });

    const { getTournament } = await import("@/lib/tournament.server");

    await expect(getTournament("missing")).resolves.toBeNull();
  });

  it("should return existing tournament when meta patch is empty", async () => {
    fromMock.mockReturnValue({
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
    });

    const { updateTournamentMeta } = await import("@/lib/tournament.server");
    const row = await updateTournamentMeta("t1", {});

    expect(row.year).toBe(2026);
  });

  it("should throw not_found for empty meta patch on missing tournament", async () => {
    fromMock.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    });

    const { updateTournamentMeta } = await import("@/lib/tournament.server");

    await expect(updateTournamentMeta("missing", {})).rejects.toThrow(
      "not_found",
    );
  });

  it("should map meta year collision to year_taken", async () => {
    fromMock.mockReturnValue({
      update: () => ({
        eq: () => ({
          select: () => ({
            maybeSingle: () =>
              Promise.resolve({
                data: null,
                error: { message: "duplicate key unique" },
              }),
          }),
        }),
      }),
    });

    const { updateTournamentMeta } = await import("@/lib/tournament.server");

    await expect(
      updateTournamentMeta("t1", { year: 2025 }),
    ).rejects.toThrow("year_taken");
  });

  it("should throw not_found when updating missing tournament meta", async () => {
    fromMock.mockReturnValue({
      update: () => ({
        eq: () => ({
          select: () => ({
            maybeSingle: () => Promise.resolve({ data: null, error: null }),
          }),
        }),
      }),
    });

    const { updateTournamentMeta } = await import("@/lib/tournament.server");

    await expect(
      updateTournamentMeta("missing", { startsAt: null }),
    ).rejects.toThrow("not_found");
  });

  it("should throw not_found when transitioning a missing tournament", async () => {
    fromMock.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    });

    const { transitionTournamentStatus } = await import(
      "@/lib/tournament.server"
    );

    await expect(transitionTournamentStatus("missing", "live")).rejects.toThrow(
      "not_found",
    );
  });

  it("should create tournament with optional schedule fields", async () => {
    fromMock.mockReturnValue({
      insert: () => ({
        select: () => ({
          single: () =>
            Promise.resolve({
              data: {
                ends_at: "2026-10-10T00:00:00.000Z",
                id: "t1",
                starts_at: "2026-10-01T00:00:00.000Z",
                status: "draft",
                year: 2026,
              },
              error: null,
            }),
        }),
      }),
    });

    const { createTournament } = await import("@/lib/tournament.server");
    const row = await createTournament({
      endsAt: "2026-10-10T00:00:00.000Z",
      startsAt: "2026-10-01T00:00:00.000Z",
      year: 2026,
    });

    expect(row.startsAt).toBe("2026-10-01T00:00:00.000Z");
  });

  it("should update startsAt and year together", async () => {
    fromMock.mockReturnValue({
      update: () => ({
        eq: () => ({
          select: () => ({
            maybeSingle: () =>
              Promise.resolve({
                data: {
                  ends_at: null,
                  id: "t1",
                  starts_at: "2026-09-01T00:00:00.000Z",
                  status: "draft",
                  year: 2027,
                },
                error: null,
              }),
          }),
        }),
      }),
    });

    const { updateTournamentMeta } = await import("@/lib/tournament.server");
    const row = await updateTournamentMeta("t1", {
      startsAt: "2026-09-01T00:00:00.000Z",
      year: 2027,
    });

    expect(row).toMatchObject({ startsAt: "2026-09-01T00:00:00.000Z", year: 2027 });
  });

  it("should delete a tournament with no pools", async () => {
    let call = 0;

    fromMock.mockImplementation((table: string) => {
      call += 1;

      if (call === 1) {
        expect(table).toBe("tournaments");

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

      if (call === 2) {
        expect(table).toBe("pools");

        return {
          select: () => ({
            eq: () => Promise.resolve({ count: 0, error: null }),
          }),
        };
      }

      expect(table).toBe("tournaments");

      return {
        delete: () => ({
          eq: () => Promise.resolve({ error: null }),
        }),
      };
    });

    const { deleteTournament } = await import("@/lib/tournament.server");

    await expect(deleteTournament("t1")).resolves.toBeUndefined();
  });

  it("should refuse delete when pools reference the tournament", async () => {
    let call = 0;

    fromMock.mockImplementation((table: string) => {
      call += 1;

      if (call === 1) {
        return {
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
        };
      }

      expect(table).toBe("pools");

      return {
        select: () => ({
          eq: () => Promise.resolve({ count: 1, error: null }),
        }),
      };
    });

    const { deleteTournament } = await import("@/lib/tournament.server");

    await expect(deleteTournament("t1")).rejects.toThrow("in_use");
  });
});
