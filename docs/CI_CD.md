# CI / CD

> **AI agents — read this file when:** changing workflows, interpreting CI failures, or documenting deploy gates.

---

## Workflows

| Workflow | Trigger | Role |
| -------- | ------- | ---- |
| `.github/workflows/ci.yml` | PR and push to `main` / `release` | `make format` → `make lint-ci` → `make test-coverage` → `make security` → `make build` |

**Deploy** is not done in Actions. Vercel deploys from Git:

- `main` → Preview
- `release` → Production (`make deploy-web-prod`)

Do **not** rewrite CI lightly. Document changes in the PR; treat as human-review required (`docs/GOVERNANCE.md`).

### Quality jobs

| Step | Blocking? | Notes |
| ---- | --------- | ----- |
| Format (ESLint `--fix`) | Yes | Applied in the runner |
| Lint | Yes | `make lint-ci` |
| Unit tests + coverage report | Yes | Vitest |
| Security | Yes | `npm audit` |
| Build | Yes | Next.js production build |

Node **22** via `actions/setup-node` with npm cache on `web/package-lock.json`.

---

## Local parity

```bash
make format
make lint
make test
make security
make build
```

Keep local and CI green. Do not skip gates with `--no-verify` unless the user explicitly requests it.

---

## Fail signals

- Weakening tests or audits solely to “make CI green”
- Committing secrets or `.env.local`
- Deploying production without verifying Preview
- Changing Production branch / Root Directory (`web`) without documenting it
