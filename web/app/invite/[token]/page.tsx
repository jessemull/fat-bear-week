import Link from "next/link";

import { JoinForm } from "@/components/auth/JoinForm";
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
      <main className={`${formPageClassName} max-w-lg justify-center`}>
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
      <main className={`${formPageClassName} max-w-lg justify-center`}>
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
      <main className={`${formPageClassName} max-w-lg justify-center`}>
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

  return (
    <main className={`${formPageClassName} max-w-lg justify-center`}>
      <div className="flex flex-col gap-2 text-center">
        <h1 className={`text-3xl ${formHeadingClassName}`}>
          Join {invite.poolName}
        </h1>
        <p className={formMutedClassName}>
          Invite-only pool. Confirm your email, choose a display name, and set a
          password to create your entry.
        </p>
      </div>
      <JoinForm email={invite.email} nameHint={invite.nameHint} token={token} />
    </main>
  );
}
