# Roll out across repositories

Turn the check on in many repositories without blocking every pull request on day one.

**Requirements:** admin or maintainer rights on the repositories, to change workflows and required checks.

## 1. Report first

`continue-on-error` keeps the job green while the step still annotates every finding:

```yaml{3}
- name: Enforce pinned dependencies
  uses: miragon/pin-npm-dependencies@3f7f02fa2454cdd2cdb65df19b081c0d77d301a5 # v1.2.2
  continue-on-error: true
```

Merge this everywhere. Each pull request now shows the findings without failing.

## 2. Pin the existing ranges

Per repository, either let Renovate do it (`"rangeStrategy": "pin"` opens one pull request that pins everything, see [Fix findings](./fixing.md#keep-update-bots-pinned)) or pin by hand from the lockfile. Commit `save-exact=true` in `.npmrc` in the same pull request, so no new range comes in.

## 3. Enforce

Remove `continue-on-error`. Make the job a required status check in the branch protection or ruleset of the default branch, so a red check blocks the merge.

## Exclude a folder

The action has no exclude input. Folders named `node_modules`, `.git`, `dist` and `build` are skipped. To leave out anything else, such as test fixtures or `vendor/`, list the files to check:

```yaml
- uses: miragon/pin-npm-dependencies@3f7f02fa2454cdd2cdb65df19b081c0d77d301a5 # v1.2.2
  with:
    files: |
      package.json
      packages/core/package.json
```

## Next steps

- [Monorepos](./monorepos.md): one package, a list of files, one job per package.
- [Guarantees and limits](./guarantees.md): what to tell your security team the check does and does not cover.
