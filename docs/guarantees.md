# Guarantees and limits

What the check promises, and what passes without a check. Read it before you rely on it as a supply chain control.

## What it guarantees

1. **Every value is checked against the [rules](./reference/rules.md).** In each checked `package.json`, a value in `dependencies`, `devDependencies` or (by default) `optionalDependencies` that matches a rule fails the step. A value that matches no rule passes.
2. **If the step runs before the install, a flagged range never installs.** The step exits with code 1, and the jobs after it do not run.
3. **A file that cannot be read fails.** Invalid JSON, or a path in `files` that does not exist, counts as a finding.
4. **Nothing leaves the runner.** The action reads files and prints annotations. It makes no network request, needs no token and changes no file.

## What it reads

| Field | Checked |
|---|---|
| `dependencies`, `devDependencies` | always |
| `optionalDependencies` | by default, `check-optional-dependencies: 'false'` turns it off |
| `peerDependencies` | only with `check-peer-dependencies: 'true'` |
| `overrides` (npm), `resolutions` (yarn), `pnpm.overrides` | no |
| `engines`, `packageManager` | no |
| `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml` | no |

## Passes without a check

The action reads text, not the registry. These values match no rule and pass, though they can move:

| Value | Example | Pin instead |
|---|---|---|
| dist-tags other than `latest` | `next`, `beta`, `npm:foo@latest` | the version the tag points to |
| partial versions | `1.2`, `1` | `1.2.3` |
| GitHub shorthand without a prefix | `owner/repo` | `github:owner/repo#<sha>` |
| branch names outside the list | `#feature-x` | a commit SHA |
| git tags | `#v1.2.3` | a commit SHA: a tag can be moved |
| tarball URLs, `link:`, `file:` without `~` | `https://example.com/pkg.tgz` | a registry version |

## Other limits

- **Transitive dependencies are not checked.** An exact `axios` still pulls its own dependencies by range. The lockfile pins those: commit it and install with `npm ci`, `yarn install --immutable` or `pnpm install --frozen-lockfile`.
- **Only listed folders are skipped.** `node_modules`, `.git`, `dist` and `build` at any depth. A `package.json` in a fixture or `vendor/` folder is checked, unless you list the files with `files`.

## Next steps

- [Rules](./reference/rules.md): every pattern, its message and the edge cases.
- [Why pin dependencies](./why-pin.md): the attack this check stops.
