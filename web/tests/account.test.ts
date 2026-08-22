import { describe, expect, it } from "vitest";

import { getDisplayInitials } from "@/lib/account";

describe("getDisplayInitials", () => {
  it("should use the first letter of a single name", () => {
    expect(getDisplayInitials("Otis")).toBe("O");
  });

  it("should use first and last words for multi-word names", () => {
    expect(getDisplayInitials("Fat Bear")).toBe("FB");
    expect(getDisplayInitials("a b c")).toBe("AC");
  });

  it("should return a placeholder for blank names", () => {
    expect(getDisplayInitials("   ")).toBe("?");
    expect(getDisplayInitials("")).toBe("?");
  });
});
