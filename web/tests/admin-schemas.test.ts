import { describe, expect, it } from "vitest";

import {
  createBearBodySchema,
  createTournamentBodySchema,
  seedBracketBodySchema,
  setMatchupWinnerBodySchema,
  transitionTournamentStatusBodySchema,
  updateBearBodySchema,
  updateTournamentMetaBodySchema,
} from "@/lib/admin-schemas";

describe("admin-schemas", () => {
  it("should accept a valid create tournament body", () => {
    expect(
      createTournamentBodySchema.parse({
        endsAt: null,
        startsAt: "2026-10-01T00:00:00.000Z",
        year: 2026,
      }),
    ).toMatchObject({ year: 2026 });
  });

  it("should reject invalid tournament years", () => {
    expect(createTournamentBodySchema.safeParse({ year: 1999 }).success).toBe(
      false,
    );
  });

  it("should accept partial tournament meta updates", () => {
    expect(
      updateTournamentMetaBodySchema.parse({ year: 2027 }),
    ).toEqual({ year: 2027 });
  });

  it("should accept status transitions", () => {
    expect(
      transitionTournamentStatusBodySchema.parse({ status: "live" }),
    ).toEqual({ status: "live" });
  });

  it("should accept bear create and update bodies", () => {
    expect(
      createBearBodySchema.parse({
        biography: "A Brooks River regular.",
        identification: "Milk chocolate fur.",
        name: "480 Otis",
        sex: "male",
      }),
    ).toMatchObject({
      biography: "A Brooks River regular.",
      identification: "Milk chocolate fur.",
      name: "480 Otis",
    });

    expect(
      updateBearBodySchema.parse({ nickname: "The King" }),
    ).toEqual({ nickname: "The King" });
  });

  it("should require at least two bear ids to seed a bracket", () => {
    expect(
      seedBracketBodySchema.safeParse({
        bearIdsInOrder: ["11111111-1111-4111-8111-111111111111"],
      }).success,
    ).toBe(false);

    expect(
      seedBracketBodySchema.parse({
        bearIdsInOrder: [
          "11111111-1111-4111-8111-111111111111",
          "22222222-2222-4222-8222-222222222222",
        ],
      }).bearIdsInOrder,
    ).toHaveLength(2);
  });

  it("should accept set-winner bodies with optional vote totals", () => {
    expect(
      setMatchupWinnerBodySchema.parse({
        officialVotesA: 100,
        officialVotesB: 50,
        winnerId: "11111111-1111-4111-8111-111111111111",
      }),
    ).toMatchObject({ officialVotesA: 100 });
  });
});
