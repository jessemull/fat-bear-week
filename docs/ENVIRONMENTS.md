# Environments

This document defines the development and production environments, their
configuration, and deployment procedures.

## Overview

The system has two environments. Isolation is enforced by separate Supabase
projects, separate Vercel deployment targets, and environment-specific
configuration.

| Component | Development | Production |
|-----------|-------------|------------|
| Web | Vercel Preview (branch `main`) or local | Vercel Production (branch `release`) |
| Database | Supabase project (dev) | Supabase project (prod) |
| Auth | Invite-only (app-managed); no public signup | Same |

**Branch convention:** `main` triggers Preview deployments. `release` triggers
Production deployments. Configure Vercel Production Branch to `release`.

**Vercel behavior:** Environment variables are not shared between Preview and
Production. Configure both targets explicitly.

---

## Configuration reference

### Vercel (web)

**Location:** Project → Settings → Environment Variables. Assign each variable
to Preview, Production, or both.

| Variable | Preview | Production |
|----------|---------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Dev project URL | Prod project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Dev anon key | Prod anon key |
| `SUPABASE_URL` | Dev project URL | Prod project URL |
| `SUPABASE_SERVICE_KEY` | Dev service key | Prod service key |

### Local development

**Location:** `web/.env.local` (copy from `web/.env.example`).

Use the **dev** Supabase project credentials only.

---

## Auth configuration (product intent)

v0 scaffold does not yet implement auth. Target design:

1. No public account registration.
2. Participants join only via a valid invitation token
   (`/invite/<token>` or similar).
3. Join collects display name + password; session uses an HTTP-only cookie.
4. Admin access is restricted (commissioner account / separate admin gate —
   see [ROADMAP.md](ROADMAP.md)).

---

## Deployment procedures

### Web — Preview (development)

1. Push to `main`: `git push origin main`.
2. CI runs; Vercel builds and deploys to Preview.
3. The deployment uses variables configured for Preview.

### Web — Production

1. Verify behavior on a Preview deployment.
2. Merge `main` into `release` and push, or run `make deploy-web-prod`.
3. Vercel builds and deploys from `release` with Production variables.

### Database — New project

1. Create a Supabase project (dev and/or prod).
2. Run `make db-bootstrap` if `database/bootstrap.sql` is missing or stale.
3. Paste `database/bootstrap.sql` into the Supabase SQL Editor and execute
   **once**.
4. Optionally reload PostgREST schema cache:
   ```sql
   NOTIFY pgrst, 'reload schema';
   ```

**Do not** run bootstrap on a project that already has these tables.

### Database — Existing project

Run only **new** files from `database/migrations/` in numeric order against
both dev and prod.

After adding a migration:

1. Apply it to existing projects.
2. Run `make db-bootstrap` and commit the updated bootstrap file.

---

## Verification

- **Preview vs Production:** Create a test row (e.g. pool) via Preview/dev DB.
  Confirm it does not appear against Production (distinct Supabase projects).
- **Env wiring:** Confirm Preview URL talks to the dev project and Production
  to the prod project (check `NEXT_PUBLIC_SUPABASE_URL` in each deployment).

---

## Setup checklist

Execute in order.

1. **Supabase:** Create two projects (dev, prod). For each new project, run
   `database/bootstrap.sql` once in the SQL Editor. Record URLs and anon /
   service keys.
2. **Vercel:** Connect the repository. Set Root Directory to `web`. Set
   Production Branch to `release`. Create and push `release` if needed.
3. **Vercel — Preview:** Configure Preview env vars with **dev** Supabase
   (all four variables).
4. **Vercel — Production:** Configure Production env vars with **prod**
   Supabase (all four variables).
5. **Local development:** Create `web/.env.local` from `.env.example` with
   **dev** credentials. Run `make install` and `make dev`.
6. **Domain (when ready):** Attach `fatbearweek.net` to the Production
   deployment (see [DEPLOYMENT.md](DEPLOYMENT.md)).

---

## Related documentation

- [DEPLOYMENT.md](DEPLOYMENT.md) — Vercel deploy and domain.
- [SUPABASE_MIGRATIONS.md](SUPABASE_MIGRATIONS.md) — Bootstrap and incremental migrations.
- [ROADMAP.md](ROADMAP.md) — Feature backlog including auth and admin.
