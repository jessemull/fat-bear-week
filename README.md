# Fat Bear Week Fantasy Bracket

Private invite-only fantasy brackets for Fat Bear Week. Friends predict the
official tournament and compete on a shared leaderboard — without replacing
voting on FatBearWeek.org.

This monorepo contains the **web app** (Next.js), **database migrations**, and
**docs**. It targets Vercel + Supabase free tiers (~$0/month for a 50–100 person
pool).

## Table of Contents

- [Project goal](#project-goal)
- [Features](#features)
- [Technologies](#technologies-used)
- [Architecture](#architecture)
- [Pull requests](#pull-requests)
- [Repository structure](#repository-structure)
- [Makefile](#makefile)
- [Environment variables](#environment-variables)
- [Setup & quick start](#setup--quick-start)
- [Database](#database)
- [Testing & linting](#testing--linting)
- [Security](#security)
- [CI/CD & deployment](#cicd--deployment)
- [Cost](#cost)
- [Design decisions](#design-decisions)
- [Related documentation](#related-documentation)

## Project goal

Build a polished private Fat Bear Week prediction pool for ~50–100 friends:

- Commissioner creates a pool and issues curated invite links
- Participants join with a name + password (no public signup)
- Fill out one bracket per person before the lock deadline
- Admin enters official winners; scoring and leaderboards update automatically

This site is **not** the official Fat Bear Week voting system. Link out to
FatBearWeek.org / Explore.org for real votes and live cams.

See [docs/ROADMAP.md](docs/ROADMAP.md) for the full feature backlog.

## Features

Scaffold **v0** ships infrastructure only. Planned product features:

| Area | Description |
| :--- | :---------- |
| Invites | Individual invite tokens; join with name + password |
| Bracket | Interactive tournament bracket with bear cards |
| Scoring | Round-weighted points; optional vote totals as display metadata |
| Leaderboard | Live ranks, correct/incorrect picks, still-alive indicators |
| Admin | Import bears/bracket, lock picks, publish matchup winners |
| Cams / links | Embed Explore.org cams; deep-link to official voting |

## Technologies used

Conventions live in [`.cursorrules`](.cursorrules): alphabetized imports and
object keys; `eslint-plugin-perfectionist`; comment spacing; no secrets in code.

**Web:** Next.js 16+ (App Router), React 19, TypeScript (strict), Tailwind CSS,
Zod, Vitest + Testing Library, Lucide icons.

**Database & deploy:** Supabase (PostgreSQL), Vercel (Hobby).

## Architecture

```
┌─────────────────┐     ┌─────────────────┐
│     Vercel      │────▶│    Supabase     │
│   (Next.js)     │     │  (PostgreSQL)   │
│  Web + API      │◀────│  pools, bears,  │
│  Admin tools    │     │  matchups, …    │
└─────────────────┘     └─────────────────┘
```

- **Web app** — Pages for landing, invite join, bracket, leaderboard, bear
  profiles, and admin. Mutations go through route handlers / server actions.
- **Supabase** — Source of truth for pools, invitations, tournament structure,
  picks, and results. Service key is server-only.
- **Admin** — Manual result entry (~a handful of times per tournament). Vote
  totals are optional; `winner_id` drives scoring.

**Branch strategy:** `main` → Vercel Preview; `release` → Vercel Production
(`fatbearweek.net`).

## Pull requests

Use the pre-merge checklist in
[docs/CODE_REVIEW_CHECKLIST.md](docs/CODE_REVIEW_CHECKLIST.md).

## Repository structure

```
fat-bear-week/
├── .cursorrules              # Conventions (alphabetization, comments, style)
├── .github/workflows/ci.yml  # Lint, test, security, build
├── database/
│   ├── bootstrap.sql         # Generated: make db-bootstrap
│   └── migrations/           # Numbered SQL migrations
├── docs/
│   ├── CODE_REVIEW_CHECKLIST.md
│   ├── DEPLOYMENT.md
│   ├── ENVIRONMENTS.md
│   └── ROADMAP.md
├── web/                      # Next.js app (Vercel root directory)
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── tests/
│   └── package.json
├── Makefile
└── README.md
```

## Makefile

Run **`make help`** for the short list.

| Target | Description |
| :----- | :---------- |
| `install` | `npm install --legacy-peer-deps` in `web/` |
| `dev` | Start Next.js dev server |
| `build` | Production build |
| `lint` / `lint-fix` / `format` | ESLint (fix = autofix) |
| `test` / `test-coverage` | Vitest |
| `security` | `npm audit` |
| `db-bootstrap` | Regenerate `database/bootstrap.sql` |
| `db-migrate-prod` | Print Supabase migration instructions |
| `deploy-web-prod` | Merge `main` → `release` and push |
| `clean` | Remove `node_modules`, `.next`, coverage |

## Environment variables

Copy [`web/.env.example`](web/.env.example) to `web/.env.local`:

| Variable | Purpose |
| :------- | :------ |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (client) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (client) |
| `SUPABASE_URL` | Supabase project URL (server) |
| `SUPABASE_SERVICE_KEY` | Service role key (server only; never expose) |

Dev vs prod matrix: [docs/ENVIRONMENTS.md](docs/ENVIRONMENTS.md).

## Setup & quick start

1. **Install**
   ```bash
   make install
   ```

2. **Env** — Create `web/.env.local` from `web/.env.example` and fill in a
   **dev** Supabase project.

3. **Database** — For a new Supabase project, run `database/bootstrap.sql`
   once in the SQL Editor (`make db-bootstrap` regenerates it). See
   [docs/ENVIRONMENTS.md](docs/ENVIRONMENTS.md).

4. **Dev server**
   ```bash
   make dev
   ```
   Open http://localhost:3000.

5. **Quality bar**
   ```bash
   make lint && make test && make security && make build
   ```

## Database

Numbered migrations live in `database/migrations/`. Bootstrap for new projects:

```bash
make db-bootstrap
```

Then paste `database/bootstrap.sql` into the Supabase SQL Editor.

**Initial tables:** `users`, `pools`, `tournaments`, `bears`, `matchups`,
`invitations`, `entries`, `picks`.

## Testing & linting

- **Lint** — `make lint` (ESLint + perfectionist). `make format` applies
  `--fix`.
- **Test** — `make test` runs Vitest. `make test-coverage` for coverage.
- **CI** — On PR/push to `main` or `release`: format, lint, test+coverage,
  security, build.

## Security

- Secrets only via environment variables / Vercel env — never committed.
- `make security` runs `npm audit`.
- Invite-only access; no public registration in the product design.
- Supabase service role key is server-only.

## CI/CD & deployment

| Workflow | Trigger | What it does |
| :------- | :------ | :----------- |
| **CI** | PR and push to `main` / `release` | `make format`, `make lint-ci`, `make test-coverage`, `make security`, `make build` |

**Preview:** push to `main` → Vercel Preview.  
**Production:** `make deploy-web-prod` (merge `main` into `release` and push).

Details: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md),
[docs/ENVIRONMENTS.md](docs/ENVIRONMENTS.md).

## Cost

Target **~$0/month** on free tiers for a small private pool:

| Service | Cost |
| :------ | :--- |
| Supabase | Free tier |
| Vercel | Hobby (free) |
| Email / LLM / Redis | Not required for v0 |
| **Total** | **~$0/month** (within free-tier limits) |

## Design decisions

| Decision | Rationale |
| :------- | :-------- |
| **Invite-only** | Prevent random signups on a public domain |
| **DB as source of truth** | Pool scoring does not depend on live scraping |
| **Manual result entry** | ~6–11 matchup updates per year; tiny admin load |
| **`winner_id` scores brackets** | Vote totals are optional fun metadata |
| **Generic rounds/matchups** | Format can change year to year |
| **`main` / `release` branches** | Same Preview/Production discipline as other projects |

## Related documentation

| Doc | Purpose |
| :-- | :------ |
| **[.cursorrules](.cursorrules)** | Project conventions |
| **[docs/ROADMAP.md](docs/ROADMAP.md)** | Feature backlog and phases |
| **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** | Vercel deploy and branch promotion |
| **[docs/ENVIRONMENTS.md](docs/ENVIRONMENTS.md)** | Dev vs prod configuration |
| **[docs/CODE_REVIEW_CHECKLIST.md](docs/CODE_REVIEW_CHECKLIST.md)** | Pre-merge review checklist |
| **[database/migrations/](database/migrations/)** | Schema source of truth |
