# CI / CD

> **AI agents — read this file when:** changing workflows, interpreting CI failures, or documenting deploy gates.

---

## Workflows

| Workflow | Trigger | Role |
| -------- | ------- | ---- |
| `.github/workflows/ci.yml` (`Quality` / `quality-gates`) | **PR → `main`**; **push → `main` / `release`** | format → lint → typecheck → knip → test (+ coverage artifact) → security → build → e2e → lighthouse |
| `.github/dependabot.yml` | Weekly/monthly | npm (root + `web/`) and GitHub Actions PRs |

Promote PRs (`main` → `release`) do **not** re-run Actions: they reuse the `push` checks already on `main`. Merging into `release` runs `quality-gates` once via `push`.

**Deploy** is not done in Actions. Vercel deploys from Git:

- `main` → Preview
- `release` → Production (`make deploy-web-prod`)

Do **not** rewrite CI lightly. Document changes in the PR; treat as human-review required (`docs/GOVERNANCE.md`).

### Quality jobs

| Step | Blocking? | Notes |
| ---- | --------- | ----- |
| Format (ESLint `--fix`) | Yes | Applied in the runner |
| Lint | Yes | `make lint-ci` |
| Typecheck | Yes | `tsc --noEmit` |
| Knip | Yes | Unused files / deps (`web/knip.json` ignores intentional scaffold packages) |
| Unit tests + coverage | Yes | Vitest ≥80% thresholds |
| Security | Yes | `npm audit --omit=dev` (runtime deps; see `docs/DEPENDENCIES.md` for LHCI transitive notes) |
| Build | Yes | Next.js production build |
| E2E | Yes | Cypress smoke via `make e2e` |
| Lighthouse | Yes | LHCI against `next start` (`web/.lighthouserc.js`) |

Node **22** via `actions/setup-node` and `.nvmrc`, with npm cache on root + `web/` lockfiles.

---

## Local parity

Husky hooks:

| Hook | Command |
| ---- | ------- |
| **pre-commit** | `lint-staged` in `web/` (ESLint `--fix` on staged JS/TS) |
| **pre-push** | `./scripts/preflight.sh` (full gate minus e2e/lighthouse) |

Run e2e and lighthouse before large UI merges:

```bash
make preflight
make e2e
make lighthouse
```

Do not skip gates with `--no-verify` unless the user explicitly requests it.

---

## Fail signals

- Weakening coverage thresholds or deleting tests to greenwash
- Committing secrets or `.env*` files (except `.env.example`)
- Deploying production without verifying Preview
- Changing Production branch / Root Directory (`web`) without documenting it
- Bypassing Husky without an explicit human request
- Softening Lighthouse floors without updating `docs/PERFORMANCE.md`
