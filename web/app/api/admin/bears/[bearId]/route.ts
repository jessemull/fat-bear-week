import { requireCommissioner } from "@/lib/admin-auth.server";
import { updateBearBodySchema } from "@/lib/admin-schemas";
import {
  assertSameOrigin,
  jsonData,
  jsonError,
  parseJsonBody,
} from "@/lib/api.server";
import { deleteBear, updateBear } from "@/lib/bears.server";

interface RouteContext {
  params: Promise<{
    bearId: string;
  }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!assertSameOrigin(request)) {
    return jsonError("Invalid request origin.", { status: 403 });
  }

  const auth = await requireCommissioner();

  if ("error" in auth) {
    return auth.error;
  }

  const parsed = await parseJsonBody(request, updateBearBodySchema);

  if ("error" in parsed) {
    return parsed.error;
  }

  const { bearId } = await context.params;

  try {
    const bear = await updateBear(bearId, parsed.data);

    return jsonData({ bear });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message === "not_found") {
      return jsonError("Bear not found.", { status: 404 });
    }

    if (message === "official_id_taken") {
      return jsonError("That official ID is already in use.", { status: 409 });
    }

    return jsonError("Unable to update bear.", { status: 500 });
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

  const { bearId } = await context.params;

  try {
    await deleteBear(bearId);

    return jsonData({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message === "bear_in_use") {
      return jsonError("Bear is used in a matchup and cannot be deleted.", {
        status: 409,
      });
    }

    if (message === "not_found") {
      return jsonError("Bear not found.", { status: 404 });
    }

    return jsonError("Unable to delete bear.", { status: 500 });
  }
}
