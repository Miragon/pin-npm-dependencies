# Rules

Every value the action flags, with the reason it prints, and every value it accepts.

## Flagged

| Reason in the message | Examples | Why it's risky |
|---|---|---|
| `caret/tilde range` | `^1.0.0`, `~2.3.4`, `npm:foo@^1.0.0`, `workspace:^1.0.0` | installs the newest matching release on every fresh install |
| `comparison range` | `>=1.0.0`, `<2.0.0` | no upper bound, or no lower one |
| `x-range (e.g. 1.x)`, `standalone x-range` | `1.x`, `1.2.*`, `x` | any minor or patch release |
| `wildcard *` | `*` | any version |
| `floating "latest" tag` | `latest` | moves with every publish |
| `OR range` | `1.0.0 \|\| 2.0.0` | several moving targets |
| `mutable git branch ref` | `github:owner/repo#main` | the branch moves with every push |
| `unpinned git source (no commit ref)` | `github:owner/repo`, `git+https://…/repo.git` | follows the default branch |

Branch names that fail: `master`, `main`, `HEAD`, `develop`, `dev`, `next`, `trunk`.

## Suggestions

| Value | Suggestion in the message |
|---|---|
| starts with `^`, `~`, `>`, `<` or `=` | the value without that prefix: `use exact version "1.7.2"` |
| a git source | `pin to a commit SHA (e.g. "git+https://github.com/owner/repo.git#abc1234")` |
| anything else | `pin to an exact version (e.g. "1.2.3")` |

The suggestion only strips the prefix. Write the version your lockfile installs ([Fix findings](../fixing.md)).

## Accepted

| Pattern | Example |
|---|---|
| Exact version | `1.2.3`, `1.2.3-beta.1` |
| Git commit | `github:owner/repo#4f2c9e1` |
| Git tag | `github:owner/repo#v1.2.3` |
| Yarn `patch:` with an exact inner version | `patch:pkg@npm%3A1.2.3#~/.yarn/patches/pkg.patch` |
| Yarn `workspace:` with an exact version or `*` | `workspace:1.2.3`, `workspace:*` |

A `patch:` or `workspace:` descriptor with a range inside, such as `workspace:^1.2.3`, is flagged like the range itself. Values that pass because no rule matches them are listed in [Guarantees and limits](../guarantees.md#passes-without-a-check).

## Edge cases

| Value | Result | Why |
|---|---|---|
| `file:~/x` | flagged, `caret/tilde range` | any `~` in the value fails, outside `patch:` descriptors |
| `github:owner/repo#main-fix` | flagged, `mutable git branch ref` | a listed branch name followed by `-`, `.` or `/` matches |
| `>=1.0.0 <2.0.0` | flagged, suggests `"1.0.0 <2.0.0"` | the suggestion strips only the leading operator |
