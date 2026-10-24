'use strict';
const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { run } = require('./run.js');

describe('run', () => {
  let workspace;

  function writePkg(relPath, raw) {
    const file = path.join(workspace, relPath);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, typeof raw === 'string' ? raw : JSON.stringify(raw));
  }

  beforeEach(() => { workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'run-test-')); });
  afterEach(() => { fs.rmSync(workspace, { recursive: true, force: true }); });

  it('passes when every scanned package.json is pinned', () => {
    writePkg('package.json', { dependencies: { foo: '1.0.0' } });
    writePkg('packages/a/package.json', { devDependencies: { bar: '2.0.0' } });
    const { lines, exitCode } = run({ workspace });
    assert.equal(exitCode, 0);
    assert.equal(lines.at(-1), '\n✓ All dependencies across 2 file(s) are pinned.');
  });

  it('fails with an annotation per violation', () => {
    writePkg('package.json', { dependencies: { foo: '^1.2.3' } });
    const { lines, exitCode } = run({ workspace });
    assert.equal(exitCode, 1);
    assert.ok(lines.includes('::error file=package.json::foo: "^1.2.3" — caret/tilde range; use exact version "1.2.3"'));
  });

  it('checks only the listed files and ignores root-path', () => {
    writePkg('package.json', { dependencies: { foo: '^1.0.0' } });
    writePkg('app/package.json', { dependencies: { foo: '1.0.0' } });
    const { exitCode } = run({ workspace, files: 'app/package.json\n', rootPath: 'does-not-exist' });
    assert.equal(exitCode, 0);
  });

  it('fails when root-path does not exist', () => {
    const { lines, exitCode } = run({ workspace, rootPath: 'missing' });
    assert.equal(exitCode, 1);
    assert.match(lines[0], /^::error::root-path does not exist/);
  });

  it('fails when root-path is a file', () => {
    writePkg('package.json', {});
    const { lines, exitCode } = run({ workspace, rootPath: 'package.json' });
    assert.equal(exitCode, 1);
    assert.match(lines[0], /^::error::root-path must be a directory/);
  });

  it('warns and passes when no package.json is found', () => {
    assert.deepEqual(run({ workspace }), { lines: ['::warning::No package.json files found.'], exitCode: 0 });
  });

  it('fails on a malformed package.json', () => {
    writePkg('package.json', '{broken json');
    const { lines, exitCode } = run({ workspace });
    assert.equal(exitCode, 1);
    assert.ok(lines.some(l => l.startsWith('::error file=package.json::Could not parse package.json')));
  });

  it('passes the peer and optional flags through', () => {
    writePkg('package.json', { peerDependencies: { p: '^1.0.0' }, optionalDependencies: { o: '^1.0.0' } });
    assert.equal(run({ workspace, checkOptional: false }).exitCode, 0);
    assert.equal(run({ workspace, checkPeer: true, checkOptional: false }).exitCode, 1);
  });
});
