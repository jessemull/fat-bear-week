import "server-only";
import { cache } from "react";

import type { TournamentRecord, TournamentStatus } from "@/lib/tournament-types";

import { getServiceSupabase } from "@/lib/supabase.server";

export type { TournamentRecord } from "@/lib/tournament-types";

export interface CreateTournamentInput {
  endsAt?: null | string;
  startsAt?: null | string;
  year: number;
}

export interface UpdateTournamentMetaInput {
  endsAt?: null | string;
  startsAt?: null | string;
  year?: number;
}

const ALL_TOURNAMENT_STATUSES: TournamentStatus[] = [
  "complete",
  "draft",
  "live",
  "locked",
];

/**
 * Allowed status targets from a given status (any other status — reverts OK).
 */
export function allowedTournamentStatuses(
  current: TournamentStatus,
): TournamentStatus[] {
  return ALL_TOURNAMENT_STATUSES.filter((status) => status !== current);
}

export const TOURNAMENT_STATUS_TRANSITIONS: Record<
  TournamentStatus,
  TournamentStatus[]
> = {
  complete: allowedTournamentStatuses("complete"),
  draft: allowedTournamentStatuses("draft"),
  live: allowedTournamentStatuses("live"),
  locked: allowedTournamentStatuses("locked"),
};

interface TournamentRow {
  ends_at: null | string;
  id: string;
  starts_at: null | string;
  status: TournamentStatus;
  year: number;
}

function mapTournament(row: TournamentRow): TournamentRecord {
  return {
    endsAt: row.ends_at,
    id: row.id,
    startsAt: row.starts_at,
    status: row.status,
    year: row.year,
  };
}

/**
 * List all tournaments, newest year first.
 * Cached per request so admin layout + pages share one query.
 */
export const listTournaments = cache(async (): Promise<TournamentRecord[]> => {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from("tournaments")
    .select("ends_at, id, starts_at, status, year")
    .order("year", { ascending: false });

  if (error) {
    throw new Error(`Failed to list tournaments: ${error.message}`);
  }

  return (data as null | TournamentRow[])?.map(mapTournament) ?? [];
});

/**
 * Create a draft tournament for a calendar year.
 */
export async function createTournament(
  input: CreateTournamentInput,
): Promise<TournamentRecord> {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from("tournaments")
    .insert({
      ends_at: input.endsAt ?? null,
      starts_at: input.startsAt ?? null,
      status: "draft",
      year: input.year,
    })
    .select("ends_at, id, starts_at, status, year")
    .single();

  if (error || !data) {
    const message = error?.message ?? "unknown";

    if (message.includes("duplicate") || message.includes("unique")) {
      throw new Error("year_taken");
    }

    throw new Error(`Failed to create tournament: ${message}`);
  }

  return mapTournament(data as TournamentRow);
}

/**
 * Fetch one tournament by id, or null if missing.
 */
export async function getTournament(
  tournamentId: string,
): Promise<null | TournamentRecord> {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from("tournaments")
    .select("ends_at, id, starts_at, status, year")
    .eq("id", tournamentId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to get tournament: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return mapTournament(data as TournamentRow);
}

/**
 * Update year / schedule metadata (not status).
 */
export async function updateTournamentMeta(
  tournamentId: string,
  input: UpdateTournamentMetaInput,
): Promise<TournamentRecord> {
  const supabase = getServiceSupabase();
  const patch: Record<string, null | number | string> = {};

  if (input.endsAt !== undefined) {
    patch.ends_at = input.endsAt;
  }

  if (input.startsAt !== undefined) {
    patch.starts_at = input.startsAt;
  }

  if (input.year !== undefined) {
    patch.year = input.year;
  }

  if (Object.keys(patch).length === 0) {
    const existing = await getTournament(tournamentId);

    if (!existing) {
      throw new Error("not_found");
    }

    return existing;
  }

  const { data, error } = await supabase
    .from("tournaments")
    .update(patch)
    .eq("id", tournamentId)
    .select("ends_at, id, starts_at, status, year")
    .maybeSingle();

  if (error) {
    const message = error.message;

    if (message.includes("duplicate") || message.includes("unique")) {
      throw new Error("year_taken");
    }

    throw new Error(`Failed to update tournament: ${message}`);
  }

  if (!data) {
    throw new Error("not_found");
  }

  return mapTournament(data as TournamentRow);
}

/**
 * Transition tournament status to any other allowed status (including revert).
 */
export async function transitionTournamentStatus(
  tournamentId: string,
  nextStatus: TournamentStatus,
): Promise<TournamentRecord> {
  const existing = await getTournament(tournamentId);

  if (!existing) {
    throw new Error("not_found");
  }

  if (existing.status === nextStatus) {
    throw new Error("invalid_transition");
  }

  const allowed = allowedTournamentStatuses(existing.status);

  if (!allowed.includes(nextStatus)) {
    throw new Error("invalid_transition");
  }

  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from("tournaments")
    .update({ status: nextStatus })
    .eq("id", tournamentId)
    .select("ends_at, id, starts_at, status, year")
    .single();

  if (error || !data) {
    throw new Error(
      `Failed to transition tournament: ${error?.message ?? "unknown"}`,
    );
  }

  return mapTournament(data as TournamentRow);
}

/**
 * Delete a tournament. Fails with in_use when pools still reference it.
 * Matchups cascade via FK.
 */
export async function deleteTournament(tournamentId: string): Promise<void> {
  const existing = await getTournament(tournamentId);

  if (!existing) {
    throw new Error("not_found");
  }

  const supabase = getServiceSupabase();

  const { count, error: poolsError } = await supabase
    .from("pools")
    .select("id", { count: "exact", head: true })
    .eq("tournament_id", tournamentId);

  if (poolsError) {
    throw new Error(`Failed to check pools: ${poolsError.message}`);
  }

  if ((count ?? 0) > 0) {
    throw new Error("in_use");
  }

  const { error } = await supabase
    .from("tournaments")
    .delete()
    .eq("id", tournamentId);

  if (error) {
    const message = error.message.toLowerCase();

    if (
      message.includes("foreign key") ||
      message.includes("violates") ||
      message.includes("restrict")
    ) {
      throw new Error("in_use");
    }

    throw new Error(`Failed to delete tournament: ${error.message}`);
  }
}
