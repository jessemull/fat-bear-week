# Governance

> **AI agents — read this file when:** planning contributions, PRs, reviews, or process changes.

---

## Precedence

See `CONTEXT.md`. Conflicts resolve upward: CONTEXT → GOVERNANCE → ARCHITECTURE → domain docs → inline comments.

---

## Non-negotiables

- TypeScript `strict: true`; invite-only product model
- No hardcoded secrets; Supabase service role key stays server-only
- No LLM SDKs or new global state managers without product approval
- Cost-optimized Vercel + Supabase architecture
- Keep v1 scope small (see `docs/ROADMAP.md`)

---

## Autonomous (agents may do without waiting)

- Bugfixes that do not change auth/session/invite secret handling
- Tests and docs that follow existing patterns
- Lint/format fixes
- Internal refactors that preserve public APIs and API response shapes
- Copy/styling within established patterns

---

## Human review required

- New routes / information architecture
- Changes to governance docs (`CONTEXT.md`, `AGENTS.md`, `docs/`)
- New third-party deps (auth, analytics, payments, LLM)
- CI/CD or Vercel project setting changes
- Security-sensitive work (sessions, invites, env contracts, service keys)
- Removing tests or weakening coverage goals
- Schema migrations with destructive changes

---

## Product decision required

- Public registration or open pools
- Payments, ads, native apps
- Multiple brackets per person
- Scraping / automated official-result ingestion as the primary path
- AI/LLM features
- Expanding beyond the ROADMAP v1 cut line in material ways

---

## Governance-only PRs

- Title prefix `[governance]`
- Explain why / prior / impact
- At least one write-access reviewer (two if changing this file)
- Cascade updates to lower-precedence docs when needed

---

## Review

Severity tiers: MUST / SHOULD / NICE — see `docs/REVIEW.md`. MUST blocks merge.
