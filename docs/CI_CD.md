# CI / CD

> **AI agents — read this file when:** changing workflows, interpreting CI failures, or documenting deploy gates.

---

## Workflows

| Workflow | Trigger | Role |
| -------- | ------- | ---- |
| `.github/workflows/ci.yml` | PR and push to `main` / `release` | format → lint → typecheck → knip → test → security → build → e2e → lighthouse |

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

Husky **pre-push** runs `./scripts/preflight.sh` (same gates as CI minus e2e and lighthouse for push speed). Run those before large UI merges:

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
