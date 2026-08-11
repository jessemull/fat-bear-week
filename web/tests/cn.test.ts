import { describe, expect, it } from "vitest";

import { cn } from "@/lib/cn";

describe("cn", () => {
  it("should merge class names and resolve Tailwind conflicts", () => {
    expect(cn("px-2", "px-4", false && "hidden")).toBe("px-4");
  });
});
