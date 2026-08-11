# Testing

> **AI agents — read this file when:** adding or changing tests, coverage, a11y, or e2e.

---

## Stack

- Unit/component: Vitest + Testing Library
- Accessibility: eslint-plugin-jsx-a11y + **jest-axe** (extended in `web/tests/setup.ts`)
- E2E: Cypress (`make e2e` starts Next.js via `start-server-and-test`)
- Perf / a11y / SEO gates: Lighthouse CI (`make lighthouse`)
- Setup: `web/tests/setup.ts`

---

## Coverage

**≥80%** branches, functions, lines, and statements — enforced by Vitest thresholds on:

- `lib/**/*`
- `components/**/*`
- `app/page.tsx`

`app/layout.tsx` is excluded (font/layout chrome). Widen includes as new modules land; add tests with the code.

- Do **not** delete tests solely to raise coverage percentage.
- Do **not** weaken thresholds without governance approval.
- `make test` runs Vitest **with coverage** (same as CI / preflight).

---

## Accessibility (axe)

- Extend `toHaveNoViolations` in setup.
- For interactive / page UI under test: `expect(await axe(container)).toHaveNoViolations()`.
- Keep jsx-a11y lint rules enabled.

---

## E2E (Cypress)

- Specs: `web/cypress/e2e/**/*.cy.ts`
- Config: `web/cypress.config.ts` (`baseUrl` http://localhost:3000)
- `make e2e` boots `next dev`, waits for ready, runs `cypress run`
- Smoke today: landing page brand heading

---

## What to test

- Public APIs and pure business logic (scoring, advancement, invite validation)
- Happy path, sad path, and edge cases
- Accessible names / keyboard behavior for interactive controls
- Landing and critical user journeys in Cypress as flows exist

## What not to over-test

- Framework/library internals
- Trivial pass-through wrappers
- Pure Tailwind class strings

---

## Conventions

- Prefer `*.test.ts(x)` under `web/tests/` or colocated next to source
- Prefer `userEvent` + accessible roles/names
- Structure: Arrange / Act / Assert
- Name tests: `should [expected behavior] when [condition]`

---

## Commands

| Command | Description |
| ------- | ----------- |
| `make test` | Vitest + coverage thresholds |
| `make e2e` | Cypress smoke against local Next |
| `make lighthouse` | LHCI against production `next start` |
| `make knip` | Unused files / dependencies |
| `make preflight` | Full local gate (includes knip + test + build) |
| `cd web && npm run test:watch` | Watch mode |
| `cd web && npm run cypress:open` | Interactive Cypress |

See also `docs/ACCESSIBILITY.md`, `docs/PERFORMANCE.md`, and `AGENTS.md` testing rules.
