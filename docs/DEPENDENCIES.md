# Dependencies

> **AI agents — read this file when:** adding, removing, or upgrading npm packages.

---

## Principles

- Prefer packages already in the tree (Next, React, Supabase, Zod, Vitest, Tailwind, Lucide).
- New runtime dependencies need a clear problem statement in the PR.
- Stay cost-optimized — avoid paid SDKs without product approval.
- Prefer upgrading the blocking constraint over freezing forever without docs.

---

## Process

1. Check whether an existing dependency already solves the need.
2. Add with a range consistent with the repo (`web/package.json`).
3. Run `make format && make lint && make test && make security && make build`.
4. Note residual audit risk in the PR.
5. Update this file if introducing an intentional version hold.

---

## Runtime / CI pins

| Pin | Value | Notes |
| --- | ----- | ----- |
| Node (CI + `.nvmrc` + `web/package.json` `engines`) | **24** | Vercel Functions default; Node 26 is Sandbox-only, not a Functions runtime |
| Package manager | npm + `legacy-peer-deps=true` (`web/.npmrc`) | |

---

## Intentional version holds

| Package | Notes |
| ------- | ----- |
| `eslint-plugin-perfectionist` | Use **v5** option shape (`internalPattern`, `newlinesBetween` as number, array `customGroups`). Do not copy nextdoor’s v2 config verbatim. |
| `@lhci/cli` / `lighthouse` | Keep `@lhci/cli@^0.15` with direct `lighthouse@^12.8` (same major pin as crow/100-letters). Do **not** `npm audit fix --force` — it may downgrade LHCI. |

## Phase 1 additions

| Package | Why |
| ------- | --- |
| `resend` | Server-side invite email delivery (no AWS in this repo). API key stays server-only. |

Cloudflare Turnstile uses the public script + `fetch` siteverify — **no npm SDK**.

---

## Known audit residual

`make security` runs `npm audit --omit=dev` so **runtime** dependencies stay clean and blocking.

The full tree (`npm audit` without `--omit=dev`) may report transitive advisories under `@lhci/cli` (e.g. nested `tmp`, `uuid`). Those are **dev-only** (Lighthouse CI tooling) and match residual notes in crow-detector / 100-letters. Prefer upgrading LHCI when a compatible release lands; do not force-downgrade.

Do **not** run `npm audit fix --force`.

---

## Discouraged without product approval

- LLM provider SDKs
- New global state managers (Redux, Zustand, MobX)
- Payment processors, ad SDKs
- Heavy analytics vendors

---

## Notes

- Target stack: Next **16** + Tailwind **4** + React **19** + TypeScript **5+** + Vitest + ESLint **9** (flat config).
- ESLint: `eslint-config-next/core-web-vitals` + perfectionist (v5) + unused-imports in `web/eslint.config.mjs`.
- **No Prettier** — format with `make format` (ESLint `--fix`), matching nextdoor. Crow/100-letters use Prettier; do not dual-stack here.
- **Knip ignores:** `web/knip.json` `ignoreDependencies` may list packages reserved for Phase 1 or CLI-only wiring. When you first import a package in app/lib code (or drop the unused package), **delete it from `ignoreDependencies`** in the same PR.
