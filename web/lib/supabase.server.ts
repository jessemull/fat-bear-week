import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cachedClient: null | SupabaseClient = null;

/**
 * Service-role Supabase client for server mutations.
 * Bypasses RLS — never import from Client Components.
 */
export function getServiceSupabase(): SupabaseClient {
  if (cachedClient) {
    return cachedClient;
  }

  const key = process.env.SUPABASE_SERVICE_KEY;
  const url = process.env.SUPABASE_URL;

  if (!key || !url) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_KEY (server-only env).",
    );
  }

  cachedClient = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return cachedClient;
}
