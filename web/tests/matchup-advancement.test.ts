import { describe, expect, it } from "vitest";

import {
  applyWinnerToNext,
  clearDownstreamFrom,
  getNextSlot,
  type MatchupLike,
} from "@/lib/matchup-advancement";

function slot(
  round: number,
  position: number,
  overrides: Partial<MatchupLike> = {},
): MatchupLike {
  return {
    bearAId: null,
    bearBId: null,
    id: `r${round}-p${position}`,
    position,
    round,
    status: "upcoming",
    winnerId: null,
    ...overrides,
  };
}

describe("getNextSlot", () => {
  it("should map even positions to side a in the next round", () => {
    expect(getNextSlot(1, 0, 3)).toEqual({
      position: 0,
      round: 2,
      side: "a",
    });
    expect(getNextSlot(1, 2, 3)).toEqual({
      position: 1,
      round: 2,
      side: "a",
    });
  });

  it("should map odd positions to side b in the next round", () => {
    expect(getNextSlot(1, 1, 3)).toEqual({
      position: 0,
      round: 2,
      side: "b",
    });
    expect(getNextSlot(2, 1, 3)).toEqual({
      position: 0,
      round: 3,
      side: "b",
    });
  });

  it("should return null at the championship round", () => {
    expect(getNextSlot(3, 0, 3)).toBeNull();
    expect(getNextSlot(1, 0, 1)).toBeNull();
  });
});

describe("applyWinnerToNext", () => {
  it("should place the winner on the correct next-round side", () => {
    const matchups: MatchupLike[] = [
      slot(1, 0, { bearAId: "a", bearBId: "b", status: "complete", winnerId: "a" }),
      slot(1, 1, { bearAId: "c", bearBId: "d" }),
      slot(2, 0),
    ];

    const next = applyWinnerToNext(matchups, "a", 1, 0, 2);

    expect(next[2]).toMatchObject({ bearAId: "a", bearBId: null });
    expect(next[0]).not.toBe(matchups[0]);
  });

  it("should place odd-position winners on side b", () => {
    const matchups: MatchupLike[] = [
      slot(1, 0),
      slot(1, 1, { bearAId: "c", bearBId: "d", winnerId: "d" }),
      slot(2, 0, { bearAId: "a" }),
    ];

    const next = applyWinnerToNext(matchups, "d", 1, 1, 2);

    expect(next[2]).toMatchObject({ bearAId: "a", bearBId: "d" });
  });

  it("should be a no-op when there is no next round", () => {
    const matchups: MatchupLike[] = [
      slot(2, 0, { bearAId: "a", bearBId: "b", winnerId: "a" }),
    ];

    const next = applyWinnerToNext(matchups, "a", 2, 0, 2);

    expect(next).toEqual(matchups);
    expect(next[0]).not.toBe(matchups[0]);
  });

  it("should leave the array unchanged when the next slot is missing", () => {
    const matchups: MatchupLike[] = [slot(1, 0, { winnerId: "a" })];
    const next = applyWinnerToNext(matchups, "a", 1, 0, 2);

    expect(next).toHaveLength(1);
    expect(next[0]).toMatchObject({ round: 1, winnerId: "a" });
  });
});

describe("clearDownstreamFrom", () => {
  it("should clear the fed side and winner along the path to the final", () => {
    const matchups: MatchupLike[] = [
      slot(1, 0, {
        bearAId: "a",
        bearBId: "b",
        status: "complete",
        winnerId: "a",
      }),
      slot(1, 1, {
        bearAId: "c",
        bearBId: "d",
        status: "complete",
        winnerId: "c",
      }),
      slot(2, 0, {
        bearAId: "a",
        bearBId: "c",
        status: "complete",
        winnerId: "a",
      }),
      slot(1, 2, {
        bearAId: "e",
        bearBId: "f",
        status: "complete",
        winnerId: "e",
      }),
      slot(1, 3, {
        bearAId: "g",
        bearBId: "h",
        status: "complete",
        winnerId: "h",
      }),
      slot(2, 1, {
        bearAId: "e",
        bearBId: "h",
        status: "complete",
        winnerId: "e",
      }),
      slot(3, 0, {
        bearAId: "a",
        bearBId: "e",
        status: "complete",
        winnerId: "a",
      }),
    ];

    const cleared = clearDownstreamFrom(matchups, 1, 0, 3);
    const r2p0 = cleared.find((m) => m.round === 2 && m.position === 0);
    const final = cleared.find((m) => m.round === 3 && m.position === 0);

    expect(r2p0).toMatchObject({
      bearAId: null,
      bearBId: "c",
      status: "upcoming",
      winnerId: null,
    });
    expect(final).toMatchObject({
      bearAId: null,
      bearBId: "e",
      status: "upcoming",
      winnerId: null,
    });

    // Unrelated branch stays intact.
    expect(
      cleared.find((m) => m.round === 2 && m.position === 1),
    ).toMatchObject({
      bearAId: "e",
      bearBId: "h",
      status: "complete",
      winnerId: "e",
    });
  });

  it("should not mutate the original matchup list", () => {
    const matchups: MatchupLike[] = [
      slot(1, 0, { bearAId: "a", status: "complete", winnerId: "a" }),
      slot(2, 0, { bearAId: "a", status: "complete", winnerId: "a" }),
    ];
    const snapshot = structuredClone(matchups);

    clearDownstreamFrom(matchups, 1, 0, 2);

    expect(matchups).toEqual(snapshot);
  });

  it("should stop cleanly when already at the final", () => {
    const matchups: MatchupLike[] = [
      slot(2, 0, { bearAId: "a", bearBId: "b", winnerId: "a" }),
    ];

    expect(clearDownstreamFrom(matchups, 2, 0, 2)).toEqual(matchups);
  });
});
