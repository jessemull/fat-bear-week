# Deployment

This document covers deployment of the web application on Vercel. Environment
configuration and variable reference are in [ENVIRONMENTS.md](ENVIRONMENTS.md).

## Scope

| Target | Mechanism | Reference |
|--------|-----------|-----------|
| Web (Preview) | Push to `main`; Vercel deploys from Git | [ENVIRONMENTS.md](ENVIRONMENTS.md#web--preview-development) |
| Web (Production) | Merge `main` into `release`, push; Vercel deploys from Git | [ENVIRONMENTS.md](ENVIRONMENTS.md#web--production) |

There is no self-hosted scraper or worker for this project. The Next.js app on
Vercel is the only runtime.

---

## Vercel project settings

1. Connect the GitHub repository `jessemull/fat-bear-week`.
2. Set **Root Directory** to `web`.
3. Set **Production Branch** to `release`.
4. Create and push branch `release` if it does not exist (initially can match
   `main`).
5. Configure environment variables separately for **Preview** and
   **Production** (see [ENVIRONMENTS.md](ENVIRONMENTS.md)).

`web/vercel.json` sets `"framework": "nextjs"`.

---

## Deployment procedures

### Web — Preview (development)

1. Push to `main`: `git push origin main`.
2. CI runs; Vercel builds and deploys to Preview.
3. The deployment uses variables configured for Preview (dev Supabase).

### Web — Production

1. Verify behavior on a Preview deployment.
2. Merge `main` into `release` and push:
   ```bash
   git checkout release && git pull origin release && git merge main --no-edit && git push origin release && git checkout main
   ```
   Alternatively: `make deploy-web-prod` (requires a clean working tree).
3. Vercel builds and deploys from `release` using Production env vars.
4. Point `fatbearweek.net` at the Vercel Production deployment when ready.

---

## Custom domain

1. In Vercel → Project → Settings → Domains, add `fatbearweek.net` (and
   `www` if desired).
2. Update DNS at the registrar as Vercel instructs.
3. Confirm HTTPS certificates are issued.

---

## Supabase and migrations

Use separate Supabase projects for Preview/local and Production. Apply schema
with `database/bootstrap.sql` (new project) or incremental files in
`database/migrations/`. See [ENVIRONMENTS.md](ENVIRONMENTS.md).

After adding a migration:

```bash
make db-bootstrap
```

Commit the updated `database/bootstrap.sql` with the migration.

---

## Security requirements

- Store secrets in Vercel Environment Variables (and local `.env.local`). Do
  not commit secrets.
- Never expose `SUPABASE_SERVICE_KEY` to the client or `NEXT_PUBLIC_*` vars.
- Restrict admin capabilities in application code (invite-only pool; separate
  admin auth when implemented).
