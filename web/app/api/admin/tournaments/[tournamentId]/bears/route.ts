import { requireCommissioner } from "@/lib/admin-auth.server";
import { createBearBodySchema } from "@/lib/admin-schemas";
import {
  assertSameOrigin,
  jsonData,
  jsonError,
  parseJsonBody,
} from "@/lib/api.server";
import { createBear, listBearsForTournament } from "@/lib/bears.server";

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
    const bears = await listBearsForTournament(tournamentId);

    return jsonData({ bears });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message === "not_found") {
      return jsonError("Tournament not found.", { status: 404 });
    }

    return jsonError("Unable to list bears.", { status: 500 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  if (!assertSameOrigin(request)) {
    return jsonError("Invalid request origin.", { status: 403 });
  }

  const auth = await requireCommissioner();

  if ("error" in auth) {
    return auth.error;
  }

  // Nested under tournament for URL consistency; bears are a global catalog.
  await context.params;

  const parsed = await parseJsonBody(request, createBearBodySchema);

  if ("error" in parsed) {
    return parsed.error;
  }

  try {
    const bear = await createBear(parsed.data);

    return jsonData({ bear }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message === "official_id_taken") {
      return jsonError("That official ID is already in use.", { status: 409 });
    }

    return jsonError("Unable to create bear.", { status: 500 });
  }
}
