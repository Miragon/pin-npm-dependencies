# Fix findings

Pin each finding the action reports, then keep your tools from writing ranges again.

## Fix a red check

1. **Find the installed version.** `npm ls <name>`, `yarn why <name>` or `pnpm why <name>` prints what your lockfile installs. Take that version, not the one in the message.
2. **Write it to `package.json`**, without `^`, `~` or a range.
3. **Install and commit.** `npm install`, `yarn` or `pnpm install` updates the lockfile. Commit both files.

## By message

| Reason in the message | Write instead |
|---|---|
| `caret/tilde range` | the installed version |
| `comparison range`, `OR range` | the installed version. The suggestion in the message is wrong for compound ranges (`>=1.0.0 <2.0.0` suggests `"1.0.0 <2.0.0"`). |
| `x-range (e.g. 1.x)`, `standalone x-range`, `wildcard *`, `floating "latest" tag` | the installed version |
| `mutable git branch ref`, `unpinned git source (no commit ref)` | a commit SHA: `git ls-remote https://github.com/<owner>/<repo> <branch>` prints it |
| `Could not parse package.json` | valid JSON, or a path in `files` that exists |

## Write exact versions by default

The action is the gate in CI. These settings keep ranges from being written in the first place. Commit the file, so every developer, CI job and agent that adds a package writes `1.2.3` instead of `^1.2.3`.

::: code-group

```ini [npm, pnpm (.npmrc)]
save-exact=true
```

```yaml [Yarn 2+ (.yarnrc.yml)]
defaultSemverRangePrefix: ""
```

```ini [Yarn 1 (.yarnrc)]
save-prefix ""
```

:::

## Keep update bots pinned

A pinned dependency still gets updates: the bot opens a pull request with the next exact version, and you review it.

::: code-group

```json [Renovate (renovate.json)]
{
  "extends": ["config:recommended"],
  "rangeStrategy": "pin"
}
```

```yaml [Dependabot (.github/dependabot.yml)]
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
```

:::

Dependabot keeps an exact version exact when it bumps it, no extra setting needed. Renovate with `rangeStrategy: "pin"` also opens one pull request that pins the ranges it finds, a quick way to fix an existing repository.

## Next steps

- [Rules](./reference/rules.md): every message, and the values that are flagged by surprise.
- [Roll out](./rollout.md): fix existing repositories before the check blocks them.
