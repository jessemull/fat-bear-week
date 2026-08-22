import {
  parseAccountErrorMessage,
  updateAccountName,
} from "@/lib/account.server";
import {
  assertSameOrigin,
  jsonData,
  jsonError,
  parseJsonBody,
} from "@/lib/api.server";
import { updateAccountNameBodySchema } from "@/lib/auth-schemas";
import { getSession } from "@/lib/sessions.server";

export async function PATCH(request: Request) {
  if (!assertSameOrigin(request)) {
    return jsonError("Invalid request origin.", { status: 403 });
  }

  const session = await getSession();

  if (!session) {
    return jsonError("Not signed in.", { status: 401 });
  }

  const parsed = await parseJsonBody(request, updateAccountNameBodySchema);

  if ("error" in parsed) {
    return parsed.error;
  }

  try {
    const result = await updateAccountName({
      name: parsed.data.name,
      userId: session.id,
    });

    return jsonData(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "update_failed";
    const code = parseAccountErrorMessage(message) ?? message;

    if (code === "invalid_name") {
      return jsonError("Enter a display name.", { status: 400 });
    }

    if (code === "name_has_at") {
      return jsonError("Display names cannot include @.", { status: 400 });
    }

    if (code === "name_taken") {
      return jsonError("That display name is already taken.", { status: 409 });
    }

    console.error("account name update failed", error);

    return jsonError("Unable to update name right now.", { status: 500 });
  }
}
