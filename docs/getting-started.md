# Getting started

Add the check to a workflow, see what it reports and fix the first finding. Takes five minutes.

**Requirements:** a GitHub repository with a `package.json` and a workflow that runs on pull requests. Works with npm, yarn and pnpm.

## 1. Add the step

The step goes before the install step, so a version you did not choose never runs:

```yaml{8-9}
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1

      - name: Enforce pinned dependencies
        uses: miragon/pin-npm-dependencies@3f7f02fa2454cdd2cdb65df19b081c0d77d301a5 # v1.2.2

      - run: npm ci
      - run: npm test
```

Without inputs it checks every `package.json` in the repository and skips `node_modules`, `.git`, `dist` and `build`. It needs no token and no permissions.

::: tip Pin the action, too
The examples pin actions to a commit SHA, for the same reason the action asks you to pin packages. `@v1` works as well and follows every 1.x release.
:::

## 2. Open a pull request

On a `package.json` with a range and a branch ref, the step fails:

```txt
Checking "package.json" for pinned versions...
::error file=package.json::axios: "^1.7.2" — caret/tilde range; use exact version "1.7.2"
::error file=package.json::ui-kit: "github:acme/ui-kit#main" — mutable git branch ref; pin to a commit SHA (e.g. "git+https://github.com/owner/repo.git#abc1234")

2 unpinned version(s) found. Use exact versions (e.g. "1.2.3" not "^1.2.3").
```

Each `::error` line becomes an annotation on `package.json` in the pull request. It names the dependency and the reason.

## 3. Pin and push again

Write the version your lockfile already installs, not the one in the message: the message only strips the `^`, your lockfile knows what you tested.

```sh
npm ls axios
```

```txt
└── axios@1.7.9
```

For a git dependency, write the commit the branch points to (`git ls-remote https://github.com/acme/ui-kit main`):

```json
"dependencies": {
  "axios": "1.7.9",
  "ui-kit": "github:acme/ui-kit#4f2c9e1"
}
```

Run `npm install` so the lockfile matches, commit both files and push. The next run passes:

```txt
Checking "package.json" for pinned versions...
  ✓ package.json

✓ All dependencies across 1 file(s) are pinned.
```

## Troubleshooting

::: details `::warning::No package.json files found.`
`root-path` points to a folder without a `package.json`, or every one sits under `node_modules`, `.git`, `dist` or `build`. Check the path relative to the repository root, or list the files with `files`.
:::

::: details `::error::root-path does not exist` or `root-path must be a directory`
`root-path` is a folder relative to the repository root, not to the workflow file. The step also needs `actions/checkout` before it.
:::

::: details `Could not parse package.json`
The file is not valid JSON, or a path in `files` does not exist. The action counts it as a finding and fails.
:::

::: details A value that looks pinned is flagged
Any `~` fails, also in `file:~/x`, and a branch-like word after `#` fails, also in `#main-fix`. See [Rules](./reference/rules.md#edge-cases).
:::

::: details A peer dependency with a range does not fail
That is the default: a library states the versions it works with as a range. Set `check-peer-dependencies: 'true'` to check them too.
:::

## Next steps

- [Fix findings](./fixing.md): pin each kind of finding, and keep npm, yarn, pnpm, Renovate and Dependabot from writing ranges again.
- [Roll out](./rollout.md): turn the check on across many repositories without blocking everyone on day one.
- [Guarantees and limits](./guarantees.md): what the check covers and what passes without a check.
