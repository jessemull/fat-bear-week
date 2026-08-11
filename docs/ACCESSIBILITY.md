# Accessibility

> **AI agents — read this file when:** changing UI controls, headings, menus, or a11y tests.

---

## Requirements

- `eslint-plugin-jsx-a11y` rules (enforced in `web/eslint.config.mjs`)
- jest-axe: `expect(await axe(container)).toHaveNoViolations()` for UI under test
- Prefer Testing Library queries by role/name

---

## Practices

- Accessible names on buttons and links
- Keyboard operable bracket picks and dialogs
- Interactive `<button>` elements need `type="button"` unless submitting a form
- Prefer `next/link` for navigation
- One clear page `<h1>`; preserve focus visibility
- Do not “fix” a11y by adding unrequested chrome

---

## Commands

`make lint`, `make test`, `make e2e`, `make lighthouse`
