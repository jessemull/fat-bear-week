import { requireCommissioner } from "@/lib/admin-auth.server";
import { updateTournamentMetaBodySchema } from "@/lib/admin-schemas";
import {
  assertSameOrigin,
  jsonData,
  jsonError,
  parseJsonBody,
} from "@/lib/api.server";
import {
  deleteTournament,
  getTournament,
  updateTournamentMeta,
} from "@/lib/tournament.server";

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
    const tournament = await getTournament(tournamentId);

    if (!tournament) {
      return jsonError("Tournament not found.", { status: 404 });
    }

    return jsonData({ tournament });
  } catch {
    return jsonError("Unable to load tournament.", { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!assertSameOrigin(request)) {
    return jsonError("Invalid request origin.", { status: 403 });
  }

  const auth = await requireCommissioner();

  if ("error" in auth) {
    return auth.error;
  }

  const parsed = await parseJsonBody(request, updateTournamentMetaBodySchema);

  if ("error" in parsed) {
    return parsed.error;
  }

  const { tournamentId } = await context.params;

  try {
    const tournament = await updateTournamentMeta(tournamentId, parsed.data);

    return jsonData({ tournament });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message === "not_found") {
      return jsonError("Tournament not found.", { status: 404 });
    }

    if (message === "year_taken") {
      return jsonError("A tournament for that year already exists.", {
        status: 409,
      });
    }

    return jsonError("Unable to update tournament.", { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!assertSameOrigin(request)) {
    return jsonError("Invalid request origin.", { status: 403 });
  }

  const auth = await requireCommissioner();

  if ("error" in auth) {
    return auth.error;
  }

  const { tournamentId } = await context.params;

  try {
    await deleteTournament(tournamentId);

    return jsonData({ deleted: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message === "not_found") {
      return jsonError("Tournament not found.", { status: 404 });
    }

    if (message === "in_use") {
      return jsonError(
        "Delete or reassign pools tied to this tournament first.",
        { status: 409 },
      );
    }

    return jsonError("Unable to delete tournament.", { status: 500 });
  }
}
