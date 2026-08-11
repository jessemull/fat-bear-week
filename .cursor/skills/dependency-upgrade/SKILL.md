---
name: dependency-upgrade
description: >-
  Upgrade or add npm dependencies safely for Fat Bear Week (`web/`).
---

# Dependency Upgrade

Read `docs/DEPENDENCIES.md`.

1. Justify the change
2. Install / bump in `web/` (coherent groups: framework → plugins → lint/test → misc)
3. `make format && make lint && make test && make security && make build`
4. Update intentional holds table if needed; note breaking changes
5. Do **not** run `npm audit fix --force`
6. Keep perfectionist on **v5** option shape if touching ESLint config
