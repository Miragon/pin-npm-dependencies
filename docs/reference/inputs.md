# Inputs and output

Every input of `miragon/pin-npm-dependencies`, what it prints and how it exits.

## Inputs

All inputs are optional strings.

| Input | Default | What it does |
|---|---|---|
| `files` | `''` | Newline-separated `package.json` paths, relative to the repository root. When set, `root-path` is ignored. |
| `root-path` | `'.'` | Folder to search for `package.json` files. Skips `node_modules`, `.git`, `dist` and `build` at any depth. |
| `check-optional-dependencies` | `'true'` | Also check `optionalDependencies`. |
| `check-peer-dependencies` | `'false'` | Also check `peerDependencies`. Libraries declare them as ranges on purpose. |

The action has no outputs. Read the result from the status of the step.

## Output

For each file the action prints `Checking "<path>" for pinned versions...`, then one line per finding:

```txt
::error file=<path>::<name>: "<version>" — <reason>; <suggestion>
```

GitHub turns each line into an annotation on the file. A file without findings prints `✓ <path>`. [Rules](./rules.md) lists every reason and suggestion.

## Exit codes

| Code | When | Last line |
|---|---|---|
| `0` | every dependency is pinned | `✓ All dependencies across <n> file(s) are pinned.` |
| `0` | no `package.json` found | `::warning::No package.json files found.` |
| `1` | at least one finding | `<n> unpinned version(s) found. …` |
| `1` | a file is not valid JSON or does not exist | `<n> unpinned version(s) found. …`, the file counts as one, with `::error file=<path>::Could not parse package.json: …` before it |
| `1` | `root-path` does not exist | `::error::root-path does not exist: <path>` |
| `1` | `root-path` is a file | `::error::root-path must be a directory, got: <path>` |
