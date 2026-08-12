import { z } from "zod";

import { requireCommissioner } from "@/lib/admin-auth.server";
import {
  assertSameOrigin,
  jsonData,
  jsonError,
  parseJsonBody,
} from "@/lib/api.server";
import { setMatchupWinner } from "@/lib/matchups.server";

interface RouteContext {
  params: Promise<{
    tournamentId: string;
  }>;
}

const batchResultsBodySchema = z
  .object({
    results: z
      .array(
        z
          .object({
            matchupId: z.string().uuid(),
            officialVotesA: z.number().int().min(0).nullable().optional(),
            officialVotesB: z.number().int().min(0).nullable().optional(),
            winnerId: z.string().uuid(),
          })
          .strict(),
      )
      .min(1)
      .max(128),
  })
  .strict();

export async function POST(request: Request, context: RouteContext) {
  if (!assertSameOrigin(request)) {
    return jsonError("Invalid request origin.", { status: 403 });
  }

  const auth = await requireCommissioner();

  if ("error" in auth) {
    return auth.error;
  }

  const { tournamentId } = await context.params;
  const parsed = await parseJsonBody(request, batchResultsBodySchema);

  if ("error" in parsed) {
    return parsed.error;
  }

  try {
    const results = [];

    for (const result of parsed.data.results) {
      const matchups = await setMatchupWinner({
        matchupId: result.matchupId,
        officialVotesA: result.officialVotesA,
        officialVotesB: result.officialVotesB,
        tournamentId,
        winnerId: result.winnerId,
      });

      results.push(matchups);
    }

    return jsonData({ matchups: results });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message === "not_found") {
      return jsonError("Matchup not found.", { status: 404 });
    }

    if (message === "invalid_winner") {
      return jsonError("Winner must be bear A or bear B.", { status: 400 });
    }

    return jsonError("Unable to set batch results.", { status: 500 });
  }
}
