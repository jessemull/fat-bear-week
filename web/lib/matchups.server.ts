import "server-only";

import type { MatchupStatus } from "@/lib/tournament-types";

import {
  applyWinnerToNext,
  clearDownstreamFrom,
  type MatchupLike,
} from "@/lib/matchup-advancement";
import { getServiceSupabase } from "@/lib/supabase.server";
import { buildBracketSkeleton } from "@/lib/tournament-structure";
import { getTournament } from "@/lib/tournament.server";

export interface MatchupRecord {
  bearAId: null | string;
  bearBId: null | string;
  endsAt: null | string;
  id: string;
  officialVotesA: null | number;
  officialVotesB: null | number;
  position: number;
  round: number;
  startsAt: null | string;
  status: MatchupStatus;
  tournamentId: string;
  winnerId: null | string;
}

export interface SetMatchupWinnerInput {
  matchupId: string;
  officialVotesA?: null | number;
  officialVotesB?: null | number;
  /** When set, the matchup must belong to this tournament. */
  tournamentId?: string;
  winnerId: string;
}

interface MatchupRow {
  bear_a_id: null | string;
  bear_b_id: null | string;
  ends_at: null | string;
  id: string;
  official_votes_a: null | number;
  official_votes_b: null | number;
  position: number;
  round: number;
  starts_at: null | string;
  status: MatchupStatus;
  tournament_id: string;
  winner_id: null | string;
}

function mapMatchup(row: MatchupRow): MatchupRecord {
  return {
    bearAId: row.bear_a_id,
    bearBId: row.bear_b_id,
    endsAt: row.ends_at,
    id: row.id,
    officialVotesA: row.official_votes_a,
    officialVotesB: row.official_votes_b,
    position: row.position,
    round: row.round,
    startsAt: row.starts_at,
    status: row.status,
    tournamentId: row.tournament_id,
    winnerId: row.winner_id,
  };
}

function toMatchupLike(row: MatchupRow): MatchupLike {
  return {
    bearAId: row.bear_a_id,
    bearBId: row.bear_b_id,
    id: row.id,
    position: row.position,
    round: row.round,
    status: row.status,
    winnerId: row.winner_id,
  };
}

function maxRoundFromMatchups(matchups: MatchupLike[]): number {
  return matchups.reduce((max, matchup) => Math.max(max, matchup.round), 0);
}

function isByeMatchup(matchup: MatchupLike): boolean {
  const hasA = matchup.bearAId !== null;
  const hasB = matchup.bearBId !== null;

  return (hasA && !hasB) || (!hasA && hasB);
}

function byeWinnerId(matchup: MatchupLike): null | string {
  if (matchup.bearAId && !matchup.bearBId) {
    return matchup.bearAId;
  }

  if (matchup.bearBId && !matchup.bearAId) {
    return matchup.bearBId;
  }

  return null;
}

/**
 * Auto-resolve R1 byes and advance winners into round 2 (in memory).
 */
function resolveByes(matchups: MatchupLike[], maxRound: number): MatchupLike[] {
  let result = matchups.map((matchup) => ({ ...matchup }));

  const byeSlots = result.filter(
    (matchup) => matchup.round === 1 && isByeMatchup(matchup),
  );

  for (const bye of byeSlots) {
    const winnerId = byeWinnerId(bye);

    if (!winnerId) {
      continue;
    }

    result = result.map((matchup) => {
      if (matchup.round === bye.round && matchup.position === bye.position) {
        return {
          ...matchup,
          status: "complete",
          winnerId,
        };
      }

      return matchup;
    });

    result = applyWinnerToNext(
      result,
      winnerId,
      bye.round,
      bye.position,
      maxRound,
    );
  }

  return result;
}

/**
 * List matchups for a tournament ordered by round then position.
 */
export async function listMatchupsForTournament(
  tournamentId: string,
): Promise<MatchupRecord[]> {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from("matchups")
    .select(
      "bear_a_id, bear_b_id, ends_at, id, official_votes_a, official_votes_b, position, round, starts_at, status, tournament_id, winner_id",
    )
    .eq("tournament_id", tournamentId)
    .order("round", { ascending: true })
    .order("position", { ascending: true });

  if (error) {
    throw new Error(`Failed to list matchups: ${error.message}`);
  }

  return (data as MatchupRow[] | null)?.map(mapMatchup) ?? [];
}

/**
 * Replace the bracket for a draft tournament from ordered bear IDs.
 * Deletes existing matchups, inserts the skeleton, and auto-resolves byes.
 */
