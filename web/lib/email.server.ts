import "server-only";
import { Resend } from "resend";

import { getSiteUrl } from "@/lib/site-url";

export interface SendInviteEmailInput {
  expiresAt: string;
  inviteUrl: string;
  nameHint?: null | string;
  poolName: string;
  to: string;
}

export interface SendInviteEmailResult {
  emailSent: boolean;
  errorMessage?: string;
}

function getResendClient(): null | Resend {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return null;
  }

  return new Resend(apiKey);
}

function buildInviteEmailBody(input: SendInviteEmailInput): {
  html: string;
  subject: string;
  text: string;
} {
  const greeting = input.nameHint
    ? `Hi ${input.nameHint},`
    : "Hi,";
  const expiresLabel = new Date(input.expiresAt).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const subject = `You're invited to ${input.poolName} — Fat Bear Week Fantasy Bracket`;

  const text = [
    greeting,
    "",
    `You've been invited to the private pool "${input.poolName}".`,
    "",
    `Join here: ${input.inviteUrl}`,
    "",
    `This invite expires on ${expiresLabel}.`,
    "",
    "This is a private prediction pool around official Fat Bear Week — not official voting.",
  ].join("\n");

  const html = `
    <p>${greeting}</p>
    <p>You've been invited to the private pool <strong>${escapeHtml(input.poolName)}</strong>.</p>
    <p><a href="${escapeHtml(input.inviteUrl)}">Join your pool</a></p>
    <p>This invite expires on ${escapeHtml(expiresLabel)}.</p>
    <p style="color:#666;font-size:14px;">This is a private prediction pool around official Fat Bear Week — not official voting.</p>
  `.trim();

  return { html, subject, text };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/**
 * Send an invite email via Resend. Returns emailSent:false on config/API failure
 * so the invite row can remain and the commissioner can copy the link.
 */
export async function sendInviteEmail(
  input: SendInviteEmailInput,
): Promise<SendInviteEmailResult> {
  const from = process.env.EMAIL_FROM;
  const resend = getResendClient();

  if (!from || !resend) {
    return {
      emailSent: false,
      errorMessage: "Email is not configured (RESEND_API_KEY / EMAIL_FROM).",
    };
  }

  const { html, subject, text } = buildInviteEmailBody(input);

  try {
    const { error } = await resend.emails.send({
      from,
      html,
      subject,
      text,
      to: input.to,
    });

    if (error) {
      return {
        emailSent: false,
        errorMessage: error.message,
      };
    }

    return { emailSent: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to send invite email.";

    return {
      emailSent: false,
      errorMessage: message,
    };
  }
}

/**
 * Build an absolute invite URL for email / copy fallback.
 */
export function buildInviteUrl(token: string): string {
  const base = getSiteUrl().replace(/\/$/, "");

  return `${base}/invite/${token}`;
}
