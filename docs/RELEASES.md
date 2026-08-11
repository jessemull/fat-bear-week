# Releases

> **AI agents — read this file when:** preparing a release, deploy, or promotion to production.

---

## Model

- Next.js on Vercel; Supabase for data
- Push to `main` → Preview (dev Supabase)
- Promote: merge `main` → `release` and push (`make deploy-web-prod`) → Production
- Domain: `www.fatbearweek.net` (apex redirects to www)

---

## Environments

| Env | Typical URL | Database |
| --- | ----------- | -------- |
| Local | `http://localhost:3000` | Dev Supabase |
| Preview | Vercel Preview URL for `main` | Dev Supabase |
| Production | `https://www.fatbearweek.net` | Prod Supabase |

See `docs/ENVIRONMENTS.md` and `docs/DEPLOYMENT.md`.

---

## Versioning

- `web/package.json` version is informational
- Imperative git history is the changelog signal

---

## Checklist

- [ ] `make lint && make test && make security && make build` green
- [ ] Env contracts documented (`web/.env.example`, `docs/SECURITY.md`)
- [ ] No secrets in the client bundle
- [ ] Schema migrations applied to the target Supabase project (`docs/SUPABASE_MIGRATIONS.md`)
- [ ] Preview verified before promoting to `release`

---

## Hotfix

Prefer a focused fix on `main`, verify Preview, then `make deploy-web-prod`. Coordinate with humans for prod-sensitive changes (auth, schema wipe).
