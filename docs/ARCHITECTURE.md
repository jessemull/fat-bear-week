# Architecture

> **AI agents — read this file when:** changing folder structure, routes, API layers, or module boundaries.

---

## System

```
Browser → Vercel (Next.js App Router + API)
                │
                ▼
         Supabase PostgreSQL
     (pools, invites, tournaments,
      bears, matchups, entries, picks)
```

- **Preview:** push to `main` → Vercel Preview + **dev** Supabase
- **Production:** push to `release` → Vercel Production + **prod** Supabase (`www.fatbearweek.net`)
- Admin enters official winners; scoring/leaderboards derive from DB state
- This app does **not** replace FatBearWeek.org voting
- Each pool references exactly one tournament (`pools.tournament_id`)
- App tables enable RLS with no anon policies yet; mutations use the service role on the server

---

## Folder structure

| Path | Role |
| ---- | ---- |
| `web/app/` | Routes, layouts, API route handlers |
| `web/components/` | Feature UI |
| `web/lib/` | Shared helpers (`*.server.ts` / `*.client.ts`) |
| `web/tests/` | Vitest setup and tests |
| `database/migrations/` | Numbered SQL source of truth |
| `database/bootstrap.sql` | Generated concatenation for new projects |
| `docs/` | Governance + product docs |
| `.cursor/` | Agent rules and skills |

---

## Dependency direction

`app` routes → components → `lib` helpers → Supabase.

- Server-only modules must not be imported from Client Components.
- Prefer `@/` path alias from `web/tsconfig.json`.
- Constants/utils must not create circular imports into UI.

---

## Constraints

- `'use client'` only when hooks or browser APIs require it
- Zod-validate external input on API routes
- Consistent JSON: `{ data }` or `{ error }`
- Invite/session checks before mutations
- Generic tournament model (rounds/matchups), not hardcoded field size

### Legacy `/pools` paths

Commissioner pool management lives under `/admin/pools`. Thin redirects remain at
`/pools` and `/pools/[poolId]/invites` for old bookmarks; prefer admin URLs in new links.

---

## Fail signals

- Deep `../../../` imports across features
- Service role key used in client code
- Public signup paths without product approval
- Hardcoded 64-team / NCAA bracket assumptions
- Business logic buried only in UI with no testable `lib/` functions
