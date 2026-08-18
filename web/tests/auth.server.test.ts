import { describe, expect, it } from "vitest";

import { parseJoinErrorMessage } from "@/lib/auth.server";

describe("auth.server", () => {
  it("should parse join RPC error codes from messages", () => {
    expect(parseJoinErrorMessage("invite_used")).toBe("invite_used");
    expect(parseJoinErrorMessage("ERROR: pool_full")).toBe("pool_full");
    expect(parseJoinErrorMessage("something else")).toBeNull();
  });
});
