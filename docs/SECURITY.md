# Security

> **AI agents — read this file when:** handling env vars, auth/sessions, invites, or dependencies.

---

## Secrets

- Never commit `.env`, `.env.local`, or service role keys.
- Required server vars: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`.
- Invite email (server-only): `RESEND_API_KEY`, `EMAIL_FROM`.
- Bot check (server-only secret): `TURNSTILE_SECRET_KEY`; public site key
  `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (Cloudflare Turnstile on join / sign-in /
  forgot-password / reset-password).
- Commissioner access: `users.is_commissioner` (not an env allowlist).
- Public vars: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY` only.
- Never put `RESEND_API_KEY`, `SUPABASE_SERVICE_KEY`, or `TURNSTILE_SECRET_KEY`
  in `NEXT_PUBLIC_*`.
- Vercel: configure Preview (dev) and Production (prod) separately — see `docs/ENVIRONMENTS.md`.
- Do not echo secrets in logs or CI output.

---

## Client surface

- Assume HTML/JS are public.
- Never put `SUPABASE_SERVICE_KEY` (or password hashes, invite secrets) in `NEXT_PUBLIC_*` or client bundles.
- Avoid logging tokens, passwords, or PII.

---

## Auth & invites (product intent)

- No public registration.
- Join requires a valid invite token + Turnstile token.
  - **New users:** display name + password (with confirm). Invite email is
    copied onto the user and shown read-only.
  - **Existing accounts:** when the invite email already matches a user, join
    another pool with that account’s password (multi-pool; display name is not
    changed).
- Sign in with **email or display name** + password + Turnstile (no public signup).
- Forgot password: email + Turnstile; always-success copy (do not reveal whether
  the address has an account). Reset tokens are unguessable, SHA-256 hashed at
  rest, ~1 hour TTL, and single-use. A successful email reset revokes **all**
  sessions, then creates a new one. Logged-in password change keeps the current
  session and revokes the others.
- Sessions via HTTP-only cookies (or equivalent); validate server-side on protected routes and mutations.
- Sign-out revokes **only the current session cookie** (not every device).
- Invite tokens must be unguessable; store SHA-256 hashes at rest (raw token only in email/URL).
- One unused invite per email per pool; `users.email` unique case-insensitively when set.
- Invite consumption is `invitations.used_at IS NOT NULL` (do not treat a null `used_by` as unused).
- Changing an unused invite’s email rotates the token so the prior link cannot join.
- CSRF: cookie-session mutations require matching Origin or Referer (SameSite=Lax cookies;
  fail closed when both headers are missing).
- Turnstile: verify `turnstileToken` server-side via Cloudflare siteverify before join/sign-in/forgot-password/reset-password.
- Rate limit join, sign-in, password-reset, and signed-in password change by IP
  (and sign-in identifier / reset email / user id) in addition to Turnstile.
  Limits are in-memory per Node process / Vercel isolate (not durable across
  instances) — a soft companion to Turnstile, not a shared global limiter.
- `NEXT_PUBLIC_SITE_URL` is required for minting invite and password-reset links (no silent production fallback).

---

## Dependencies

- Run `make security` / `npm audit` when adding deps.
- Do **not** run `npm audit fix --force`.
- Justify new auth/network/analytics SDKs in the PR.

---

## Database

- Prefer parameterized Supabase client calls; no string-concatenated SQL with user input.
- App tables enable **RLS** with no policies in `001` — anon/authenticated cannot read or write until explicit policies ship.
- Service role bypasses RLS — never expose it client-side; prefer least privilege when adding policies.
