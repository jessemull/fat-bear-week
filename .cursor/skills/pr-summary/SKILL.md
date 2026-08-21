---
name: pr-summary
description: >-
  Draft PR title and summary for Fat Bear Week from branch diff. Always emit
  GitHub-ready markdown in copyable fenced blocks. Use when the user asks for a
  PR summary, PR description, or /pr-summary.
---

# PR Summary

Author-facing paste for GitHub. Reviewer output is `pr-review`. Match
`docs/CONTRIBUTING.md` (What / Why / Testing) and `docs/GOVERNANCE.md`
(`[governance]` prefix). If `.github/pull_request_template.md` exists, use the
same headings — do not invent a competing outline.

## Gather

Base is `origin/main` (not `release`).

```bash
git fetch origin main
git log --oneline origin/main..HEAD
git diff origin/main...HEAD --stat
git diff origin/main...HEAD
```

Read the **diff**, not only `--stat`. Summarize the change; do not dump a
file-by-file changelog. If the diff is huge, group by area and suggest splitting
or stacking PRs.

Never paste secrets, `.env` values, real invite/reset URLs, or PII.

## Title

Imperative English (`Add …`, `Fix …`, `Document …`). Standalone first line:
what the PR does.

- ~50–72 characters; no trailing period
- No Conventional Commits prefixes (`feat:`, `fix:`)
- Prefix `[governance]` when the PR is process/docs-only
- Do not put `Closes #N` in the title

## Copyable GitHub paste

Always emit **two fenced code blocks** so the chat UI shows a copy button on
each. Inner text is valid GitHub markdown. Paste the title into the PR **title**
field and the body into the PR **description** (where `Closes #` works) — not a
review comment unless the user asks.

Do not wrap either block in quotes or extra commentary. Do not use nested
triple-backtick fences inside the body (indented code or single backticks).

1. Title: a `text` fence containing **only** the title line.
2. Body: a `markdown` fence containing **only** the GitHub body.

Always include **Summary**, **Test plan**, and **Risk notes**. Add optional
sections only when they apply. Omit unused risk bullets instead of writing N/A.

Do not add type-of-change checkboxes, self-review checkboxes, or “CI passed”
theater. CI already runs lint/test/security/build/e2e/lighthouse on PRs to
`main`.

Template for the body fence (drop unused optional sections and empty risk
bullets):

````markdown
## Summary

- What changed (user-facing)
- Why (problem or decision the diff cannot show)

Closes #123

## Test plan

- [ ] `make lint`
- [ ] `make test`
- [ ] `make security`
- [ ] `make build`
- [ ] Manual: …

## Risk notes

- Auth / invites: …
- Schema / ops: …
- a11y: …

## Approach

What you chose and what you rejected. Skip if obvious.

## Screenshots

UI before/after. Skip for SQL/docs-only.

## Out of scope

Follow-ups deliberately not in this PR.

## Reviewer focus

One or two bullets: where to look first.
````

## Section rules

**Summary** — What and why, not a file list. `Closes #N` / `Fixes #N` only when
a real issue exists; never invent one. Put closing keywords in the body as
plain text.

**Test plan** — Keep the four `make` gates as a short local reminder. Spend the
rest on **human** steps (flows, Preview, devices) and what was **not** tested.

**Risk notes** — Include a bucket only if the diff touches it:

- Auth / invites — tokens, sessions, passwords, Turnstile, enumeration
- Schema / ops — migrations, `make db-bootstrap`, env (`.env.example`), apply
  on **dev** before Preview and **prod** on `release`
- a11y — names, keyboard, headings, contrast

Write `low, reversible` when that is true. Add rollout/rollback when a
migration or env change is required.

**Optional** — Approach, Screenshots (UI only), Out of scope, Reviewer focus.
Include a size/split warning in the chat (outside the fences) when the PR
should not ship as one change.
