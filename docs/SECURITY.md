# Security

> **AI agents — read this file when:** handling env vars, auth/sessions, invites, or dependencies.

---

## Secrets

- Never commit `.env`, `.env.local`, or service role keys.
- Required server vars: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`.
- Public vars: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` only.
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
- Join requires a valid invite token + display name + password.
- Sessions via HTTP-only cookies (or equivalent); validate server-side on protected routes and mutations.
- Invite tokens must be unguessable; prefer single-use / limited-use personal invites.
- Invite consumption is `invitations.used_at IS NOT NULL` (do not treat a null `used_by` as unused).
- CSRF: treat cookie-session mutations carefully (SameSite cookies; validate origin/referrer or tokens when implementing mutations).

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
