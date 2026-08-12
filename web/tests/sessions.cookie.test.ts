import { beforeEach, describe, expect, it, vi } from "vitest";

const cookieStore = {
  get: vi.fn(),
  set: vi.fn(),
};

const fromMock = vi.fn();

vi.mock("next/headers", () => ({
  cookies: async () => cookieStore,
}));

vi.mock("@/lib/supabase.server", () => ({
  getServiceSupabase: () => ({
    from: fromMock,
  }),
}));

describe("sessions.server cookie flow", () => {
  beforeEach(() => {
    cookieStore.get.mockReset();
    cookieStore.set.mockReset();
    fromMock.mockReset();
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
  });

  it("should create a session and set the cookie", async () => {
    fromMock.mockReturnValue({
      insert: () => Promise.resolve({ error: null }),
    });

    const { createSession, SESSION_COOKIE_NAME } = await import(
      "@/lib/sessions.server"
    );

    await createSession("user-1");

    expect(cookieStore.set).toHaveBeenCalledWith(
      SESSION_COOKIE_NAME,
      expect.any(String),
      expect.objectContaining({
        httpOnly: true,
        path: "/",
        sameSite: "lax",
      }),
    );
  });

  it("should return null when cookie is missing", async () => {
    cookieStore.get.mockReturnValue(undefined);

    const { getSession } = await import("@/lib/sessions.server");

    await expect(getSession()).resolves.toBeNull();
  });

  it("should resolve a valid session user", async () => {
    cookieStore.get.mockReturnValue({ value: "raw-token-value" });
    fromMock.mockReturnValue({
      delete: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
      eq: () => ({
        maybeSingle: () =>
          Promise.resolve({
            data: {
              expires_at: new Date(Date.now() + 60_000).toISOString(),
              id: "sess-1",
              user_id: "user-1",
              users: { id: "user-1", is_commissioner: true, name: "Otis" },
            },
            error: null,
          }),
      }),
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({
              data: {
                expires_at: new Date(Date.now() + 60_000).toISOString(),
                id: "sess-1",
                user_id: "user-1",
                users: { id: "user-1", is_commissioner: true, name: "Otis" },
              },
              error: null,
            }),
        }),
      }),
    });

    const { getSession } = await import("@/lib/sessions.server");

    await expect(getSession()).resolves.toEqual({
      id: "user-1",
      isCommissioner: true,
      name: "Otis",
    });
  });

  it("should revoke and clear cookie", async () => {
    cookieStore.get.mockReturnValue({ value: "raw-token-value" });
    fromMock.mockReturnValue({
      delete: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    });

    const { revokeSession, SESSION_COOKIE_NAME } = await import(
      "@/lib/sessions.server"
    );

    await revokeSession();

    expect(cookieStore.set).toHaveBeenCalledWith(
      SESSION_COOKIE_NAME,
      "",
      expect.objectContaining({ maxAge: 0 }),
    );
  });

  it("should clear expired sessions", async () => {
    cookieStore.get.mockReturnValue({ value: "raw-token-value" });
    fromMock.mockReturnValue({
      delete: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({
              data: {
                expires_at: new Date(Date.now() - 60_000).toISOString(),
                id: "sess-1",
                user_id: "user-1",
                users: { id: "user-1", is_commissioner: false, name: "Otis" },
              },
              error: null,
            }),
        }),
      }),
    });

    const { getSession, SESSION_COOKIE_NAME } = await import(
      "@/lib/sessions.server"
    );

    await expect(getSession()).resolves.toBeNull();
    expect(cookieStore.set).toHaveBeenCalledWith(
      SESSION_COOKIE_NAME,
      "",
      expect.objectContaining({ maxAge: 0 }),
    );
  });

  it("should unwrap array user joins", async () => {
    cookieStore.get.mockReturnValue({ value: "raw-token-value" });
    fromMock.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({
              data: {
                expires_at: new Date(Date.now() + 60_000).toISOString(),
                id: "sess-1",
                user_id: "user-1",
                users: [{ id: "user-1", is_commissioner: false, name: "Otis" }],
              },
              error: null,
            }),
        }),
      }),
    });

    const { getSession } = await import("@/lib/sessions.server");

    await expect(getSession()).resolves.toEqual({
      id: "user-1",
      isCommissioner: false,
      name: "Otis",
    });
  });

  it("should return null when user join is missing", async () => {
    cookieStore.get.mockReturnValue({ value: "raw-token-value" });
    fromMock.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({
              data: {
                expires_at: new Date(Date.now() + 60_000).toISOString(),
                id: "sess-1",
                user_id: "user-1",
                users: null,
              },
              error: null,
            }),
        }),
      }),
    });

    const { getSession } = await import("@/lib/sessions.server");

    await expect(getSession()).resolves.toBeNull();
  });

  it("should throw when session insert fails", async () => {
    fromMock.mockReturnValue({
      insert: () => Promise.resolve({ error: { message: "db down" } }),
    });

    const { createSession } = await import("@/lib/sessions.server");

    await expect(createSession("user-1")).rejects.toThrow(/Failed to create session/);
  });
});
