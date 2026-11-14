#!/usr/bin/env bash
# Smoke-tests the interactive `init` prompts under a pseudo-terminal.
# Usage: pnpm --filter loseta smoke [init args]
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cli="$root/dist/cli.js"

if [[ ! -f "$cli" ]]; then
  echo "smoke-init: build the CLI first (pnpm --filter loseta build)" >&2
  exit 1
fi

if script -qec true /dev/null >/dev/null 2>&1; then
  run_under_pty() { script -qec "$1" /dev/null; }
elif script -q /dev/null true >/dev/null 2>&1; then
  run_under_pty() { script -q /dev/null bash -c "$1"; }
else
  echo "smoke-init: script(1) with a command argument is required" >&2
  exit 1
fi

project="$(mktemp -d)"
trap 'rm -rf "$project"' EXIT

cmd="node $(printf '%q' "$cli") init"
for arg in "$@"; do
  cmd+=" $(printf '%q' "$arg")"
done

# clack reads one keypress per prompt; pace Enter so each prompt gets a turn.
{
  sleep 1; printf '\r'
  sleep 1; printf '\r'
  sleep 1; printf '\r'
  sleep 1
} | (cd "$project" && run_under_pty "$cmd")

echo
if [[ -f "$project/loseta.json" ]]; then
  echo "loseta.json:"
  cat "$project/loseta.json"
else
  echo "smoke-init: no loseta.json written" >&2
fi
