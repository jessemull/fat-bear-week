---
name: commit
description: >-
  Prepare git commits for Fat Bear Week. Use when staging or committing.
---

# Commit

Read `CONTEXT.md`, `AGENTS.md`, `docs/GOVERNANCE.md` before committing.

## Safety

- Only commit when the user explicitly asks
- Never `--no-verify` unless explicitly requested
- Never force-push `main` or `release`
- Prefer atomic imperative commits (`Add …`, `Fix …`, `Document …`)

## Steps

1. `git status` / `git diff` / `git log -5 --oneline`
2. Stage relevant files only (no secrets; leave unrelated WIP unstaged)
3. Commit via HEREDOC message
4. `git status` after
