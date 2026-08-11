---
name: security-review
description: >-
  Security review for secrets, invites, sessions, and Supabase key exposure.
---

# Security Review

Read `CONTEXT.md`, `AGENTS.md`, `docs/SECURITY.md`, `docs/REVIEW.md`.

Review the change for:

- Secrets in source, bundle, or logs
- `SUPABASE_SERVICE_KEY` / password hashes exposed client-side
- Invite token strength and single-use behavior
- Cookie-session mutation CSRF posture
- Dependency / audit risk

Output MUST / SHOULD / NICE / OUT OF SCOPE per `docs/REVIEW.md`.
