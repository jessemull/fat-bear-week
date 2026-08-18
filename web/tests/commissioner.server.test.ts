import { beforeEach, describe, expect, it, vi } from "vitest";

const fromMock = vi.fn();

vi.mock("@/lib/supabase.server", () => ({
  getServiceSupabase: () => ({
    from: fromMock,
  }),
}));

describe("commissioner.server", () => {
  beforeEach(() => {
    fromMock.mockReset();
    vi.resetModules();
  });

  it("should return true when is_commissioner is set", async () => {
    fromMock.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({
              data: { is_commissioner: true },
              error: null,
            }),
        }),
      }),
    });

    const { userIsCommissioner } = await import("@/lib/commissioner.server");

    await expect(userIsCommissioner("user-1")).resolves.toBe(true);
  });

  it("should return false when missing or not commissioner", async () => {
    fromMock.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({
              data: { is_commissioner: false },
              error: null,
            }),
        }),
      }),
    });

    const { userIsCommissioner } = await import("@/lib/commissioner.server");

    await expect(userIsCommissioner("user-1")).resolves.toBe(false);
  });

  it("should return false when the user row is missing", async () => {
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

    const { userIsCommissioner } = await import("@/lib/commissioner.server");

    await expect(userIsCommissioner("missing")).resolves.toBe(false);
  });
});
