export interface BracketMatchupSlot {
  bearAId: null | string;
  bearBId: null | string;
  position: number;
  round: number;
}

export interface BracketRound {
  matchups: BracketMatchupSlot[];
  round: number;
}

export interface BracketSkeleton {
  rounds: BracketRound[];
}

/**
 * Smallest power of two ≥ n (bracket field size).
 */
export function nextPowerOfTwo(n: number): number {
  if (!Number.isFinite(n) || n < 1) {
    throw new Error("n must be a positive finite number");
  }

  if (n === 1) {
    return 1;
  }

  return 2 ** Math.ceil(Math.log2(n));
}

/**
 * Build an empty-ish single-elimination bracket for ordered bear IDs.
 *
 * Round 1 pairs early bears with byes (null opponent) so byes auto-win;
 * remaining bears fill later R1 matchups as full pairs. Later rounds are
 * empty slots sized S/2^r.
 */
export function buildBracketSkeleton(
  bearIdsInOrder: string[],
): BracketSkeleton {
  const n = bearIdsInOrder.length;

  if (n < 2) {
    throw new Error("At least two bears are required to build a bracket");
  }

  const fieldSize = nextPowerOfTwo(n);
  const byeCount = fieldSize - n;
  const roundCount = Math.log2(fieldSize);
  const rounds: BracketRound[] = [];

  for (let round = 1; round <= roundCount; round += 1) {
    const matchupCount = fieldSize / 2 ** round;
    const matchups: BracketMatchupSlot[] = [];

    for (let position = 0; position < matchupCount; position += 1) {
      matchups.push({
        bearAId: null,
        bearBId: null,
        position,
        round,
      });
    }

    rounds.push({ matchups, round });
  }

  const round1 = rounds[0];

  if (!round1) {
    throw new Error("Failed to allocate round 1");
  }

  // First byeCount matchups: early bear vs bye (null B).
  for (let i = 0; i < byeCount; i += 1) {
    const slot = round1.matchups[i];

    if (!slot) {
      throw new Error("Round 1 missing bye matchup slot");
    }

    slot.bearAId = bearIdsInOrder[i] ?? null;
    slot.bearBId = null;
  }

  // Remaining bears fill subsequent matchups as A/B pairs.
  let bearIndex = byeCount;
  let matchupIndex = byeCount;

  while (bearIndex < n) {
    const slot = round1.matchups[matchupIndex];

    if (!slot) {
      throw new Error("Round 1 missing pair matchup slot");
    }

    slot.bearAId = bearIdsInOrder[bearIndex] ?? null;
    slot.bearBId = bearIdsInOrder[bearIndex + 1] ?? null;
    bearIndex += 2;
    matchupIndex += 1;
  }

  return { rounds };
}
