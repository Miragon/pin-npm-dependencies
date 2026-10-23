# Monorepos

Check a whole monorepo, one package, a fixed list of files or each package in its own job.

## Check the whole repository

The default checks every `package.json` below the repository root, workspaces included, and skips folders named `node_modules`, `.git`, `dist` and `build` at any depth:

```yaml
- uses: miragon/pin-npm-dependencies@3f7f02fa2454cdd2cdb65df19b081c0d77d301a5 # v1.2.2
```

## Check one package

`root-path` starts the search in a folder, relative to the repository root:

```yaml
- uses: miragon/pin-npm-dependencies@3f7f02fa2454cdd2cdb65df19b081c0d77d301a5 # v1.2.2
  with:
    root-path: packages/my-lib
```

## Check a list of files

`files` checks exactly these files and ignores `root-path`. It is also the only way to leave out a folder, such as test fixtures:

```yaml
- uses: miragon/pin-npm-dependencies@3f7f02fa2454cdd2cdb65df19b081c0d77d301a5 # v1.2.2
  with:
    files: |
      package.json
      packages/core/package.json
      packages/ui/package.json
```

## Check each package in its own job

A matrix gives each package its own check in the pull request:

```yaml
jobs:
  pinned:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        package: [core, ui, cli]
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
      - uses: miragon/pin-npm-dependencies@3f7f02fa2454cdd2cdb65df19b081c0d77d301a5 # v1.2.2
        with:
          root-path: packages/${{ matrix.package }}
```

## Leave peer dependencies as ranges

A package you publish states its peer dependencies as a range on purpose (`"react": "^18.0.0 || ^19.0.0"`). The action leaves `peerDependencies` out by default. Turn them on only for applications that never publish:

```yaml
- uses: miragon/pin-npm-dependencies@3f7f02fa2454cdd2cdb65df19b081c0d77d301a5 # v1.2.2
  with:
    check-peer-dependencies: 'true'
```

## Next steps

- [Inputs and output](./reference/inputs.md): every input and its default.
- [Roll out](./rollout.md): turn the check on without blocking everyone on day one.
