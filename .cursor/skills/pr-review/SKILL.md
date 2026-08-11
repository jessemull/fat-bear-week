---
name: pr-review
description: >-
  Review PRs for Fat Bear Week: diff-first, severity-tiered task lists. Use when reviewing a PR or branch.
---

# PR Review

**Severity:** `docs/REVIEW.md` (MUST / SHOULD / NICE / OUT OF SCOPE / VERIFY).

**Governance:** skim `CONTEXT.md` + `AGENTS.md`; load domain docs when the diff touches them.

## Principles

1. Diff-first
2. One bullet = one actionable task
3. Fixed output sections; `(no items)` when empty
4. No hedging in MUST/SHOULD/NICE

## Gather

```bash
git fetch origin main
git log --oneline origin/main..HEAD
git diff origin/main...HEAD --stat
git diff origin/main...HEAD
```

## Output sections (always)

1. **Scope** — commits, files, +/-/type, risk
2. **Architecture** — OK or concern (layers, auth, Supabase)
3. **Files changed** — table
4. **Reviewed areas** — domains applied (+ N/A)
5. **[MUST]** / **[SHOULD]** / **[NICE TO HAVE]** / **[OUT OF SCOPE]** / **[VERIFY]**
6. **Strengths**
7. **Test plan** — `make lint`, `make test`, `make build`
8. **Verification** — commands actually run

Bullet format: `` `path:line` — imperative task ``

Companion skills: `security-review`, `testing`.
