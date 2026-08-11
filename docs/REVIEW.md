# Review

> **AI agents — read this file when:** reviewing PRs or running repo reviews.

---

## Severity tiers

### MUST (blocks merge)

- Secrets, XSS, CSRF gaps on cookie-session mutations, or token/password leakage
- Supabase service role key exposed client-side
- Crashes on critical paths (join, bracket submit, admin publish result — as implemented)
- Coverage greenwashing (deleted tests) or unjustified `any` sprawl
- Architecture violations (wrong layer, public signup without approval)
- Breaking invite-only access model without product decision

### SHOULD

- Missing tests for behavior changes
- Accessibility gaps (names, keyboard, heading hierarchy)
- Performance footguns on bracket/leaderboard UIs
- Missing Zod validation on new API inputs
- Poor error / empty / loading states

### NICE

- Naming polish, optional refactors, docs clarity
- Alphabetization / comment-spacing nits already mostly covered by ESLint

### OUT OF SCOPE

- Unrelated refactors
- Dependency churn not in the PR
- Features deferred in `docs/ROADMAP.md` (what-if simulator, chat, payments, etc.)

### VERIFY

- Runtime claims (Vercel env wiring, Supabase migrations applied) — do not assert without evidence

---

## Pre-merge automation

From repo root:

- [ ] `make lint`
- [ ] `make format` (or tree already clean)
- [ ] `make test`
- [ ] `make security`
- [ ] `make build`
- [ ] CI green

---

## Fat Bear checklist (web)

### TypeScript / Next.js

- [ ] Strict mode; Zod on external input
- [ ] Server vs Client components correct; no secret leakage via props
- [ ] API returns `{ data }` / `{ error }`

### Auth / invites

- [ ] Invite tokens validated server-side
- [ ] Sessions validated on protected mutations
- [ ] Admin routes protected
- [ ] No accidental public signup

### Database

- [ ] Migrations versioned; `make db-bootstrap` if schema changed
- [ ] UUID / `TIMESTAMPTZ` / `updated_at` conventions followed

### Consistency (from AGENTS.md)

- [ ] Alphabetization (imports, keys, JSX props)
- [ ] Comment spacing per `docs/COMMENTS.md`
- [ ] `eslint-plugin-perfectionist` clean

### Hygiene

- [ ] Focused PR; What / Why / Testing
- [ ] `web/.env.example` updated if env vars changed
- [ ] ROADMAP updated when shipping or deferring planned work

Agent skills (`pr-review`, `repo-review`, `security-review`) define fixed output shapes — follow those skills.
