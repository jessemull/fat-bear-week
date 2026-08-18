import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/sessions.server", () => ({
  getSession: vi.fn(),
}));

describe("admin-auth.server", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("should return 401 when there is no session", async () => {
    const { getSession } = await import("@/lib/sessions.server");

    vi.mocked(getSession).mockResolvedValue(null);

    const { requireCommissioner } = await import("@/lib/admin-auth.server");
    const result = await requireCommissioner();

    expect("error" in result).toBe(true);

    if ("error" in result) {
      expect(result.error.status).toBe(401);
      await expect(result.error.json()).resolves.toEqual({
        error: "Unauthorized.",
      });
    }
  });

  it("should return 403 when the user is not a commissioner", async () => {
    const { getSession } = await import("@/lib/sessions.server");

    vi.mocked(getSession).mockResolvedValue({
      id: "u1",
      isCommissioner: false,
      name: "Otis",
    });

    const { requireCommissioner } = await import("@/lib/admin-auth.server");
    const result = await requireCommissioner();

    expect("error" in result).toBe(true);

    if ("error" in result) {
      expect(result.error.status).toBe(403);
    }
  });

  it("should return the session for a commissioner", async () => {
    const session = {
      id: "u1",
      isCommissioner: true,
      name: "Admin",
    };
    const { getSession } = await import("@/lib/sessions.server");

    vi.mocked(getSession).mockResolvedValue(session);

    const { requireCommissioner } = await import("@/lib/admin-auth.server");
    const result = await requireCommissioner();

    expect(result).toEqual({ session });
  });
});
