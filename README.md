# pin-npm-dependencies

A GitHub Action that fails the build if any `dependencies` or `devDependencies` in `package.json` use a version range (`^` or `~`) instead of an exact pinned version.

Works with **npm, yarn, and pnpm** — all three use `package.json` with the same version syntax.

## Why pin?

Version ranges like `^1.1.2` allow npm to silently install a newer patch/minor version during CI. That version may have breaking internals — exact pinning makes builds reproducible and breakage explicit.

## Usage

### Scan a directory recursively (default)

```yaml
- uses: miragon/pin-npm-dependencies@v1
```

Scans all `package.json` files under the repository root, excluding `node_modules`, `.git`, `dist`, and `build`.

### Scan a specific subdirectory (monorepo)

```yaml
- uses: miragon/pin-npm-dependencies@v1
  with:
    root-path: packages/my-lib
```

### Check explicit files

```yaml
- uses: miragon/pin-npm-dependencies@v1
  with:
    files: |
      package.json
      packages/core/package.json
      packages/ui/package.json
```

When `files` is set, `root-path` is ignored.

## Inputs

| Input | Description | Default |
|-------|-------------|---------|
| `files` | Newline-separated list of `package.json` paths. When set, `root-path` is ignored. | `''` |
| `root-path` | Root directory to scan recursively (`node_modules` etc. excluded). | `'.'` |
| `check-peer-dependencies` | Also check `peerDependencies` (ranges are intentional there, so disabled by default). | `'false'` |

## Example output

```
Checking 3 package.json file(s)...

  ✓ package.json
::error file=packages/ui/package.json::react: "^18.0.0" — use exact version "18.0.0"
  ✓ packages/core/package.json

1 unpinned version(s) found. Use exact versions (e.g. "1.2.3" not "^1.2.3").
```

## Recommended: pair with `.npmrc`

Add `save-exact=true` to your `.npmrc` to prevent `npm install` from writing ranges:

```
save-exact=true
```

This guides contributors locally; the action is the CI guardrail.

## Full workflow example

```yaml
name: Build

on:
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Enforce pinned dependencies
        uses: miragon/pin-npm-dependencies@v1

      - run: npm ci
      - run: npm test
```

## License

MIT — [Miragon GmbH](https://miragon.io)
