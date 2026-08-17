import Link from "next/link";

import { JoinPanel } from "@/components/auth/JoinPanel";
import { findUserByLoginIdentifier } from "@/lib/auth.server";
import {
  formHeadingClassName,
  formLinkClassName,
  formMutedClassName,
  formPageClassName,
} from "@/lib/form-styles";
import { getInviteByToken } from "@/lib/invites.server";

export const dynamic = "force-dynamic";

interface InvitePageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const invite = await getInviteByToken(token);

  if (!invite) {
    return (
      <main className={`${formPageClassName} max-w-sm justify-center`}>
        <h1 className={`text-2xl ${formHeadingClassName}`}>Invite not found</h1>
        <p className={formMutedClassName}>
          This invite link is invalid. If you already joined,{" "}
          <Link className={formLinkClassName} href="/login">
            sign in
          </Link>
          .
        </p>
      </main>
    );
  }

  if (invite.status === "used") {
    return (
      <main className={`${formPageClassName} max-w-sm justify-center`}>
        <h1 className={`text-2xl ${formHeadingClassName}`}>
          Invite already used
        </h1>
        <p className={formMutedClassName}>
          This invite has already been redeemed.{" "}
          <Link className={formLinkClassName} href="/login">
            Sign in
          </Link>{" "}
          to continue.
        </p>
      </main>
    );
  }

  if (invite.status === "expired") {
    return (
      <main className={`${formPageClassName} max-w-sm justify-center`}>
        <h1 className={`text-2xl ${formHeadingClassName}`}>Invite expired</h1>
        <p className={formMutedClassName}>
          Ask the commissioner for a new invite, or{" "}
          <Link className={formLinkClassName} href="/login">
            sign in
          </Link>{" "}
          if you already have an account.
        </p>
      </main>
    );
  }

  const existing = invite.email
    ? await findUserByLoginIdentifier(invite.email)
    : null;

  return (
    <main className={`${formPageClassName} max-w-sm justify-center`}>
      <JoinPanel
        email={invite.email}
        existingAccount={Boolean(existing)}
        existingName={existing?.name ?? null}
        nameHint={invite.nameHint}
        poolName={invite.poolName}
        token={token}
      />
    </main>
  );
}
