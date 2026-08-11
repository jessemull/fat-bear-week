# Pull Request Review Checklist

## Fat Bear Week Fantasy Bracket

This checklist applies to:

- TypeScript (strict) + Next.js 16+ (React 19)
- SQL (PostgreSQL / Supabase)
- CI/CD (GitHub Actions for CI only, Vercel for web deploy)
- Security tooling (ESLint, npm audit)

---

# 0. PRE-MERGE AUTOMATION (REQUIRED)

All of the following must pass before merge. Run from repo root.

- [ ] `make lint` — ESLint (web)
- [ ] `make format` — ESLint `--fix` applied (or equivalent already clean)
- [ ] `make test` — Vitest (web)
- [ ] `make security` — npm audit (web)
- [ ] `make build` — Next.js production build succeeds
- [ ] CI green (if applicable)

---

# 1. PR CONTEXT & SCOPE

- [ ] PR title clearly describes change
- [ ] Description explains WHAT, WHY, and IMPACT
- [ ] Linked issue/ticket (or roadmap item)
- [ ] Scope is focused and not a massive mixed change
- [ ] Commits are logically structured and meaningful
- [ ] ROADMAP / docs updated if applicable

---

# 2. ARCHITECTURE & DESIGN

- [ ] Respects separation of concerns (UI, API, DB, scoring)
- [ ] No unnecessary tight coupling introduced
- [ ] Configurable values are not hardcoded
- [ ] Aligns with low-cost, invite-only product goals
- [ ] Tournament logic stays generic (rounds/matchups, not hardcoded field size)

---

# 3. TYPESCRIPT / NEXT.JS

## Type Safety

- [ ] Strict mode enforced
- [ ] No unnecessary `any`
- [ ] Zod validates external inputs
- [ ] Shared types handled properly

## React & UI

- [ ] Components small and reusable
- [ ] Correct Server vs Client usage
- [ ] No hydration mismatches
- [ ] Proper loading/error states
- [ ] Accessibility considered
- [ ] Tailwind usage clean
- [ ] Mobile-first where it matters (bracket, join, leaderboard)

## State & Data

- [ ] No over-fetching
- [ ] Pagination for large lists when needed
- [ ] Clear cache / revalidation strategy for leaderboard and brackets

## Auth

- [ ] Invite tokens validated server-side
- [ ] Sessions validated server-side for protected routes
- [ ] Admin routes protected
- [ ] No public signup paths introduced accidentally

## Testing

- [ ] Vitest tests pass
- [ ] React Testing Library simulates real use where UI is tested
- [ ] No fragile assertions

---

# 4. DATABASE & SQL

- [ ] Migrations versioned under `database/migrations/`
- [ ] `make db-bootstrap` run and bootstrap committed when schema changes
- [ ] No destructive migration without warning
- [ ] Indexes added appropriately
- [ ] Parameterized queries used (Supabase client / prepared SQL)
- [ ] No N+1 queries
- [ ] RLS considered when client-facing tables are exposed
- [ ] UUID PKs, `TIMESTAMPTZ`, `created_at` / `updated_at` conventions followed

---

# 5. SECURITY REVIEW (MANDATORY)

- [ ] No hardcoded secrets
- [ ] No raw SQL string concatenation with user input
- [ ] XSS protections verified
- [ ] Sensitive logs removed
- [ ] npm audit clean (or accepted risk documented)
- [ ] Dependencies reviewed
- [ ] Principle of least privilege applied
- [ ] Supabase service role keys never exposed client-side
- [ ] Invite tokens are unguessable and single-use / limited-use as designed
- [ ] Password hashes never logged or returned in API responses

---

# 6. PERFORMANCE

- [ ] Efficient DB queries for brackets and leaderboards
- [ ] No unnecessary client bundles
- [ ] Images / remote media handled carefully (prefer official URLs when allowed)
- [ ] No excessive React re-renders on interactive bracket UI

---

# 7. CI/CD & INFRA

- [ ] CI workflow correct; Vercel deploys via Git (`main` → Preview,
      `release` → Production)
- [ ] Vercel Root Directory remains `web`
- [ ] Lockfiles committed (`web/package-lock.json`); dependency bumps intentional
- [ ] No environment drift (Preview vs Production vars documented)

---

# 8. LOGGING & OBSERVABILITY

- [ ] Logs meaningful but not verbose
- [ ] No sensitive data in logs (passwords, tokens, service keys)
- [ ] Errors logged with context

---

# 9. DOCUMENTATION

- [ ] README updated when user-facing setup changes
- [ ] Environment variables documented
- [ ] `web/.env.example` updated if any env vars added or changed
- [ ] Makefile targets accurate
- [ ] ROADMAP updated when shipping or deferring planned work

---

# 10. CODE CRAFTSMANSHIP & PATTERNS (MANDATORY)

## TypeScript Architecture & Patterns

### Type Discipline

- [ ] No unsafe type assertions without justification
- [ ] Domain models defined (bears, matchups, pools, picks, etc.)
- [ ] Zod validates external data
- [ ] Narrow types used
- [ ] Exhaustive switches

### Organization

- [ ] Clear folder separation (`app/`, `components/`, `lib/`)
- [ ] No cross-layer imports that leak server secrets
- [ ] No server logic in client components

### Hooks & Logic

- [ ] Hooks single responsibility
- [ ] No conditional hooks
- [ ] Business logic (scoring, advancement) not buried only in UI
- [ ] Async server logic isolated

### Error Handling

- [ ] Error boundaries used where needed
- [ ] No swallowed promise rejections

---

## React / Next.js Patterns

### App Router Discipline

- [ ] Server components default where possible
- [ ] Client components explicitly marked
- [ ] No server-only imports client-side
- [ ] No secret leakage via props

### State & Performance

- [ ] Clear server vs client state separation
- [ ] Intentional cache invalidation after admin publishes results
- [ ] No unnecessary memoization
- [ ] No large client bundles introduced casually

### Accessibility

- [ ] ARIA correct
- [ ] Keyboard navigation works for bracket picks
- [ ] Focus management handled in dialogs/modals

---

## Code consistency & project conventions

Per `.cursorrules` — enforce for consistency:

### Alphabetization

- [ ] **TypeScript:** Imports and named import members; object/interface keys;
      JSX props (`key` first, `on*` last); union types; `className` classes
      where practical
- [ ] **ESLint:** `eslint-plugin-perfectionist` passes

### Comment spacing

- [ ] Standalone comments have a blank line above and below (except at block
      start/end)
- [ ] JSX comments have no blank lines above/below (compact)
- [ ] JSDoc directly above the declaration, no blank line between

### Config & env

- [ ] New or changed env vars added to `web/.env.example`
- [ ] No new hardcoded config; constants or env used

---

## Refactor Smells (Automatic Fail Signals)

Fail PR if it introduces:

- Massive functions
- Copy-paste duplication
- Silent catch blocks
- Implicit global state
- Hardcoded secrets
- UI components >300 lines without decomposition
- Public registration / open pool creation without an explicit product decision

---

# FINAL REVIEW SUMMARY

- [ ] All checks completed
- [ ] Critical issues resolved
- [ ] Major issues addressed
- [ ] Minor issues noted
- [ ] Safe to merge
