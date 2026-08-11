# Comments

> **AI agents — read this file when:** writing or editing comments / JSDoc.

---

## Principles

- Explain **why**, not what the next line does.
- Prefer renaming, extracting, or typing over a comment that restates code.
- Delete comments that only restate the obvious.

---

## Spacing (TypeScript / JavaScript)

- Standalone `//` comments: blank line **above and below**
- First line of a block: blank line **below** only
- Last line of a block: blank line **above** only

## JSX

- `{/* */}` comments: **no** blank lines immediately above or below

## JSDoc

- Place directly above the declaration (no blank line between)

---

## Forbidden

- Long-term commented-out code
- TODOs without owner/ticket when they block work
- Comments that contradict the code