export async function seedBracketFromBears(
  tournamentId: string,
  bearIdsInOrder: string[],
): Promise<MatchupRecord[]> {
  const tournament = await getTournament(tournamentId);

  if (!tournament) {
    throw new Error("not_found");
  }

  if (tournament.status !== "draft") {
    throw new Error("not_draft");
  }

  if (bearIdsInOrder.length < 2) {
    throw new Error("too_few_bears");
  }

  const uniqueIds = new Set(bearIdsInOrder);

  if (uniqueIds.size !== bearIdsInOrder.length) {
    throw new Error("duplicate_bears");
  }

  const supabase = getServiceSupabase();

  const { data: bearRows, error: bearsError } = await supabase
    .from("bears")
    .select("id")
    .in("id", bearIdsInOrder);

  if (bearsError) {
    throw new Error(`Failed to validate bears: ${bearsError.message}`);
  }

  if ((bearRows ?? []).length !== bearIdsInOrder.length) {
    throw new Error("unknown_bear");
  }

  const skeleton = buildBracketSkeleton(bearIdsInOrder);
  const maxRound = skeleton.rounds.length;

  let working: MatchupLike[] = skeleton.rounds.flatMap((round) =>
    round.matchups.map((slot) => ({
      bearAId: slot.bearAId,
      bearBId: slot.bearBId,
      position: slot.position,
      round: slot.round,
      status: "upcoming",
      winnerId: null,
    })),
  );

  working = resolveByes(working, maxRound);

  const { error: deleteError } = await supabase
    .from("matchups")
    .delete()
    .eq("tournament_id", tournamentId);

  if (deleteError) {
    throw new Error(`Failed to clear matchups: ${deleteError.message}`);
  }

  const insertRows = working.map((matchup) => ({
    bear_a_id: matchup.bearAId,
    bear_b_id: matchup.bearBId,
    position: matchup.position,
    round: matchup.round,
    status: matchup.status ?? "upcoming",
    tournament_id: tournamentId,
    winner_id: matchup.winnerId,
  }));

  const { error: insertError } = await supabase
    .from("matchups")
    .insert(insertRows);

  if (insertError) {
    throw new Error(`Failed to seed matchups: ${insertError.message}`);
  }

  return listMatchupsForTournament(tournamentId);
}

/**
 * Set a matchup winner, clear stale downstream slots when changing, and
 * advance the winner — does not score entries.
 */
export async function setMatchupWinner(
  input: SetMatchupWinnerInput,
): Promise<MatchupRecord[]> {
  const supabase = getServiceSupabase();

  const { data: currentRow, error: currentError } = await supabase
    .from("matchups")
    .select(
      "bear_a_id, bear_b_id, ends_at, id, official_votes_a, official_votes_b, position, round, starts_at, status, tournament_id, winner_id",
    )
    .eq("id", input.matchupId)
    .maybeSingle();

  if (currentError) {
    throw new Error(`Failed to load matchup: ${currentError.message}`);
  }

  if (!currentRow) {
    throw new Error("not_found");
  }

  const current = currentRow as MatchupRow;

  if (input.tournamentId && current.tournament_id !== input.tournamentId) {
    throw new Error("not_found");
  }

  const participants = [current.bear_a_id, current.bear_b_id].filter(
    (id): id is string => Boolean(id),
  );

  if (!participants.includes(input.winnerId)) {
    throw new Error("invalid_winner");
  }

  const { data: allRows, error: listError } = await supabase
    .from("matchups")
    .select(
      "bear_a_id, bear_b_id, ends_at, id, official_votes_a, official_votes_b, position, round, starts_at, status, tournament_id, winner_id",
    )
    .eq("tournament_id", current.tournament_id)
    .order("round", { ascending: true })
    .order("position", { ascending: true });

  if (listError || !allRows) {
    throw new Error(
      `Failed to list matchups for advance: ${listError?.message ?? "unknown"}`,
    );
  }

  let working = (allRows as MatchupRow[]).map(toMatchupLike);
  const maxRound = maxRoundFromMatchups(working);
  const changingWinner =
    current.winner_id !== null && current.winner_id !== input.winnerId;

  // Changing a published winner invalidates everything that depended on it.
  if (changingWinner) {
    working = clearDownstreamFrom(
      working,
      current.round,
      current.position,
      maxRound,
    );
  }

  working = working.map((matchup) => {
    if (matchup.id !== input.matchupId) {
      return matchup;
    }

    return {
      ...matchup,
      status: "complete",
      winnerId: input.winnerId,
    };
  });

  working = applyWinnerToNext(
    working,
    input.winnerId,
    current.round,
    current.position,
    maxRound,
  );

  // Persist every matchup that may have changed (source + downstream path).
  for (const matchup of working) {
    if (!matchup.id) {
      continue;
    }

    const patch: Record<string, null | number | string> = {
      bear_a_id: matchup.bearAId,
      bear_b_id: matchup.bearBId,
      status: matchup.status ?? "upcoming",
      winner_id: matchup.winnerId,
    };

    if (matchup.id === input.matchupId) {
      if (input.officialVotesA !== undefined) {
        patch.official_votes_a = input.officialVotesA;
      }

      if (input.officialVotesB !== undefined) {
        patch.official_votes_b = input.officialVotesB;
      }
    }

    const { error: updateError } = await supabase
      .from("matchups")
      .update(patch)
      .eq("id", matchup.id);

    if (updateError) {
      throw new Error(`Failed to update matchup: ${updateError.message}`);
    }
  }

  return listMatchupsForTournament(current.tournament_id);
}
