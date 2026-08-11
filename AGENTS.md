# AGENTS.md — Fat Bear Week Fantasy Bracket

> Complete development rules and constraints for AI agents and human contributors.
> This file is the authoritative reference for coding standards. Precedence: see `CONTEXT.md`.

---

## Repository Overview

| Field                 | Value                                                                              |
| --------------------- | ---------------------------------------------------------------------------------- |
| **Project**           | Fat Bear Week Fantasy Bracket (`fatbearweek.net`)                                  |
| **Architecture**      | Next.js App Router + Supabase Postgres; invite-only private pool                   |
| **Platform**          | Web (Vercel)                                                                       |
| **Core Technologies** | Next.js 16, React 19, TypeScript strict, Tailwind 4, Zod, Vitest, Lucide           |
| **CI/CD**             | GitHub Actions (lint/test/security/build); Vercel deploys via Git                  |

### Layout

```
fat-bear-week/
├── web/                     # Next.js app (Vercel root directory)
│   ├── app/                 # App Router pages + API routes
│   ├── components/
│   ├── lib/                 # *.server.ts / *.client.ts helpers
│   └── tests/
├── database/
│   ├── migrations/          # Numbered SQL migrations
│   └── bootstrap.sql        # Generated via make db-bootstrap
├── docs/                    # Governance + product docs
├── .cursor/                 # Rules, skills
├── .github/workflows/
├── CONTEXT.md
├── AGENTS.md                # This file
└── Makefile
```

### Path aliases

| Alias  | Path (under `web/`) |
| ------ | ------------------- |
| `@/*`  | `./*`               |

---

## Development Commands

Prefer **`make`** targets from the repo root (see `make help`).

### Setup

| Command         | Description                |
| --------------- | -------------------------- |
| `make install`  | `npm install` in `web/`    |

### Quality

| Command              | Description                              |
| -------------------- | ---------------------------------------- |
| `make format`        | ESLint `--fix`                          |
| `make lint`          | ESLint                                   |
| `make typecheck`     | `tsc --noEmit`                           |
| `make knip`          | Unused files / dependencies              |
| `make test`          | Vitest with ≥80% coverage thresholds     |
| `make e2e`           | Cypress smoke (boots Next.js)            |
| `make lighthouse`    | Build + LHCI against `next start`        |
| `make security`      | `npm audit --omit=dev`                   |
| `make build`         | Next.js production build                 |
| `make preflight`     | format + lint + typecheck + knip + test + security + build |

### Local / deploy / database

| Command               | Description                                      |
| --------------------- | ------------------------------------------------ |
| `make dev`            | Next.js dev server                               |
| `make deploy-web-prod`| Merge `main` → `release` and push                |
| `make db-bootstrap`   | Regenerate `database/bootstrap.sql`              |

---

## Language & Framework Rules

### TypeScript

- Keep `strict: true`.
- Prefer `interface` over `type` for object shapes.
- Use `camelCase` for functions/variables; `PascalCase` for components/types.
- Named exports preferred (except Next.js `page.tsx` / `layout.tsx` / `route.ts`).

### Alphabetization

Always alphabetize when practical:

- Imports (external → `@/` internal → relative); named import members
- Object keys; interface/type properties
- JSX props (`key` first, `on*` callbacks last)
- Union types (`null | number | string`)
- `className` tokens when practical

**Enforced by:** `eslint-plugin-perfectionist` in `web/eslint.config.mjs`.

### React / Next.js

- Prefer Server Components by default; mark Client Components with `'use client'` only when needed.
- Pages under `web/app/` stay thin — compose UI in `web/components/`.
- Server-only utilities: `lib/*.server.ts`. Client utilities: `lib/*.client.ts`.
- API routes: validate with Zod; return `{ data }` or `{ error }`; check session/invite auth before mutations.

### Comments

Follow `docs/COMMENTS.md`. Prefer self-documenting names; comments explain **why**.

---

## Architecture Rules

### Layers

- **Routes** (`web/app`) → **components** → **lib** helpers.
- Supabase anon client on the browser; **service role only on the server**.
- Database schema lives in `database/migrations/`; regenerate bootstrap after changes.

### Domain

- Official Fat Bear Week is the source of truth for winners.
- Pool scoring uses `winner_id`; `official_votes_*` are optional metadata.
- Generic tournament model: tournament → rounds → matchups → bears.
- Individual invite tokens; one entry (bracket) per user per pool in v1.

### State

- Local `useState` is fine for UI-only state.
- No Redux/Zustand/MobX without governance approval.
- Do not add public signup, payments, or multi-bracket flows without a product decision.

---

## Testing Rules

- Unit/component: Vitest + Testing Library + jest-axe; setup in `web/tests/setup.ts`.
- Coverage **≥80%** enforced on `lib/`, `components/`, and `app/page.tsx`.
- E2E: Cypress (`make e2e`).
- Lighthouse CI: `make lighthouse` (production `next start`; see `docs/PERFORMANCE.md`).
- Prefer behavior and edge cases over implementation details.
- Do not remove tests solely to raise coverage percentage.

See `docs/TESTING.md`.

---

## Security Rules

- Secrets only in env / Vercel (never commit `.env.local`).
- Never put `SUPABASE_SERVICE_KEY` in `NEXT_PUBLIC_*` or client bundles.
- Invite tokens must be unguessable; password hashes never logged or returned in APIs.
- Protect admin and mutation routes server-side.

See `docs/SECURITY.md`.

---

## Database Conventions

- UUID primary keys; `TIMESTAMPTZ`; `created_at` / `updated_at` on mutable tables
- Triggers maintain `updated_at`
- Index columns used in WHERE clauses
- Apply via Supabase SQL Editor; see `docs/SUPABASE_MIGRATIONS.md`

---

## Git & PR Rules

- Branches: `feature/description`, `fix/description`
- Imperative commit messages; focused PRs
- `main` → Vercel Preview; `release` → Vercel Production
- Review severity tiers: `docs/REVIEW.md` (MUST / SHOULD / NICE)
- Governance-only PRs: title prefix `[governance]`

---

## Forbidden Patterns

- Public registration / open pool directory without product approval
- Exposing Supabase service role keys client-side
- Hardcoding tournament field sizes (64 teams, etc.)
- Payments, ads, native apps, multiple brackets per person (v1)
- Replacing official Fat Bear Week voting or rehosting Explore.org video
- Lowering quality gates or deleting tests to greenwash coverage
- Adding LLM SDKs or new global state libraries without product approval

---

## When Writing Code

1. Check if similar code exists before creating new files
2. Follow existing patterns in the codebase
3. Add types (TypeScript)
4. Handle errors gracefully with informative messages
5. Don't add dependencies unless necessary
6. Keep functions small and focused
7. Write code that's easy to test
8. **Alphabetize** imports, object keys, props, and list items
9. **Space comments** appropriately (see `docs/COMMENTS.md`)

---

## When stuck

1. Re-read `CONTEXT.md` precedence.
2. Check domain docs (`SECURITY.md`, `SUPABASE_MIGRATIONS.md`, `ROADMAP.md`, etc.).
3. Run `make preflight` and fix failures before expanding scope.
4. Flag product/architecture decisions for human review per `docs/GOVERNANCE.md`.
