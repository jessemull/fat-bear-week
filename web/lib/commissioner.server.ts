import "server-only";

import { getServiceSupabase } from "@/lib/supabase.server";

/**
 * True when the user has users.is_commissioner set in the database.
 */
export async function userIsCommissioner(userId: string): Promise<boolean> {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from("users")
    .select("is_commissioner")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    return false;
  }

  return Boolean(data.is_commissioner);
}
