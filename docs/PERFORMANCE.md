# Performance

> **AI agents — read this file when:** changing bundles, images, bracket UIs, or investigating Lighthouse regressions.

---

## Targets

Lighthouse CI (`web/.lighthouserc.js`) runs against a **production build** (`next build` + `next start`), mobile form factor, 3 runs:

| Category       | Minimum score | Assert |
| -------------- | ------------- | ------ |
| Performance    | ≥ 0.5         | error (CI floor; aim higher locally) |
| Accessibility  | ≥ 0.9         | error |
| SEO            | ≥ 0.9         | error |
| Best practices | ≥ 0.9         | error |

`make lighthouse` builds then runs LHCI. CI runs LHCI after `make build` (no second build). Optional: `LHCI_URL=https://… LHCI_NO_SERVER=true` against a Preview/Production URL.

---

## Practices

- Keep the first viewport lean on marketing/landing surfaces
- Prefer Server Components; avoid large unnecessary client bundles
- Bracket and leaderboard queries should be efficient (no N+1)
- Use Next.js `Image` with configured `remotePatterns` for official bear photos when allowed
- Do not rehost or proxy Explore.org video streams

---

## Commands

```bash
make build
make lighthouse
```
