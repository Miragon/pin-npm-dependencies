# Contributing

## Run the tests

The action runs on Node 24 and has no dependencies.

```sh
npm test
```

[`test.yml`](.github/workflows/test.yml) runs the unit tests and integration jobs that use the action itself (`uses: ./`) on every push and pull request.

## Repository layout

| Path | What it holds |
|---|---|
| [`action.yml`](action.yml) | Inputs and the entry point of the action |
| [`src/index.js`](src/index.js) | Reads the inputs, runs the check, sets the exit code |
| [`src/action-inputs.js`](src/action-inputs.js) | Parses the `INPUT_*` environment variables |
| [`src/manifest-locator.js`](src/manifest-locator.js) | Finds the `package.json` files to check |
| [`src/pin-policy.js`](src/pin-policy.js) | The rules that flag or accept a version value |
| [`src/pin-check.js`](src/pin-check.js), [`src/pin-report.js`](src/pin-report.js) | Checks each file and prints the annotations |
| [`docs/`](docs) | The VitePress docs site |

## Preview the docs

```sh
cd docs
npm ci
npm run dev
```

[`docs.yml`](.github/workflows/docs.yml) builds the site on pull requests and publishes it to [miragon.github.io/pin-npm-dependencies](https://miragon.github.io/pin-npm-dependencies/) from `main`. The kit in `docs/.vitepress/miragon/` comes from the Miragon corporate identity; `npm run check:kit` fails when it was edited here.

## Commits and releases

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org) (`feat:`, `fix:`, `docs:`, …). [Release Please](.github/workflows/release.yml) opens a release pull request from them; merging it tags the release and moves the floating major tag (`v1`).
