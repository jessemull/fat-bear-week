# Testing

> **AI agents — read this file when:** adding or changing tests, coverage, or a11y checks.

---

## Stack

- Unit/component: Vitest + Testing Library
- Accessibility: eslint-plugin-jsx-a11y; add axe/jest-axe patterns when interactive UI lands
- Setup: `web/tests/setup.ts`

---

## Coverage

**Goal ≥80%** on `lib/` and tested application modules as Phase 1 logic lands.

- Do **not** delete tests solely to raise coverage percentage.
- Do **not** weaken coverage goals without governance approval.
- Scaffold pages may remain lightly covered until real behavior exists — prefer testing scoring, auth, and invite logic thoroughly when written.

---

## What to test

- Public APIs and pure business logic (scoring, advancement, invite validation)
- Happy path, sad path, and edge cases
- Accessible names / keyboard behavior for interactive controls

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
| `make test` | Vitest |
| `make test-coverage` | Vitest with coverage |
| `cd web && npm run test:watch` | Watch mode |

See also `docs/ACCESSIBILITY.md` and `AGENTS.md` testing rules.
