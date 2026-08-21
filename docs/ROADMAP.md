# Roadmap

Feature backlog for **fatbearweek.net** — a private Fat Bear Week fantasy
bracket pool for ~50–100 friends.

This document captures product intent from planning. Scaffold **v0** only
stands up the repo, governance, CI, docs, and initial schema. Implement
features in phases below; check items off as they ship.

**Product framing**

- Do **not** replace official Fat Bear Week voting.
- Do run a private prediction league around the official tournament.
- Invite-only (curated individual invite tokens).
- Database is the source of truth for the pool; admin enters winners.
- Vote totals are optional display metadata; scoring needs `winner_id` only.

---

## Phase 0 — Scaffold (this release)

- [x] Next.js + TypeScript app under `web/`
- [x] Makefile, CI, ESLint (perfectionist), Vitest
- [x] Agent governance stack (`CONTEXT.md`, `AGENTS.md`, `docs/*`, `.cursor/`)
- [x] Deployment / environments docs (`main` Preview, `release` Production)
- [x] Initial SQL schema (`users`, `pools`, `tournaments`, `bears`,
      `matchups`, `invitations`, `entries`, `picks`)
- [x] Placeholder landing page
- [x] This roadmap

---

## Phase 1 — Must-have pool core (V1 tournament)

### Auth & invites

- [x] Commissioner / admin account gate for pool management
      (`users.is_commissioner` via `003_commissioner_gate.sql`)
- [x] Create private pool (name, max players, bracket deadline, scoring,
      visibility of brackets before lock)
- [x] Generate **individual** invite links (`/invite/<token>`) + Resend email
- [x] Invite metadata: name hint, used/unused, optional expiry (default 14d)
- [x] Join flow: valid invite → display name + password → entry created
- [x] HTTP-only session cookie (no public registration)
- [x] Sign in / sign out for returning participants
- [x] Enforce one bracket (entry) per person per pool
- [x] Cap at `max_players`
- [x] Multiple pools per person (invite-based join for an existing account)
- [x] Forgot password / reset via email (Resend + single-use token;
      Turnstile on request + reset forms)
- [x] Account settings / profile page (`/settings`): display name,
      email (read-only from invite), password change; nav avatar is
      initials from display name (photo upload deferred)
- [x] Nav avatar / account menu (opens `/settings`; scores & history
      later when scoring ships)

### Tournament data (admin)

- [x] Create tournament year + status (`draft` / `locked` / `live` /
      `complete`)
- [x] Import / edit bears (name, nickname, identification, biography, photos,
      profile URL, age/sex if available)
- [ ] Build generic bracket: rounds → matchups → bear A / bear B / byes
- [ ] Do **not** hardcode 64-team NCAA structure (support ~8–20 bears,
      byes, varying rounds)
- [x] Publish tournament / open pool for picks
      (status transitions: `draft` → `live` → `locked` → `complete`)
- [ ] Lock brackets at deadline (no further pick edits)

### Bracket UX

- [ ] Interactive bracket UI (mobile-first)
- [ ] Pick winners for each matchup
- [ ] Bear cards / profile panels (photo, bio, history placeholders)
- [ ] Before/after photos when available
- [ ] Submit / save picks; incomplete-entry warnings
- [ ] Bracket lock state clearly shown to users

### Scoring & leaderboard

- [ ] Configurable scoring (default: Round 1 = 1, QF = 2, SF = 4, Final = 8)
- [ ] Optional upset bonus as admin setting (defer if it slows V1)
- [ ] Tiebreaker: championship vote total guess (closest wins)
- [ ] Automatic scoring when admin publishes a winner
- [ ] Live leaderboard (rank, score)
- [ ] Correct / incorrect pick indicators on brackets
- [ ] Advance winners into later matchups automatically (never hand-build
      next round) — deferred with bracket admin UI redesign

### Admin result entry

- [ ] “Set winner” UI per matchup (required) — deferred with bracket admin UI
- [ ] Optional official vote totals A/B — deferred with bracket admin UI
- [ ] Publish result → score entries → update leaderboard → mark picks
- [ ] Enter results in batches (e.g. a day’s matchups at once)
- [ ] Expect ~6 admin sessions / ~11 matchups per year (based on 2025 shape)

### Links & hygiene

