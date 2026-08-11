---
name: push-validation
description: >-
  Validate branch before push using quality gates and git checks.
---

# Push Validation

Run early:

```bash
make format
make lint
make test
make security
make build
git status
```

Ensure no secrets staged. Do not push unless the user asks. Do not use `--no-verify` unless the user explicitly requests it.
