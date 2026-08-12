import "server-only";

import type { BearSex } from "@/lib/tournament-types";

import { getServiceSupabase } from "@/lib/supabase.server";
import { getTournament } from "@/lib/tournament.server";

export interface BearRecord {
  age: null | number;
  description: null | string;
  id: string;
  imageUrl: null | string;
  name: string;
  nickname: null | string;
  number: null | number;
  officialId: null | string;
  profileUrl: null | string;
  sex: BearSex | null;
}

export interface CreateBearInput {
  age?: null | number;
  description?: null | string;
  imageUrl?: null | string;
  name: string;
  nickname?: null | string;
  number?: null | number;
  officialId?: null | string;
  profileUrl?: null | string;
  sex?: BearSex | null;
}

export interface UpdateBearInput {
  age?: null | number;
  description?: null | string;
  imageUrl?: null | string;
  name?: string;
  nickname?: null | string;
  number?: null | number;
  officialId?: null | string;
  profileUrl?: null | string;
  sex?: BearSex | null;
}

interface BearRow {
  age: null | number;
  description: null | string;
  id: string;
  image_url: null | string;
  name: string;
  nickname: null | string;
  number: null | number;
  official_id: null | string;
  profile_url: null | string;
  sex: BearSex | null;
}

function mapBear(row: BearRow): BearRecord {
  return {
    age: row.age,
    description: row.description,
    id: row.id,
    imageUrl: row.image_url,
    name: row.name,
    nickname: row.nickname,
    number: row.number,
    officialId: row.official_id,
    profileUrl: row.profile_url,
    sex: row.sex,
  };
}

/**
 * List bears for admin tournament tooling.
 *
 * Bears are a shared catalog (no tournament_id in schema); we still require a
 * valid tournament id so nested admin routes fail closed on bad URLs.
 */
export async function listBearsForTournament(
  tournamentId: string,
): Promise<BearRecord[]> {
  const tournament = await getTournament(tournamentId);

  if (!tournament) {
    throw new Error("not_found");
  }

  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from("bears")
    .select(
      "age, description, id, image_url, name, nickname, number, official_id, profile_url, sex",
    )
    .order("number", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to list bears: ${error.message}`);
  }

  return (data as BearRow[] | null)?.map(mapBear) ?? [];
}

/**
 * Create a bear in the shared catalog.
 */
export async function createBear(input: CreateBearInput): Promise<BearRecord> {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from("bears")
    .insert({
      age: input.age ?? null,
      description: input.description ?? null,
      image_url: input.imageUrl ?? null,
      name: input.name,
      nickname: input.nickname ?? null,
      number: input.number ?? null,
      official_id: input.officialId ?? null,
      profile_url: input.profileUrl ?? null,
      sex: input.sex ?? null,
    })
    .select(
      "age, description, id, image_url, name, nickname, number, official_id, profile_url, sex",
    )
    .single();

  if (error || !data) {
    const message = error?.message ?? "unknown";

    if (message.includes("duplicate") || message.includes("unique")) {
      throw new Error("official_id_taken");
    }

    throw new Error(`Failed to create bear: ${message}`);
  }

  return mapBear(data as BearRow);
}

/**
 * Update bear fields by id.
 */
export async function updateBear(
  bearId: string,
  input: UpdateBearInput,
): Promise<BearRecord> {
  const supabase = getServiceSupabase();
  const patch: Record<string, null | number | string> = {};

  if (input.age !== undefined) {
    patch.age = input.age;
  }

  if (input.description !== undefined) {
    patch.description = input.description;
  }

  if (input.imageUrl !== undefined) {
    patch.image_url = input.imageUrl;
  }

  if (input.name !== undefined) {
    patch.name = input.name;
  }

  if (input.nickname !== undefined) {
    patch.nickname = input.nickname;
  }

  if (input.number !== undefined) {
    patch.number = input.number;
  }

  if (input.officialId !== undefined) {
    patch.official_id = input.officialId;
  }

  if (input.profileUrl !== undefined) {
    patch.profile_url = input.profileUrl;
  }

  if (input.sex !== undefined) {
    patch.sex = input.sex;
  }

  if (Object.keys(patch).length === 0) {
    const { data, error } = await supabase
      .from("bears")
      .select(
        "age, description, id, image_url, name, nickname, number, official_id, profile_url, sex",
      )
      .eq("id", bearId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to get bear: ${error.message}`);
    }

    if (!data) {
      throw new Error("not_found");
    }

    return mapBear(data as BearRow);
  }

  const { data, error } = await supabase
    .from("bears")
    .update(patch)
    .eq("id", bearId)
    .select(
      "age, description, id, image_url, name, nickname, number, official_id, profile_url, sex",
    )
    .maybeSingle();

  if (error) {
    const message = error.message;

    if (message.includes("duplicate") || message.includes("unique")) {
      throw new Error("official_id_taken");
    }

    throw new Error(`Failed to update bear: ${message}`);
  }

  if (!data) {
    throw new Error("not_found");
  }

  return mapBear(data as BearRow);
}

/**
 * Delete a bear when it is not referenced by any matchup.
 */
export async function deleteBear(bearId: string): Promise<void> {
  const supabase = getServiceSupabase();

  const { count, error: refError } = await supabase
    .from("matchups")
    .select("id", { count: "exact", head: true })
    .or(
      `bear_a_id.eq.${bearId},bear_b_id.eq.${bearId},winner_id.eq.${bearId}`,
    );

  if (refError) {
    throw new Error(`Failed to check bear matchups: ${refError.message}`);
  }

  if ((count ?? 0) > 0) {
    throw new Error("bear_in_use");
  }

  const { data, error } = await supabase
    .from("bears")
    .delete()
    .eq("id", bearId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to delete bear: ${error.message}`);
  }

  if (!data) {
    throw new Error("not_found");
  }
}
