---
name: pr-summary
description: >-
  Draft PR title and summary for Fat Bear Week from branch diff. Always emit
  GitHub-ready markdown in copyable fenced blocks.
---

# PR Summary

```bash
git fetch origin main
git log --oneline origin/main..HEAD
git diff origin/main...HEAD --stat
```

Produce an imperative title plus:

- Summary bullets (why)
- Test plan (`make lint`, `make test`, `make security`, `make build`)
- Risk notes (auth/invites, schema, a11y)

## Copyable GitHub paste

Always emit **two fenced code blocks** so the chat UI shows a copy button on each. The inner text must be valid GitHub markdown — paste the first into the PR title field and the second into the description or a PR comment. Do not wrap either block in quotes or extra commentary.

1. Title: a `text` fence containing **only** the title line (no heading prefix).
2. Body: a `markdown` fence containing **only** the GitHub body below.

Do not put the body in a bullet list, table, or prose. Do not use nested triple-backtick fences inside the body (use indented code or single backticks).

Template for the body fence:

````markdown
## Summary

- Why this change exists
- User-facing or operational impact

## Test plan

- [ ] `make lint`
- [ ] `make test`
- [ ] `make security`
- [ ] `make build`

## Risk notes

- Auth / invites:
- Schema:
- a11y:
````
