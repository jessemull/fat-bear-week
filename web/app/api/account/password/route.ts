import { changeAccountPassword } from "@/lib/account.server";
import {
  assertSameOrigin,
  jsonData,
  jsonError,
  parseJsonBody,
} from "@/lib/api.server";
import { changePasswordBodySchema } from "@/lib/auth-schemas";
import { getSession } from "@/lib/sessions.server";

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) {
    return jsonError("Invalid request origin.", { status: 403 });
  }

  const session = await getSession();

  if (!session) {
    return jsonError("Not signed in.", { status: 401 });
  }

  const parsed = await parseJsonBody(request, changePasswordBodySchema);

  if ("error" in parsed) {
    return parsed.error;
  }

  try {
    await changeAccountPassword({
      currentPassword: parsed.data.currentPassword,
      newPassword: parsed.data.password,
      userId: session.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "change_failed";

    if (message === "invalid_credentials") {
      return jsonError("Current password is incorrect.", { status: 401 });
    }

    console.error("account password change failed", error);

    return jsonError("Unable to change password right now.", { status: 500 });
  }

  return jsonData({ ok: true });
}
