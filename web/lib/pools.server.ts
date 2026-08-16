import "server-only";

import { getServiceSupabase } from "@/lib/supabase.server";

export interface CreatePoolInput {
  bracketDeadline?: null | string;
  maxPlayers: number;
  name: string;
  scoringSystem: string;
  showBracketsBeforeLock: boolean;
  tournamentId: string;
}

export interface CreatedPool {
  bracketDeadline: null | string;
  id: string;
  maxPlayers: number;
  name: string;
  scoringSystem: string;
  showBracketsBeforeLock: boolean;
  tournamentId: string;
}

export interface PoolSummary {
  bracketDeadline: null | string;
  entryCount: number;
  id: string;
  maxPlayers: number;
  name: string;
  role: "commissioner" | "member";
  scoringSystem: string;
  showBracketsBeforeLock: boolean;
  tournamentId: string;
}

export interface UpdatePoolInput {
  bracketDeadline?: null | string;
  maxPlayers: number;
  name: string;
  scoringSystem?: string;
  showBracketsBeforeLock?: boolean;
  tournamentId: string;
}

const POOL_SELECT =
  "bracket_deadline, id, max_players, name, scoring_system, show_brackets_before_lock, tournament_id";

function mapPoolRow(data: Record<string, unknown>): CreatedPool {
  return {
    bracketDeadline: (data.bracket_deadline as null | string) ?? null,
    id: data.id as string,
    maxPlayers: data.max_players as number,
    name: data.name as string,
    scoringSystem: data.scoring_system as string,
    showBracketsBeforeLock: data.show_brackets_before_lock as boolean,
    tournamentId: data.tournament_id as string,
  };
}

/**
 * Create a private pool tied to a tournament.
 */
export async function createPool(
  input: CreatePoolInput,
): Promise<CreatedPool> {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from("pools")
    .insert({
      bracket_deadline: input.bracketDeadline ?? null,
      max_players: input.maxPlayers,
      name: input.name,
      scoring_system: input.scoringSystem,
      show_brackets_before_lock: input.showBracketsBeforeLock,
      tournament_id: input.tournamentId,
    })
    .select(POOL_SELECT)
    .single();

  if (error || !data) {
    const message = error?.message ?? "unknown";

    if (message.includes("tournament_id") || message.includes("foreign key")) {
      throw new Error("unknown_tournament");
    }

    throw new Error(`Failed to create pool: ${message}`);
  }

  return mapPoolRow(data as Record<string, unknown>);
}

/**
 * Delete a pool and cascaded invites / entries.
 */
export async function deletePool(poolId: string): Promise<void> {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from("pools")
    .delete()
    .eq("id", poolId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to delete pool: ${error.message}`);
  }

  if (!data) {
    throw new Error("not_found");
  }
}

/**
 * Load one pool by id.
 */
export async function getPool(poolId: string): Promise<CreatedPool | null> {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from("pools")
    .select(POOL_SELECT)
    .eq("id", poolId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load pool: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return mapPoolRow(data as Record<string, unknown>);
}

/**
 * List pools the user has an entry in, plus all pools when commissioner.
 */
export async function listPoolsForUser(params: {
  isCommissioner: boolean;
  userId: string;
}): Promise<PoolSummary[]> {
  const { isCommissioner, userId } = params;
  const supabase = getServiceSupabase();

  const memberPoolIds = new Set<string>();

  const { data: entries, error: entriesError } = await supabase
    .from("entries")
    .select("pool_id")
    .eq("user_id", userId);

  if (entriesError) {
    throw new Error(`Failed to list entries: ${entriesError.message}`);
  }

  for (const entry of entries ?? []) {
    memberPoolIds.add(entry.pool_id as string);
  }

  if (!isCommissioner && memberPoolIds.size === 0) {
    return [];
  }

  let poolsQuery = supabase
    .from("pools")
    .select(POOL_SELECT)
    .order("created_at", { ascending: false });

  if (!isCommissioner) {
    poolsQuery = poolsQuery.in("id", [...memberPoolIds]);
  }

  const { data: pools, error: poolsError } = await poolsQuery;

  if (poolsError) {
    throw new Error(`Failed to list pools: ${poolsError.message}`);
  }

  const summaries: PoolSummary[] = [];

  for (const pool of pools ?? []) {
    const poolId = pool.id as string;

    const { count, error: countError } = await supabase
      .from("entries")
      .select("id", { count: "exact", head: true })
      .eq("pool_id", poolId);

    if (countError) {
      throw new Error(`Failed to count entries: ${countError.message}`);
    }

    summaries.push({
      bracketDeadline: (pool.bracket_deadline as null | string) ?? null,
      entryCount: count ?? 0,
      id: poolId,
      maxPlayers: pool.max_players as number,
      name: pool.name as string,
      role: isCommissioner ? "commissioner" : "member",
      scoringSystem: pool.scoring_system as string,
      showBracketsBeforeLock: pool.show_brackets_before_lock as boolean,
      tournamentId: pool.tournament_id as string,
    });
  }

  return summaries;
}

/**
 * Update pool settings.
 */
export async function updatePool(
  poolId: string,
  input: UpdatePoolInput,
): Promise<CreatedPool> {
  const supabase = getServiceSupabase();

  const patch: Record<string, boolean | null | number | string> = {
    bracket_deadline: input.bracketDeadline ?? null,
    max_players: input.maxPlayers,
    name: input.name,
    tournament_id: input.tournamentId,
  };

  if (input.scoringSystem !== undefined) {
    patch.scoring_system = input.scoringSystem;
  }

  if (input.showBracketsBeforeLock !== undefined) {
    patch.show_brackets_before_lock = input.showBracketsBeforeLock;
  }

  const { data, error } = await supabase
    .from("pools")
    .update(patch)
    .eq("id", poolId)
    .select(POOL_SELECT)
    .maybeSingle();

  if (error) {
    const message = error.message;

    if (message.includes("tournament_id") || message.includes("foreign key")) {
      throw new Error("unknown_tournament");
    }

    throw new Error(`Failed to update pool: ${message}`);
  }

  if (!data) {
    throw new Error("not_found");
  }

  return mapPoolRow(data as Record<string, unknown>);
}

/**
 * True when the user may manage invites for the pool.
 */
export async function userCanManagePool(params: {
  isCommissioner: boolean;
  poolId: string;
}): Promise<boolean> {
  if (!params.isCommissioner) {
    return false;
  }

  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from("pools")
    .select("id")
    .eq("id", params.poolId)
    .maybeSingle();

  if (error || !data) {
    return false;
  }

  return true;
}
