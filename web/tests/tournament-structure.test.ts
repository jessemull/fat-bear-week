import { describe, expect, it } from "vitest";

import {
  buildBracketSkeleton,
  nextPowerOfTwo,
} from "@/lib/tournament-structure";

describe("nextPowerOfTwo", () => {
  it("should return the same value for powers of two", () => {
    expect(nextPowerOfTwo(1)).toBe(1);
    expect(nextPowerOfTwo(2)).toBe(2);
    expect(nextPowerOfTwo(8)).toBe(8);
    expect(nextPowerOfTwo(16)).toBe(16);
  });

  it("should round up to the next power of two", () => {
    expect(nextPowerOfTwo(3)).toBe(4);
    expect(nextPowerOfTwo(5)).toBe(8);
    expect(nextPowerOfTwo(9)).toBe(16);
    expect(nextPowerOfTwo(12)).toBe(16);
  });

  it("should reject non-positive inputs", () => {
    expect(() => nextPowerOfTwo(0)).toThrow(/positive/);
    expect(() => nextPowerOfTwo(-1)).toThrow(/positive/);
    expect(() => nextPowerOfTwo(Number.NaN)).toThrow(/positive/);
  });
});

describe("buildBracketSkeleton", () => {
  it("should reject fewer than two bears", () => {
    expect(() => buildBracketSkeleton([])).toThrow(/two bears/);
    expect(() => buildBracketSkeleton(["a"])).toThrow(/two bears/);
  });

  it("should build a full power-of-two bracket with no byes", () => {
    const skeleton = buildBracketSkeleton(["a", "b", "c", "d"]);

    expect(skeleton.rounds).toHaveLength(2);
    expect(skeleton.rounds[0]?.matchups).toHaveLength(2);
    expect(skeleton.rounds[1]?.matchups).toHaveLength(1);

    expect(skeleton.rounds[0]?.matchups).toEqual([
      { bearAId: "a", bearBId: "b", position: 0, round: 1 },
      { bearAId: "c", bearBId: "d", position: 1, round: 1 },
    ]);
    expect(skeleton.rounds[1]?.matchups[0]).toEqual({
      bearAId: null,
      bearBId: null,
      position: 0,
      round: 2,
    });
  });

  it("should pair early bears with byes for a five-bear field", () => {
    const ids = ["b0", "b1", "b2", "b3", "b4"];
    const skeleton = buildBracketSkeleton(ids);

    // S=8 → 3 rounds, 4 R1 matchups, 3 byes for early bears.
    expect(skeleton.rounds).toHaveLength(3);
    expect(skeleton.rounds[0]?.matchups).toHaveLength(4);
    expect(skeleton.rounds[1]?.matchups).toHaveLength(2);
    expect(skeleton.rounds[2]?.matchups).toHaveLength(1);

    expect(skeleton.rounds[0]?.matchups).toEqual([
      { bearAId: "b0", bearBId: null, position: 0, round: 1 },
      { bearAId: "b1", bearBId: null, position: 1, round: 1 },
      { bearAId: "b2", bearBId: null, position: 2, round: 1 },
      { bearAId: "b3", bearBId: "b4", position: 3, round: 1 },
    ]);
  });

  it("should leave later rounds empty for a twelve-bear field", () => {
    const ids = Array.from({ length: 12 }, (_, i) => `b${i}`);
    const skeleton = buildBracketSkeleton(ids);

    // S=16 → 4 byes, 8 R1, 4 R2, 2 R3, 1 R4.
    expect(skeleton.rounds.map((round) => round.matchups.length)).toEqual([
      8, 4, 2, 1,
    ]);

    const round1 = skeleton.rounds[0]?.matchups ?? [];

    expect(round1.slice(0, 4)).toEqual([
      { bearAId: "b0", bearBId: null, position: 0, round: 1 },
      { bearAId: "b1", bearBId: null, position: 1, round: 1 },
      { bearAId: "b2", bearBId: null, position: 2, round: 1 },
      { bearAId: "b3", bearBId: null, position: 3, round: 1 },
    ]);
    expect(round1[4]).toEqual({
      bearAId: "b4",
      bearBId: "b5",
      position: 4,
      round: 1,
    });
    expect(round1[7]).toEqual({
      bearAId: "b10",
      bearBId: "b11",
      position: 7,
      round: 1,
    });

    for (const round of skeleton.rounds.slice(1)) {
      for (const matchup of round.matchups) {
        expect(matchup.bearAId).toBeNull();
        expect(matchup.bearBId).toBeNull();
      }
    }
  });

  it("should assign sequential positions within each round", () => {
    const skeleton = buildBracketSkeleton(["a", "b", "c"]);

    for (const round of skeleton.rounds) {
      expect(round.matchups.map((matchup) => matchup.position)).toEqual(
        round.matchups.map((_, index) => index),
      );
      expect(round.matchups.every((matchup) => matchup.round === round.round)).toBe(
        true,
      );
    }
  });
});
