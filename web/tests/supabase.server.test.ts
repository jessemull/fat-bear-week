import { afterEach, describe, expect, it, vi } from "vitest";

describe("supabase.server", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("should throw when env is missing", async () => {
    vi.stubEnv("SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_KEY", "");

    const { getServiceSupabase } = await import("@/lib/supabase.server");

    expect(() => getServiceSupabase()).toThrow(/Missing SUPABASE_URL/);
  });

  it("should create a client when env is present", async () => {
    vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_KEY", "service-key");

    const createClient = vi.fn(() => ({ from: vi.fn() }));

    vi.doMock("@supabase/supabase-js", () => ({
      createClient,
    }));

    const { getServiceSupabase } = await import("@/lib/supabase.server");
    const client = getServiceSupabase();

    expect(client).toBeTruthy();
    expect(getServiceSupabase()).toBe(client);
  });
});
