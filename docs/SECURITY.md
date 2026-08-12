# Security

> **AI agents — read this file when:** handling env vars, auth/sessions, invites, or dependencies.

---

## Secrets

- Never commit `.env`, `.env.local`, or service role keys.
- Required server vars: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`.
- Invite email (server-only): `RESEND_API_KEY`, `EMAIL_FROM`.
- Bot check (server-only secret): `TURNSTILE_SECRET_KEY`; public site key
  `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (Cloudflare Turnstile on join / sign-in).
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
- Join requires a valid invite token + display name + password (with confirm) +
  Turnstile token. Invite email is copied onto the user and shown read-only.
- Sessions via HTTP-only cookies (or equivalent); validate server-side on protected routes and mutations.
- Invite tokens must be unguessable; prefer single-use / limited-use personal invites.
- One unused invite per email per pool; `users.email` unique when set.
- Invite consumption is `invitations.used_at IS NOT NULL` (do not treat a null `used_by` as unused).
- CSRF: treat cookie-session mutations carefully (SameSite cookies; validate origin/referrer or tokens when implementing mutations).
- Turnstile: verify `turnstileToken` server-side via Cloudflare siteverify before join/sign-in.

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
