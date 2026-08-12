import {
  assertSameOrigin,
  jsonData,
  jsonError,
  parseJsonBody,
} from "@/lib/api.server";
import { mintInviteBodySchema } from "@/lib/auth-schemas";
import { buildInviteUrl, sendInviteEmail } from "@/lib/email.server";
import { listInvitesForPool, mintInvite } from "@/lib/invites.server";
import { userCanManagePool } from "@/lib/pools.server";
import { getSession } from "@/lib/sessions.server";
import { getServiceSupabase } from "@/lib/supabase.server";

interface RouteContext {
  params: Promise<{
    poolId: string;
  }>;
}

async function requirePoolCommissioner(poolId: string) {
  const session = await getSession();

  if (!session) {
    return { error: jsonError("Not signed in.", { status: 401 }) } as const;
  }

  if (
    !(await userCanManagePool({
      isCommissioner: session.isCommissioner,
      poolId,
    }))
  ) {
    return {
      error: jsonError("Commissioner access required.", { status: 403 }),
    } as const;
  }

  return { session } as const;
}

export async function GET(_request: Request, context: RouteContext) {
  const { poolId } = await context.params;
  const auth = await requirePoolCommissioner(poolId);

  if ("error" in auth) {
    return auth.error;
  }

  try {
    const invites = await listInvitesForPool(poolId);

    return jsonData({ invites });
  } catch {
    return jsonError("Unable to list invites.", { status: 500 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  if (!assertSameOrigin(request)) {
    return jsonError("Invalid request origin.", { status: 403 });
  }

  const { poolId } = await context.params;
  const auth = await requirePoolCommissioner(poolId);

  if ("error" in auth) {
    return auth.error;
  }

  const parsed = await parseJsonBody(request, mintInviteBodySchema);

  if ("error" in parsed) {
    return parsed.error;
  }

  try {
    const invite = await mintInvite({
      email: parsed.data.email,
      expiresAt: parsed.data.expiresAt,
      nameHint: parsed.data.nameHint ?? null,
      poolId,
    });

    const supabase = getServiceSupabase();
    const { data: pool } = await supabase
      .from("pools")
      .select("name")
      .eq("id", poolId)
      .maybeSingle();

    const inviteUrl = buildInviteUrl(invite.token);
    const sendResult = await sendInviteEmail({
      expiresAt: invite.expiresAt,
      inviteUrl,
      nameHint: invite.nameHint,
      poolName: (pool?.name as string | undefined) ?? "Fat Bear Week pool",
      to: invite.email,
    });

    return jsonData(
      {
        emailSent: sendResult.emailSent,
        expiresAt: invite.expiresAt,
        inviteId: invite.id,
        inviteUrl,
        nameHint: invite.nameHint,
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message === "email_invited") {
      return jsonError("An unused invite already exists for that email.", {
        status: 409,
      });
    }

    return jsonError("Unable to mint invite.", { status: 500 });
  }
}
