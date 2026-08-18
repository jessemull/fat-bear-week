import { assertSameOrigin, jsonData, jsonError } from "@/lib/api.server";
import { revokeSession } from "@/lib/sessions.server";

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) {
    return jsonError("Invalid request origin.", { status: 403 });
  }

  await revokeSession();

  return jsonData({ ok: true });
}