- [ ] Deep link to official FatBearWeek.org vote for the current matchup
- [ ] Clear copy: this site is predictions, not official voting
- [ ] About Fat Bear Week page (short explainer)

---

## Phase 2 — High-value tournament-week experience

### Live experience

- [ ] Homepage during tournament week: leaderboard snapshot, today’s
      matchup, CTAs (My Bracket / Leaderboard / Bears)
- [ ] Explore.org live cam embed (branded player / deep-link only — no
      rehosting or proxying video)
- [ ] Side panel cam while filling bracket (desktop)

### “Your Bear” / still alive

- [ ] Leaderboard: alive indicators for remaining championship path
- [ ] Personal summary: rank, points, champion pick, Final Four picks
- [ ] Max possible remaining points
- [ ] “Can I still win?” math after each result
- [ ] Eliminated state when first place is impossible

### Bear directory

- [ ] Bear directory / roster page
- [ ] Richer bear profiles (prior Fat Bear Week results, notable facts)
- [ ] Who is still alive in the official bracket

### Ops polish

- [ ] Admin dashboard: pool status, participant list, submitted vs
      incomplete
- [ ] Reminder affordance (even if email comes later — e.g. copy list of
      incomplete names)
- [ ] Post-matchup cards with vote margins / blowout callouts when totals
      entered

---

## Phase 3 — Nice-to-have

- [ ] Pick popularity (% of pool that picked each bear)
- [ ] Before/after statistics presentation
- [ ] Historical bear performance across years
- [ ] Scenario / “what if?” simulator (leaderboard if X wins)
- [ ] Optional email magic-link or password reset (only if needed)
- [ ] Notifications (deadline reminders, result published)
- [ ] Shared invite link mode (in addition to individual tokens) — only if
      operationally useful; keep abuse controls

---

## Phase 4 — Data automation (optional)

Prefer admin entry first. Investigate automation later:

- [ ] Tournament Data Adapter interface (official source → DB)
- [ ] Investigate FatBearWeek.org / Explore structured endpoints or stable
      HTML for roster, matchups, results, vote totals
- [ ] One-time or infrequent import for pre-tournament roster/bracket
- [ ] Optional Vercel Cron: poll for new official results and set winners
- [ ] Never make the product dependent on scraping existing

**During tournament, admin must update at most:**

| Field | Required for scoring? |
|-------|------------------------|
| Matchup `winner_id` | Yes |
| `official_votes_a` / `official_votes_b` | No (display / tiebreaker resolution) |
| Participant scores / ranks | No (derived) |
| Next-round pairings | No (derived from winners) |

---

## Explicit non-goals (do not build)

- [ ] ~~Public registration / open pool directory~~
- [ ] ~~Multiple brackets per person~~
- [ ] ~~Payments / entry fees~~
- [ ] ~~Advertising~~
- [ ] ~~Comments / chat / message boards~~
- [ ] ~~Friends / following / public profiles~~
- [ ] ~~Native mobile apps~~
- [ ] ~~Replacing official voting~~
- [ ] ~~Downloading, proxying, or restreaming Explore.org video~~
- [ ] ~~Seed-multiplier scoring complexity (unless commissioner demands)~~

---

## Suggested V1 cut line

Ship Phase 1 fully before tournament week. Add Phase 2 items that fit time.
Defer Phase 3–4 unless automation becomes clearly cheaper than a few minutes
of admin entry per round.

**Minimum lovable V1**

1. Private pool + individual invites  
2. Join with name + password  
3. Import/configure bears + bracket  
4. Beautiful interactive bracket + bear cards  
5. Submit picks + lock  
6. Admin set winner  
7. Automatic scoring + leaderboard + correct/incorrect indicators  
8. Tiebreaker  
9. Official vote deep links  

---

## Reference notes (2025 tournament shape)

For planning only — do not hardcode:

- Bracket revealed day before voting
- Roughly a week of voting with defined windows
- Some days with no voting
- On the order of a dozen bears with byes possible
- ~11 individual matchup results across ~6 admin touchpoints

Build the engine as:

```
Tournament → rounds[] → matchups[] → (bearA, bearB, winner?)
```

---

## Tracking

When starting work, prefer small PRs aligned to a single roadmap checkbox
group (e.g. “invites + join”, “admin set winner + scoring”). Update this
file in the same PR that completes a checkbox.
