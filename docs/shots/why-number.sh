#!/usr/bin/env bash
# The number in "Why" on the start page: how many published axios versions "^1.7.2" accepts today.
set -euo pipefail
npm view axios versions --json | node -e '
  const versions = JSON.parse(require("fs").readFileSync(0, "utf8"))
  const accepted = versions.filter((v) => {
    const [major, minor, patch] = v.split(".").map(Number)
    return /^\d+\.\d+\.\d+$/.test(v) && major === 1 && (minor > 7 || (minor === 7 && patch >= 2))
  })
  console.log(`${accepted.length} versions match ^1.7.2 (${accepted[0]} to ${accepted.at(-1)})`)
'
