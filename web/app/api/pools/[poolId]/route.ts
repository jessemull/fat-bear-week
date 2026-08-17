import {
  assertSameOrigin,
  jsonData,
  jsonError,
  parseJsonBody,
} from "@/lib/api.server";
import { updatePoolBodySchema } from "@/lib/auth-schemas";
import {
  deletePool,
  getPool,
  requirePoolCommissioner,
  updatePool,
} from "@/lib/pools.server";

interface RouteContext {
  params: Promise<{
    poolId: string;
  }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { poolId } = await context.params;
  const auth = await requirePoolCommissioner(poolId);

  if ("error" in auth) {
    return auth.error;
  }

  try {
    const pool = await getPool(poolId);

    if (!pool) {
      return jsonError("Pool not found.", { status: 404 });
    }

    return jsonData({ pool });
  } catch {
    return jsonError("Unable to load pool.", { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!assertSameOrigin(request)) {
    return jsonError("Invalid request origin.", { status: 403 });
  }

  const { poolId } = await context.params;
  const auth = await requirePoolCommissioner(poolId);

  if ("error" in auth) {
    return auth.error;
  }

  const parsed = await parseJsonBody(request, updatePoolBodySchema);

  if ("error" in parsed) {
    return parsed.error;
  }

  try {
    const pool = await updatePool(poolId, {
      bracketDeadline: parsed.data.bracketDeadline ?? null,
      maxPlayers: parsed.data.maxPlayers,
      name: parsed.data.name,
      scoringSystem: parsed.data.scoringSystem,
      showBracketsBeforeLock: parsed.data.showBracketsBeforeLock,
      tournamentId: parsed.data.tournamentId,
    });

    return jsonData({ pool });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message === "not_found") {
      return jsonError("Pool not found.", { status: 404 });
    }

    if (message === "unknown_tournament") {
      return jsonError("Unknown tournament.", { status: 400 });
    }

    return jsonError("Unable to update pool.", { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!assertSameOrigin(request)) {
    return jsonError("Invalid request origin.", { status: 403 });
  }

  const { poolId } = await context.params;
  const auth = await requirePoolCommissioner(poolId);

  if ("error" in auth) {
    return auth.error;
  }

  try {
    await deletePool(poolId);

    return jsonData({ deleted: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message === "not_found") {
      return jsonError("Pool not found.", { status: 404 });
    }

    return jsonError("Unable to delete pool.", { status: 500 });
  }
}
