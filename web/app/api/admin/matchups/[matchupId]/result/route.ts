import { requireCommissioner } from "@/lib/admin-auth.server";
import { setMatchupWinnerBodySchema } from "@/lib/admin-schemas";
import {
  assertSameOrigin,
  jsonData,
  jsonError,
  parseJsonBody,
} from "@/lib/api.server";
import { setMatchupWinner } from "@/lib/matchups.server";

interface RouteContext {
  params: Promise<{
    matchupId: string;
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

  const parsed = await parseJsonBody(request, setMatchupWinnerBodySchema);

  if ("error" in parsed) {
    return parsed.error;
  }

  const { matchupId } = await context.params;

  try {
    const matchups = await setMatchupWinner({
      matchupId,
      officialVotesA: parsed.data.officialVotesA,
      officialVotesB: parsed.data.officialVotesB,
      winnerId: parsed.data.winnerId,
    });

    return jsonData({ matchups });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message === "not_found") {
      return jsonError("Matchup not found.", { status: 404 });
    }

    if (message === "invalid_winner") {
      return jsonError("Winner must be bear A or bear B.", { status: 400 });
    }

    return jsonError("Unable to set matchup result.", { status: 500 });
  }
}
