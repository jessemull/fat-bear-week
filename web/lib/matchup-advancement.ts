export interface MatchupLike {
  bearAId: null | string;
  bearBId: null | string;
  id?: string;
  position: number;
  round: number;
  status?: string;
  winnerId: null | string;
}

export interface NextSlot {
  position: number;
  round: number;
  side: "a" | "b";
}

/**
 * Next bracket slot for the winner of (round, position), or null at the final.
 */
export function getNextSlot(
  round: number,
  position: number,
  maxRound: number,
): NextSlot | null {
  if (round >= maxRound) {
    return null;
  }

  return {
    position: Math.floor(position / 2),
    round: round + 1,
    side: position % 2 === 0 ? "a" : "b",
  };
}

function findMatchupIndex(
  matchups: MatchupLike[],
  round: number,
  position: number,
): number {
  return matchups.findIndex(
    (matchup) => matchup.round === round && matchup.position === position,
  );
}

/**
 * Place winnerId into the next-round slot (immutable).
 */
export function applyWinnerToNext(
  matchups: MatchupLike[],
  winnerId: string,
  fromRound: number,
  fromPosition: number,
  maxRound: number,
): MatchupLike[] {
  const next = getNextSlot(fromRound, fromPosition, maxRound);

  if (!next) {
    return matchups.map((matchup) => ({ ...matchup }));
  }

  const index = findMatchupIndex(matchups, next.round, next.position);

  if (index < 0) {
    return matchups.map((matchup) => ({ ...matchup }));
  }

  return matchups.map((matchup, i) => {
    if (i !== index) {
      return { ...matchup };
    }

    if (next.side === "a") {
      return { ...matchup, bearAId: winnerId };
    }

    return { ...matchup, bearBId: winnerId };
  });
}

/**
 * Clear this matchup's side in later rounds (and their winners) when a
 * result changes — walks the path to the championship.
 */
export function clearDownstreamFrom(
  matchups: MatchupLike[],
  fromRound: number,
  fromPosition: number,
  maxRound: number,
): MatchupLike[] {
  let result = matchups.map((matchup) => ({ ...matchup }));
  let round = fromRound;
  let position = fromPosition;

  while (true) {
    const next = getNextSlot(round, position, maxRound);

    if (!next) {
      break;
    }

    const index = findMatchupIndex(result, next.round, next.position);

    if (index < 0) {
      break;
    }

    const current = result[index];

    if (!current) {
      break;
    }

    const clearedSideId =
      next.side === "a" ? current.bearAId : current.bearBId;

    result = result.map((matchup, i) => {
      if (i !== index) {
        return matchup;
      }

      const updated: MatchupLike = {
        ...matchup,
        winnerId: null,
      };

      if (next.side === "a") {
        updated.bearAId = null;
      } else {
        updated.bearBId = null;
      }

      // Drop a stale winner that was the cleared participant.
      if (matchup.winnerId && matchup.winnerId === clearedSideId) {
        updated.winnerId = null;
      }

      if (updated.status === "complete") {
        updated.status = "upcoming";
      }

      return updated;
    });

    round = next.round;
    position = next.position;
  }

  return result;
}
