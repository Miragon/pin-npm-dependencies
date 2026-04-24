# Enforce Pinned npm Dependencies

A GitHub Action that fails the build if any `dependencies` or `devDependencies` entry in `package.json` uses a version range (`^` or `~`) instead of an exact pinned version.

## Why pin dependencies?

Version ranges like `^1.1.2` allow npm to silently install a newer version during CI. That newer version may have breaking changes or broken internals — as happened with `camunda-transaction-boundaries`, where a patch introduced an unresolvable ESM import that broke builds. Pinning to exact versions makes builds reproducible and failures explicit.

## Usage

```yaml
- uses: miragon/action-pin-dependencies@v1
```

That's it. The action checks `package.json` in the root of your repository and fails with an annotation for each violation.

### Full example

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
        uses: miragon/action-pin-dependencies@v1

      - run: npm ci
      - run: npm test
```

## Inputs

| Input | Description | Default |
|-------|-------------|---------|
| `package-json-path` | Path to the `package.json` file to check | `package.json` |
| `check-peer-dependencies` | Also check `peerDependencies` (ranges are common there, so disabled by default) | `false` |

### Custom path example

```yaml
- uses: miragon/action-pin-dependencies@v1
  with:
    package-json-path: packages/my-lib/package.json
```

## Example output

When violations are found, each one appears as a GitHub annotation on the PR:

```
✗ camunda-transaction-boundaries: "^1.1.2" — use an exact version instead (e.g. "1.1.2")
✗ some-other-dep: "~2.0.0" — use an exact version instead (e.g. "2.0.0")
```

When all versions are pinned:

```
✓ All 14 dependencies are pinned to exact versions.
```

## Recommended: pair with `.npmrc`

Add `save-exact=true` to your `.npmrc` to prevent contributors from accidentally introducing ranges via `npm install`:

```
save-exact=true
```

This acts as a first line of defence locally; the action is the CI guardrail.

## License

MIT — [Miragon GmbH](https://miragon.io)
