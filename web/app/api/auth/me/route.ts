import { jsonData, jsonError } from "@/lib/api.server";
import { getSession } from "@/lib/sessions.server";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return jsonError("Not signed in.", { status: 401 });
  }

  return jsonData({
    isCommissioner: session.isCommissioner,
    userId: session.id,
    userName: session.name,
  });
}
