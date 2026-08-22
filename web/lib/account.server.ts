import "server-only";

import { hashPassword, verifyPassword } from "@/lib/passwords.server";
import { revokeOtherSessions } from "@/lib/sessions.server";
import { getServiceSupabase } from "@/lib/supabase.server";

export interface AccountRecord {
  email: null | string;
  id: string;
  name: string;
}

export type UpdateAccountNameErrorCode =
  | "invalid_name"
  | "name_has_at"
  | "name_taken";

/**
 * Load the signed-in user's account fields for settings.
 */
export async function getAccount(
  userId: string,
): Promise<AccountRecord | null> {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from("users")
    .select("email, id, name")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    email: (data.email as null | string) ?? null,
    id: data.id as string,
    name: data.name as string,
  };
}

/**
 * Update display name. Unique case-insensitive; `@` is reserved for email login.
 */
export async function updateAccountName(params: {
  name: string;
  userId: string;
}): Promise<{ name: string }> {
  const name = params.name.trim();

  if (!name) {
    throw new Error("invalid_name");
  }

  if (name.includes("@")) {
    throw new Error("name_has_at");
  }

  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from("users")
    .update({ name })
    .eq("id", params.userId)
    .select("name")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      throw new Error("name_taken");
    }

    throw new Error(`Failed to update name: ${error.message}`);
  }

  if (!data) {
    throw new Error("user_missing");
  }

  return { name: data.name as string };
}

/**
 * Verify the current password and set a new hash. Revokes other sessions
 * before storing the hash so a revoke failure cannot leave those cookies valid.
 */
export async function changeAccountPassword(params: {
  currentPassword: string;
  newPassword: string;
  userId: string;
}): Promise<void> {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from("users")
    .select("password_hash")
    .eq("id", params.userId)
    .maybeSingle();

  if (error || !data?.password_hash) {
    throw new Error("invalid_credentials");
  }

  const valid = await verifyPassword(
    params.currentPassword,
    data.password_hash as string,
  );

  if (!valid) {
    throw new Error("invalid_credentials");
  }

  await revokeOtherSessions(params.userId);

  const passwordHash = await hashPassword(params.newPassword);
  const { error: updateError } = await supabase
    .from("users")
    .update({ password_hash: passwordHash })
    .eq("id", params.userId);

  if (updateError) {
    throw new Error(`Failed to update password: ${updateError.message}`);
  }
}

export function parseAccountErrorMessage(
  message: string,
): null | UpdateAccountNameErrorCode {
  if (message.includes("name_has_at")) {
    return "name_has_at";
  }

  if (message.includes("name_taken")) {
    return "name_taken";
  }

  if (message.includes("invalid_name")) {
    return "invalid_name";
  }

  return null;
}
