import { beforeEach, describe, expect, it, vi } from "vitest";

const fromMock = vi.fn();

vi.mock("@/lib/supabase.server", () => ({
  getServiceSupabase: () => ({
    from: fromMock,
  }),
}));

describe("bears.server", () => {
  beforeEach(() => {
    fromMock.mockReset();
    vi.resetModules();
  });

  it("should list bears when the tournament exists", async () => {
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

      return {
        select: () => ({
          order: () => ({
            order: () =>
              Promise.resolve({
                data: [
                  {
                    age: null,
                    description: null,
                    id: "b1",
                    image_url: null,
                    name: "Otis",
                    nickname: null,
                    number: 480,
                    official_id: null,
                    profile_url: null,
                    sex: "male",
                  },
                ],
                error: null,
              }),
          }),
        }),
      };
    });

    const { listBearsForTournament } = await import("@/lib/bears.server");
    const bears = await listBearsForTournament("t1");

    expect(bears).toEqual([
      {
        age: null,
        description: null,
        id: "b1",
        imageUrl: null,
        name: "Otis",
        nickname: null,
        number: 480,
        officialId: null,
        profileUrl: null,
        sex: "male",
      },
    ]);
  });

  it("should throw not_found when listing for a missing tournament", async () => {
    fromMock.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    });

    const { listBearsForTournament } = await import("@/lib/bears.server");

    await expect(listBearsForTournament("missing")).rejects.toThrow(
      "not_found",
    );
  });

  it("should create a bear", async () => {
    fromMock.mockReturnValue({
      insert: () => ({
        select: () => ({
          single: () =>
            Promise.resolve({
              data: {
                age: null,
                description: null,
                id: "b1",
                image_url: null,
                name: "Otis",
                nickname: null,
                number: 480,
                official_id: null,
                profile_url: null,
                sex: "male",
              },
              error: null,
            }),
        }),
      }),
    });

    const { createBear } = await import("@/lib/bears.server");
    const bear = await createBear({ name: "Otis", number: 480, sex: "male" });

    expect(bear.name).toBe("Otis");
  });

  it("should block delete when the bear is referenced by matchups", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "matchups") {
        return {
          select: () => ({
            or: () =>
              Promise.resolve({
                count: 2,
                error: null,
              }),
          }),
        };
      }

      return {};
    });

    const { deleteBear } = await import("@/lib/bears.server");

    await expect(deleteBear("b1")).rejects.toThrow("bear_in_use");
  });

  it("should delete an unreferenced bear", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "matchups") {
        return {
          select: () => ({
            or: () =>
              Promise.resolve({
                count: 0,
                error: null,
              }),
          }),
        };
      }

      return {
        delete: () => ({
          eq: () => ({
            select: () => ({
              maybeSingle: () =>
                Promise.resolve({
                  data: { id: "b1" },
                  error: null,
                }),
            }),
          }),
        }),
      };
    });

    const { deleteBear } = await import("@/lib/bears.server");

    await expect(deleteBear("b1")).resolves.toBeUndefined();
  });

  it("should update a bear", async () => {
    fromMock.mockReturnValue({
      update: () => ({
        eq: () => ({
          select: () => ({
            maybeSingle: () =>
              Promise.resolve({
                data: {
                  age: 20,
                  description: null,
                  id: "b1",
                  image_url: null,
                  name: "Otis",
                  nickname: "King",
                  number: 480,
                  official_id: null,
                  profile_url: null,
                  sex: "male",
                },
                error: null,
              }),
          }),
        }),
      }),
    });

    const { updateBear } = await import("@/lib/bears.server");
    const bear = await updateBear("b1", { age: 20, nickname: "King" });

    expect(bear.nickname).toBe("King");
    expect(bear.age).toBe(20);
  });

  it("should throw official_id_taken when creating a duplicate", async () => {
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

    const { createBear } = await import("@/lib/bears.server");

    await expect(
      createBear({ name: "Otis", officialId: "480" }),
    ).rejects.toThrow("official_id_taken");
  });

  it("should return existing bear when update patch is empty", async () => {
    fromMock.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({
              data: {
                age: null,
                description: null,
                id: "b1",
                image_url: null,
                name: "Otis",
                nickname: null,
                number: 480,
                official_id: null,
                profile_url: null,
                sex: "male",
              },
              error: null,
            }),
        }),
      }),
    });

    const { updateBear } = await import("@/lib/bears.server");
    const bear = await updateBear("b1", {});

    expect(bear.name).toBe("Otis");
  });

  it("should throw not_found when updating a missing bear", async () => {
    fromMock.mockReturnValue({
      update: () => ({
        eq: () => ({
          select: () => ({
            maybeSingle: () => Promise.resolve({ data: null, error: null }),
          }),
        }),
      }),
    });

    const { updateBear } = await import("@/lib/bears.server");

    await expect(updateBear("missing", { name: "X" })).rejects.toThrow(
      "not_found",
    );
  });

  it("should throw official_id_taken when updating to a taken id", async () => {
    fromMock.mockReturnValue({
      update: () => ({
        eq: () => ({
          select: () => ({
            maybeSingle: () =>
              Promise.resolve({
                data: null,
                error: { message: "duplicate key unique constraint" },
              }),
          }),
        }),
      }),
    });

    const { updateBear } = await import("@/lib/bears.server");

    await expect(
      updateBear("b1", { officialId: "taken" }),
    ).rejects.toThrow("official_id_taken");
  });

  it("should update every optional bear field", async () => {
    fromMock.mockReturnValue({
      update: () => ({
        eq: () => ({
          select: () => ({
            maybeSingle: () =>
              Promise.resolve({
                data: {
                  age: 12,
                  description: "Big",
                  id: "b1",
                  image_url: "https://example.com/b.png",
                  name: "Chunk",
                  nickname: "Chonk",
                  number: 32,
                  official_id: "32",
                  profile_url: "https://example.com/p",
                  sex: "female",
                },
                error: null,
              }),
          }),
        }),
      }),
    });

    const { updateBear } = await import("@/lib/bears.server");
    const bear = await updateBear("b1", {
      age: 12,
      description: "Big",
      imageUrl: "https://example.com/b.png",
      name: "Chunk",
      nickname: "Chonk",
      number: 32,
      officialId: "32",
      profileUrl: "https://example.com/p",
      sex: "female",
    });

    expect(bear).toMatchObject({
      imageUrl: "https://example.com/b.png",
      name: "Chunk",
      sex: "female",
    });
  });

  it("should throw not_found when deleting a missing bear", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "matchups") {
        return {
          select: () => ({
            or: () => Promise.resolve({ count: 0, error: null }),
          }),
        };
      }

      return {
        delete: () => ({
          eq: () => ({
            select: () => ({
              maybeSingle: () => Promise.resolve({ data: null, error: null }),
            }),
          }),
        }),
      };
    });

    const { deleteBear } = await import("@/lib/bears.server");

    await expect(deleteBear("missing")).rejects.toThrow("not_found");
  });

  it("should throw when list bears query fails", async () => {
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

      return {
        select: () => ({
          order: () => ({
            order: () =>
              Promise.resolve({
                data: null,
                error: { message: "db down" },
              }),
          }),
        }),
      };
    });

    const { listBearsForTournament } = await import("@/lib/bears.server");

    await expect(listBearsForTournament("t1")).rejects.toThrow(
      "Failed to list bears",
    );
  });
});
