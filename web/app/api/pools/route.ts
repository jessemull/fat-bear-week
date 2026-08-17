import {
  assertSameOrigin,
  jsonData,
  jsonError,
  parseJsonBody,
} from "@/lib/api.server";
import { createPoolBodySchema } from "@/lib/auth-schemas";
import { createPool, listPoolsForUser } from "@/lib/pools.server";
import { getSession } from "@/lib/sessions.server";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return jsonError("Not signed in.", { status: 401 });
  }

  try {
    const pools = await listPoolsForUser({
      isCommissioner: session.isCommissioner,
      userId: session.id,
    });

    return jsonData({ pools });
  } catch {
    return jsonError("Unable to list pools.", { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) {
    return jsonError("Invalid request origin.", { status: 403 });
  }

  const session = await getSession();

  if (!session) {
    return jsonError("Not signed in.", { status: 401 });
  }

  if (!session.isCommissioner) {
    return jsonError("Commissioner access required.", { status: 403 });
  }

  const parsed = await parseJsonBody(request, createPoolBodySchema);

  if ("error" in parsed) {
    return parsed.error;
  }

  try {
    const pool = await createPool({
      bracketDeadline: parsed.data.bracketDeadline ?? null,
      maxPlayers: parsed.data.maxPlayers,
      name: parsed.data.name,
      scoringSystem: parsed.data.scoringSystem,
      showBracketsBeforeLock: parsed.data.showBracketsBeforeLock,
      tournamentId: parsed.data.tournamentId,
    });

    return jsonData({ pool }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message === "unknown_tournament") {
      return jsonError("Unknown tournament.", { status: 400 });
    }

    return jsonError("Unable to create pool.", { status: 500 });
  }
}
