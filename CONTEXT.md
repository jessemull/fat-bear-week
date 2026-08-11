# CONTEXT.md — Fat Bear Week Fantasy Bracket

> **This is the PRIMARY entry point for ALL AI agents working in this repository.**
> Read this file first. Follow the mandatory reading order below before making any changes.

---

## Mandatory Reading Order

Every agent MUST read the following documents **in order** before making any change:

1. **`CONTEXT.md`** (this file) — loading order, source-of-truth precedence, non-negotiable constraints, quality gates
2. **`AGENTS.md`** — complete development rules, architecture constraints, coding standards, and forbidden patterns
3. **`docs/GOVERNANCE.md`** — contribution workflow, PR process, review policy, release process
4. **`docs/ARCHITECTURE.md`** — system design, folder structure, data flow
5. **`docs/TESTING.md`** — testing strategy, coverage requirements, a11y testing
6. **`docs/COMMENTS.md`** — comment policy and documentation standards
7. **`docs/SECURITY.md`** — security policy, secret management
8. **`docs/DEPENDENCIES.md`** — dependency management
9. **`docs/RELEASES.md`** — release and deploy process
10. **`docs/CI_CD.md`** — CI workflows and quality gates

Read items 5–10 on every task. Do not skip them because the work “seems unrelated”; agents cannot know upfront which rules will apply.

Domain docs to load when the task touches that area: `docs/ENVIRONMENTS.md`, `docs/DEPLOYMENT.md`, `docs/SUPABASE_MIGRATIONS.md`, `docs/ERROR_HANDLING.md`, `docs/PERFORMANCE.md`, `docs/ACCESSIBILITY.md`, `docs/CONTRIBUTING.md`, `docs/ROADMAP.md`.

For PR or repo reviews, also read **`docs/REVIEW.md`**.

---

## Source-of-Truth Precedence

When instructions conflict, the **higher-ranked source wins**:

| Priority    | Source                                      | Scope                                         |
| ----------- | ------------------------------------------- | --------------------------------------------- |
| 1 (highest) | `CONTEXT.md`                                | Repository-wide constraints and quality gates |
| 2           | `docs/GOVERNANCE.md`                        | Contribution workflow and review policy       |
| 3           | `docs/ARCHITECTURE.md`                      | System design and module boundaries           |
| 4           | Feature/domain docs (`SECURITY.md`, etc.)   | Domain-specific rules                         |
| 5 (lowest)  | Inline code comments                        | Local implementation notes                    |

**Lower-precedence instructions MUST NOT contradict higher-precedence instructions.** If a conflict is detected, flag it for human review and follow the higher-precedence source.

---

## Non-Negotiable Constraints

These constraints apply to **every change**. No exceptions without explicit human approval.

### Platform & build

- **Next.js App Router on Vercel** — server components, route handlers, and server actions are allowed; this is **not** a static-export / S3 site.
- **Supabase PostgreSQL** is the source of truth for pools, invites, tournaments, bears, matchups, entries, and picks.
- **Cost-optimized** — stay on Vercel + Supabase free tiers; do not add paid infra without a product decision.

### Type safety & quality

- **TypeScript `strict: true`** — do not weaken compiler options.
- **No blanket `any`** — prefer typed APIs and narrow, justified assertions.
- **Vitest** for unit/component tests; coverage **goal ≥80%** on `lib/` and tested modules (enforce hard thresholds as Phase 1 logic lands — do not greenwash by deleting tests).
- Prefer imperative commit messages (`Add feature`, not `Added feature`); focused PRs.

### Secrets & boundaries

- **No hardcoded secrets** — env vars / Vercel env only (`SUPABASE_SERVICE_KEY` is server-only).
- **Never expose the Supabase service role key** to the client or `NEXT_PUBLIC_*`.
- **Invite-only access** — no public registration; individual invite tokens preferred.

### Product & domain

- This app is a **private prediction league**, not official Fat Bear Week voting.
- Prefer simple solutions; ~50–100 friends — do not over-engineer.
- Scoring derives from matchup `winner_id`; vote totals are optional display metadata.
- Tournament format must stay generic (rounds/matchups) — do not hardcode NCAA field sizes.
- One bracket per person per pool (v1). See `docs/ROADMAP.md` for scope guardrails.

---

## Quality Gates

Before considering work complete, agents MUST ensure:

| Gate                  | Command                         |
| --------------------- | ------------------------------- |
| Format / lint fix     | `make format`                   |
| Lint                  | `make lint`                     |
| Typecheck             | `make typecheck`                |
| Unused code (knip)    | `make knip`                     |
| Unit tests + coverage | `make test` (≥80% thresholds)   |
| Security              | `make security`                 |
| Production build      | `make build`                    |
| Full preflight        | `make preflight`                |
| E2E smoke             | `make e2e` (UI / journey work)  |
| Lighthouse CI         | `make lighthouse` (UI / perf)   |

Husky runs `make preflight` on **every git push**. CI also runs e2e and lighthouse. See `docs/CI_CD.md`.

---

## Repository Identity

| Field       | Value                                                                 |
| ----------- | --------------------------------------------------------------------- |
| **Project** | Fat Bear Week Fantasy Bracket (`fatbearweek.net`)                     |
| **Stack**   | Next.js 16 App Router, React 19, TypeScript strict, Tailwind 4, Zod   |
| **Hosting** | Vercel (`main` → Preview, `release` → Production)                     |
| **Database**| Supabase PostgreSQL (dev + prod projects)                             |
| **Auth**    | Invite-only name + password + HTTP-only session (product intent)      |
| **Layout**  | Monorepo: `web/` (Next.js), `database/` (SQL), `docs/` (governance) |

---

## Cursor / agent tooling

- Rules: `.cursor/rules/`
- Skills: `.cursor/skills/`
- Human ops detail belongs in `README.md`; agent rules live in this governance chain.
