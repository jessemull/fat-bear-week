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
| Node (CI) | **22** | `.github/workflows/ci.yml` `setup-node` |
| Package manager | npm + `legacy-peer-deps=true` (`web/.npmrc`) | |

---

## Intentional version holds

| Package | Notes |
| ------- | ----- |
| `eslint-plugin-perfectionist` | Use **v5** option shape (`internalPattern`, `newlinesBetween` as number, array `customGroups`). Do not copy nextdoor’s v2 config verbatim. |

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
- ESLint: `eslint-config-next/core-web-vitals` + perfectionist in `web/eslint.config.mjs`.
