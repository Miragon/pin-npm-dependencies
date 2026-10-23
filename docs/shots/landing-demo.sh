#!/usr/bin/env bash
# Real runs of the action for the demo on the start page (docs/.vitepress/theme/LandingDemo.vue):
# one package.json with ranges, then the same file pinned. Paths are shortened to package.json.
set -euo pipefail
repo="$(cd "$(dirname "$0")/../.." && pwd)"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

run() {
  cp "$1" "$work/package.json"
  (cd "$work" && INPUT_FILES=package.json node "$repo/src/index.js" || true)
}

cat > "$work/ranges.json" <<'JSON'
{
  "dependencies": {
    "axios": "^1.7.2",
    "react": "18.3.1",
    "ui-kit": "github:acme/ui-kit#main"
  }
}
JSON
cat > "$work/pinned.json" <<'JSON'
{
  "dependencies": {
    "axios": "1.7.2",
    "react": "18.3.1",
    "ui-kit": "github:acme/ui-kit#4f2c9e1"
  }
}
JSON

echo "--- ranges"; run "$work/ranges.json"
echo "--- pinned"; run "$work/pinned.json"
