import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import {
  assertSameOrigin,
  jsonData,
  jsonError,
  parseJsonBody,
} from "@/lib/api.server";

describe("api.server", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("should wrap data and errors", async () => {
    const ok = jsonData({ id: "1" }, { status: 201 });
    const err = jsonError("Nope", { status: 403 });

    expect(ok.status).toBe(201);
    await expect(ok.json()).resolves.toEqual({ data: { id: "1" } });
    expect(err.status).toBe(403);
    await expect(err.json()).resolves.toEqual({ error: "Nope" });
  });

  it("should allow matching Origin hosts", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");

    const request = new Request("http://localhost:3000/api/auth/sign-in", {
      headers: { origin: "http://localhost:3000" },
      method: "POST",
    });

    expect(assertSameOrigin(request)).toBe(true);
  });

  it("should reject mismatched Origin hosts", () => {
    const request = new Request("http://localhost:3000/api/auth/sign-in", {
      headers: { origin: "https://evil.example" },
      method: "POST",
    });

    expect(assertSameOrigin(request)).toBe(false);
  });

  it("should allow matching Referer when Origin is absent", () => {
    const request = new Request("http://localhost:3000/api/auth/sign-in", {
      headers: { referer: "http://localhost:3000/login" },
      method: "POST",
    });

    expect(assertSameOrigin(request)).toBe(true);
  });

  it("should parse valid JSON bodies", async () => {
    const request = new Request("http://localhost:3000/api", {
      body: JSON.stringify({ name: "Otis" }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });

    const parsed = await parseJsonBody(
      request,
      z.object({ name: z.string() }),
    );

    expect(parsed).toEqual({ data: { name: "Otis" } });
  });

  it("should reject invalid JSON bodies", async () => {
    const request = new Request("http://localhost:3000/api", {
      body: "{",
      headers: { "content-type": "application/json" },
      method: "POST",
    });

    const parsed = await parseJsonBody(
      request,
      z.object({ name: z.string() }),
    );

    expect("error" in parsed).toBe(true);
  });

  it("should reject schema-invalid JSON bodies", async () => {
    const request = new Request("http://localhost:3000/api", {
      body: JSON.stringify({ name: 1 }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });

    const parsed = await parseJsonBody(
      request,
      z.object({ name: z.string() }),
    );

    expect("error" in parsed).toBe(true);
  });

  it("should allow requests with neither Origin nor Referer", () => {
    const request = new Request("http://localhost:3000/api/auth/sign-in", {
      method: "POST",
    });

    expect(assertSameOrigin(request)).toBe(true);
  });

  it("should reject invalid Origin URLs", () => {
    const request = new Request("http://localhost:3000/api/auth/sign-in", {
      headers: { origin: "not-a-url" },
      method: "POST",
    });

    expect(assertSameOrigin(request)).toBe(false);
  });

  it("should reject invalid Referer URLs", () => {
    const request = new Request("http://localhost:3000/api/auth/sign-in", {
      headers: { referer: "::::" },
      method: "POST",
    });

    expect(assertSameOrigin(request)).toBe(false);
  });
});
