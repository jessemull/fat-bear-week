# Performance

> **AI agents — read this file when:** changing bundles, images, bracket UIs, or perceived load.

---

## Practices

- Keep the first viewport lean on marketing/landing surfaces
- Prefer Server Components; avoid large unnecessary client bundles
- Bracket and leaderboard queries should be efficient (no N+1)
- Use Next.js `Image` with configured `remotePatterns` for official bear photos when allowed
- Do not rehost or proxy Explore.org video streams

---

## Commands

`make build` — watch for bundle / compile regressions.

Mobile-first matters for join + bracket + leaderboard (see `docs/ROADMAP.md`).
