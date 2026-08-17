import {
  assertSameOrigin,
  jsonData,
  jsonError,
  parseJsonBody,
} from "@/lib/api.server";
import { mintInvitesBodySchema } from "@/lib/auth-schemas";
import { buildInviteUrl, sendInviteEmail } from "@/lib/email.server";
import {
  INVITE_MINT_CONCURRENCY,
  listInvitesForPool,
  mapWithConcurrency,
  mintInvite,
} from "@/lib/invites.server";
import { requirePoolCommissioner } from "@/lib/pools.server";
import { getServiceSupabase } from "@/lib/supabase.server";

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

  const parsed = await parseJsonBody(request, mintInvitesBodySchema);

  if ("error" in parsed) {
    return parsed.error;
  }

  const supabase = getServiceSupabase();
  const { data: pool } = await supabase
    .from("pools")
    .select("name")
    .eq("id", poolId)
    .maybeSingle();
  const poolName = (pool?.name as string | undefined) ?? "Fat Bear Week pool";

  const uniqueInvites = new Map<
    string,
    { email: string; nameHint: null | string }
  >();

  for (const invite of parsed.data.invites) {
    const email = invite.email.toLowerCase();

    if (!uniqueInvites.has(email)) {
      uniqueInvites.set(email, {
        email,
        nameHint: invite.nameHint?.trim() ? invite.nameHint.trim() : null,
      });
    }
  }

  const entries = [...uniqueInvites.values()];

  interface MintResult {
    email: string;
    emailSent?: boolean;
    error?: string;
    inviteId?: string;
    inviteUrl?: string;
  }

  const results = await mapWithConcurrency(
    entries,
    INVITE_MINT_CONCURRENCY,
    async (entry): Promise<MintResult> => {
      try {
        const invite = await mintInvite({
          email: entry.email,
          nameHint: entry.nameHint,
          poolId,
        });
        const inviteUrl = buildInviteUrl(invite.token);
        const sendResult = await sendInviteEmail({
          expiresAt: invite.expiresAt,
          inviteUrl,
          nameHint: invite.nameHint,
          poolName,
          to: invite.email,
        });

        return {
          email: invite.email,
          emailSent: sendResult.emailSent,
          inviteId: invite.id,
          ...(sendResult.emailSent ? {} : { inviteUrl }),
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "";

        return {
          email: entry.email,
          error:
            message === "email_invited"
              ? "An unused invite already exists for that email."
              : message === "NEXT_PUBLIC_SITE_URL is not configured."
                ? "Site URL is not configured."
                : "Unable to mint invite.",
        };
      }
    },
  );

  const created = results.filter((result) => result.inviteId).length;

  return jsonData(
    {
      created,
      failed: results.length - created,
      results,
    },
    { status: created > 0 ? 201 : 400 },
  );
}
