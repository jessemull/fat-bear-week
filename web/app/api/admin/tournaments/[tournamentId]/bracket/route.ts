import { requireCommissioner } from "@/lib/admin-auth.server";
import { seedBracketBodySchema } from "@/lib/admin-schemas";
import {
  assertSameOrigin,
  jsonData,
  jsonError,
  parseJsonBody,
} from "@/lib/api.server";
import {
  listMatchupsForTournament,
  seedBracketFromBears,
} from "@/lib/matchups.server";

interface RouteContext {
  params: Promise<{
    tournamentId: string;
  }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireCommissioner();

  if ("error" in auth) {
    return auth.error;
  }

  const { tournamentId } = await context.params;

  try {
    const matchups = await listMatchupsForTournament(tournamentId);

    return jsonData({ matchups });
  } catch {
    return jsonError("Unable to list matchups.", { status: 500 });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  if (!assertSameOrigin(request)) {
    return jsonError("Invalid request origin.", { status: 403 });
  }

  const auth = await requireCommissioner();

  if ("error" in auth) {
    return auth.error;
  }

  const parsed = await parseJsonBody(request, seedBracketBodySchema);

  if ("error" in parsed) {
    return parsed.error;
  }

  const { tournamentId } = await context.params;

  try {
    const matchups = await seedBracketFromBears(
      tournamentId,
      parsed.data.bearIdsInOrder,
    );

    return jsonData({ matchups });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message === "not_found") {
      return jsonError("Tournament not found.", { status: 404 });
    }

    if (message === "not_draft") {
      return jsonError("Bracket can only be seeded while draft.", {
        status: 400,
      });
    }

    if (
      message === "too_few_bears" ||
      message === "duplicate_bears" ||
      message === "unknown_bear"
    ) {
      return jsonError("Invalid bear list for seeding.", { status: 400 });
    }

    return jsonError("Unable to seed bracket.", { status: 500 });
  }
}
