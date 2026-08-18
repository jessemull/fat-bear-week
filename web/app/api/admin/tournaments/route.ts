import { requireCommissioner } from "@/lib/admin-auth.server";
import { createTournamentBodySchema } from "@/lib/admin-schemas";
import {
  assertSameOrigin,
  jsonData,
  jsonError,
  parseJsonBody,
} from "@/lib/api.server";
import { createTournament, listTournaments } from "@/lib/tournament.server";

export async function GET() {
  const auth = await requireCommissioner();

  if ("error" in auth) {
    return auth.error;
  }

  try {
    const tournaments = await listTournaments();

    return jsonData({ tournaments });
  } catch {
    return jsonError("Unable to list tournaments.", { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) {
    return jsonError("Invalid request origin.", { status: 403 });
  }

  const auth = await requireCommissioner();

  if ("error" in auth) {
    return auth.error;
  }

  const parsed = await parseJsonBody(request, createTournamentBodySchema);

  if ("error" in parsed) {
    return parsed.error;
  }

  try {
    const tournament = await createTournament(parsed.data);

    return jsonData({ tournament }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message === "year_taken") {
      return jsonError("A tournament for that year already exists.", {
        status: 409,
      });
    }

    return jsonError("Unable to create tournament.", { status: 500 });
  }
}
