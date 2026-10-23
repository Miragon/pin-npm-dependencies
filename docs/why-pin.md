# Why pin dependencies

Why a version range is an open door in your supply chain, and what pinning changes.

## A range installs what exists at install time

`"axios": "^1.7.2"` does not mean axios 1.7.2. It means the newest `1.x` release from 1.7.2 on, at the moment the install resolves it. Today that is any of 37 published versions.

On March 31, 2026, an attacker took over the npm account of an axios maintainer and published `axios@1.14.1` and `axios@0.30.4`. Both added a dependency whose install script dropped a remote access trojan. npm removed them after about three hours ([Microsoft](https://www.microsoft.com/en-us/security/blog/?p=146284), [Endor Labs](https://www.endorlabs.com/learn/npm-axios-compromise), [StepSecurity](https://www.stepsecurity.io/blog/axios-compromised-on-npm-malicious-versions-drop-remote-access-trojan)).

`1.14.1` matches `^1.7.2`. In those three hours, every install that resolved `^1.7.2` fresh got it: `npm install` without a lockfile, a lockfile update, a new project, a Dependabot rebase. A committed lockfile with `npm ci` did not.

The pattern repeats:

1. A maintainer account is taken over, or an abandoned package name is registered again.
2. A new version is published, often with an install script that runs before anyone reviews it.
3. Every fresh resolution of a matching range installs it.

Pinning does not stop updates. It turns each update into a pull request someone reviews, instead of a change no one sees.

## Git branches move

```json
"ui-kit": "github:acme/ui-kit#main"
```

`#main` is a branch, not a version. Anyone who can push to it changes what you install. A commit SHA cannot change.

## Agents write ranges

Copilot, Cursor, Claude Code and autonomous agents add dependencies, often in automated pull requests. They learned from repositories where ranges are the norm, so they write `"react": "^18.3.0"` unless told otherwise. When an agent then runs `npm install` in CI, a compromised install script runs with the token of that job.

A check in CI catches the range in the pull request, whoever wrote it. `save-exact=true` in `.npmrc` makes agents write exact versions in the first place ([Fix findings](./fixing.md#write-exact-versions-by-default)).

## What pinning does not do

A pin fixes the version you declare, not the dependencies of that version. The lockfile fixes those. Pin, commit the lockfile and install with `npm ci`: together they install exactly what you reviewed. See [Guarantees and limits](./guarantees.md).

## Next steps

- [Getting started](./getting-started.md): add the check to a workflow.
- [Rules](./reference/rules.md): every flagged and accepted value.
