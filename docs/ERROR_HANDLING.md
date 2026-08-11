# Error Handling

> **AI agents — read this file when:** adding error UI, API error responses, or catch blocks.

---

## Principles

- Fail visibly for actionable user errors
- Fail safely for configuration mistakes — do not silently continue with missing env
- Prefer clear UI copy over raw exception strings
- API routes return `{ error: string }` (or structured error) with appropriate HTTP status

---

## Layers

- Route handlers / server actions: catch expected failures; log server-side without secrets
- UI: show friendly messages; no stack traces / tokens / password hashes in the client
- No empty `catch` blocks

---

## Loading / empty

Keep explicit loading/error/empty states for bracket, leaderboard, and join flows rather than blank screens.
