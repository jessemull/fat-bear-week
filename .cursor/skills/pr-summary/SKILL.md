---
name: pr-summary
description: >-
  Draft PR title and summary for Fat Bear Week from branch diff.
---

# PR Summary

```bash
git fetch origin main
git log --oneline origin/main..HEAD
git diff origin/main...HEAD --stat
```

Produce:

- Title (imperative)
- Summary bullets (why)
- Test plan (`make lint`, `make test`, `make security`, `make build`)
- Risk notes (auth/invites, schema, a11y)
