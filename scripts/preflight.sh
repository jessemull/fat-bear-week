#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "==> format"
make format

echo "==> lint"
make lint

echo "==> typecheck"
make typecheck

echo "==> knip"
make knip

echo "==> test (with coverage thresholds)"
make test

echo "==> security"
make security

echo "==> build"
make build

echo "==> preflight OK"
