import { requireCommissioner } from "@/lib/admin-auth.server";
import { transitionTournamentStatusBodySchema } from "@/lib/admin-schemas";
import {
  assertSameOrigin,
  jsonData,
  jsonError,
  parseJsonBody,
} from "@/lib/api.server";
import { transitionTournamentStatus } from "@/lib/tournament.server";

interface RouteContext {
  params: Promise<{
    tournamentId: string;
  }>;
}

export async function POST(request: Request, context: RouteContext) {
  if (!assertSameOrigin(request)) {
    return jsonError("Invalid request origin.", { status: 403 });
  }

  const auth = await requireCommissioner();

  if ("error" in auth) {
    return auth.error;
  }

  const parsed = await parseJsonBody(
    request,
    transitionTournamentStatusBodySchema,
  );

  if ("error" in parsed) {
    return parsed.error;
  }

  const { tournamentId } = await context.params;

  try {
    const tournament = await transitionTournamentStatus(
      tournamentId,
      parsed.data.status,
    );

    return jsonData({ tournament });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message === "invalid_transition") {
      return jsonError("That status transition is not allowed.", {
        status: 400,
      });
    }

    if (message === "not_found") {
      return jsonError("Tournament not found.", { status: 404 });
    }

    return jsonError("Unable to update tournament status.", { status: 500 });
  }
}
