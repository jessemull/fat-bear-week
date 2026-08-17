import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "@/lib/passwords.server";

describe("passwords.server", () => {
  it("should hash and verify a password round-trip", async () => {
    const hash = await hashPassword("correct-horse-battery");

    expect(hash.startsWith("scrypt$")).toBe(true);
    await expect(verifyPassword("correct-horse-battery", hash)).resolves.toBe(
      true,
    );
  });

  it("should reject an incorrect password", async () => {
    const hash = await hashPassword("correct-horse-battery");

    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });

  it("should reject empty derived keys", async () => {
    await expect(
      verifyPassword("x", "scrypt$16384$8$1$YQ==$"),
    ).resolves.toBe(false);
  });

  it("should reject tampered scrypt params above the hash ceiling", async () => {
    await expect(
      verifyPassword("x", "scrypt$32768$8$1$YQ==$YWJj"),
    ).resolves.toBe(false);
  });
});
