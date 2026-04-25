# pin-npm-dependencies

A GitHub Action that fails the build if any dependency in `package.json` is not pinned to an exact version — blocking version ranges, floating tags, and mutable git refs before they reach your supply chain.

Works with **npm, yarn, and pnpm**.

## The risk: version ranges are a supply chain attack surface

When you write `"axios": "^1.7.2"`, you're not installing axios 1.7.2. You're installing *whatever is the latest compatible version at the time `npm install` runs* — across every developer machine, every CI run, every deployment.

That gap is exactly what attackers exploit.

In December 2022 the `@ledgerhq/connect-kit` package was compromised via a stolen maintainer token. Projects that had pinned the exact version were unaffected. Projects using `^` or `~` silently pulled the malicious version on their next install. The result: $600k drained from users' wallets within hours.

In 2022, the maintainers of `colors` and `faker` — packages with hundreds of millions of weekly downloads — intentionally pushed breaking, destructive versions. Projects with exact pins could audit and choose when (or whether) to upgrade. Everyone else broke silently overnight.

The attack pattern is consistent:
1. A package maintainer's credentials are phished, or the package is abandoned and re-registered
2. A malicious version is published — often with a postinstall hook that runs before any review
3. Any project using a range (`^`, `~`, `>=`, `latest`, `*`) installs it automatically

**Pinning is not about avoiding upgrades. It's about making upgrades a conscious, reviewable decision rather than an invisible automatic one.**

### Mutable git refs are the same risk

Referencing a GitHub repo directly is increasingly common:

```json
"my-fork": "github:owner/repo#master"
```

`#master` is not a version — it's a branch pointer. It moves. Anyone who can push to that branch can change what you're installing without touching a release tag. This action detects these too.

### AI agents write your package.json now

AI coding assistants — Copilot, Cursor, Claude Code, and fully autonomous agents like Devin — generate and modify `package.json` files. They do so at scale, often in automated PR flows with no human in the review loop.

By default, most AI tools write version ranges: `"react": "^18.3.0"`. They're trained on millions of open-source repositories where ranges are the norm. They don't run a threat model before suggesting a dependency.

In agentic workflows, the exposure compounds: an agent may install dependencies autonomously, execute `npm install` in CI, and the compromised postinstall hook runs in an environment with broad token access. Researchers have demonstrated that malicious packages can embed **prompt injection payloads** targeting agents that read `package.json` or `node_modules` in the same working directory.

A CI guardrail that catches unpinned versions before they reach the install step is a simple, high-leverage control — especially as the share of AI-authored code in your repo grows.


## What this action catches

| Pattern | Example | Why it's risky |
|---------|---------|----------------|
| Caret / tilde ranges | `^1.0.0`, `~2.3.4` | Silently upgrades on each install |
| Comparison ranges | `>=1.0.0`, `<2.0.0` | Unbounded upgrade surface |
| Wildcard | `*`, `1.x`, `1.*` | Any version accepted |
| Floating tag | `latest` | Moves with every publish |
| OR ranges | `1.0.0 \|\| 2.0.0` | Multiple moving targets |
| Mutable git branch ref | `github:owner/repo#master` | Branch can be force-pushed |
| Unpinned git source | `github:owner/repo` | Defaults to default branch |

Safe patterns that are **not** flagged: exact semver (`1.2.3`), git SHA pins (`github:owner/repo#abc1234`), version tags (`github:owner/repo#v1.2.3`).


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
| `check-optional-dependencies` | Also check `optionalDependencies`. | `'true'` |


## Example output

```
Checking "packages/ui/package.json" for pinned versions...
::error file=packages/ui/package.json::react: "^18.0.0" — caret/tilde range; use exact version "18.0.0"
::error file=packages/ui/package.json::my-fork: "github:owner/repo#master" — mutable git branch ref; pin to a commit SHA (e.g. "git+https://github.com/owner/repo.git#abc1234")
  ✓ package.json
  ✓ packages/core/package.json

2 unpinned version(s) found. Use exact versions (e.g. "1.2.3" not "^1.2.3").
```


## Recommended: pair with `.npmrc`

Add `save-exact=true` to your `.npmrc` so `npm install <pkg>` writes exact versions locally instead of ranges:

```
save-exact=true
```

This guides developers at the source; the action is the CI guardrail that ensures nothing slips through.


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
