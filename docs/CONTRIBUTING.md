# Contributing

> **AI agents and humans — start here for day-to-day contribution workflow.**

---

## Setup

1. `make install` (Node 24+ recommended; CI uses 24)
2. Copy `web/.env.example` → `web/.env.local` with **dev** Supabase credentials
3. Apply schema to the dev project if needed (`docs/SUPABASE_MIGRATIONS.md`)
4. `make dev` → http://localhost:3000

---

## Git

- Branch from `main` (`feature/…`, `fix/…`)
- Imperative commit messages
- Keep PRs focused

---

## Pull requests

- What / Why / Testing
- Green `make lint && make test && make security && make build`
- Follow `docs/REVIEW.md`
- `[governance]` prefix for governance-only PRs

---

## Style

- ESLint + perfectionist (alphabetization)
- Comment policy: `docs/COMMENTS.md`
- Behavior tests for user-visible / business-logic changes
- Prefer Server Components; keep pages thin

---

## Agents

Start with `CONTEXT.md` → `AGENTS.md` → mandatory `docs/`.
