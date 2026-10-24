'use strict';
const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { ManifestLocator, InputError } = require('./manifest-locator.js');

const canRestrictPermissions = process.platform !== 'win32' && process.getuid?.() !== 0;

describe('ManifestLocator', () => {
  let workspace;

  function writeManifest(relPath) {
    const file = path.join(workspace, relPath);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, '{}');
  }

  function locate(options = {}) {
    return new ManifestLocator({ workspace, ...options }).locate();
  }

  beforeEach(() => { workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'locator-test-')); });
  afterEach(() => { fs.rmSync(workspace, { recursive: true, force: true }); });

  it('finds every package.json below the root, skipping node_modules', () => {
    writeManifest('package.json');
    writeManifest('packages/a/package.json');
    writeManifest('packages/b/package.json');
    writeManifest('node_modules/foo/package.json');
    const { files, warnings } = locate();
    assert.equal(files.length, 3);
    assert.ok(files.every(file => !file.includes('node_modules')));
    assert.deepEqual(warnings, []);
  });

  it('scans only below root-path', () => {
    writeManifest('package.json');
    writeManifest('app/package.json');
    assert.deepEqual(locate({ rootPath: 'app' }).files, [path.join(workspace, 'app/package.json')]);
  });

  it('returns no files for a directory without package.json', () => {
    assert.deepEqual(locate().files, []);
  });

  it('resolves explicit files against the workspace and ignores root-path', () => {
    const { files } = locate({ files: ' a/package.json \n\nb/package.json\r\n', rootPath: 'missing' });
    assert.deepEqual(files, [path.join(workspace, 'a/package.json'), path.join(workspace, 'b/package.json')]);
  });

  it('rejects a missing root-path', () => {
    assert.throws(() => locate({ rootPath: 'missing' }), error =>
      error instanceof InputError && /^root-path does not exist/.test(error.message));
  });

  it('rejects a root-path that is a file', () => {
    writeManifest('package.json');
    assert.throws(() => locate({ rootPath: 'package.json' }), error =>
      error instanceof InputError && /^root-path must be a directory/.test(error.message));
  });

  it('returns a warning for permission-denied directories and continues', { skip: !canRestrictPermissions }, () => {
    writeManifest('package.json');
    const locked = path.join(workspace, 'locked');
    fs.mkdirSync(locked);
    fs.chmodSync(locked, 0o000);
    try {
      const { files, warnings } = locate();
      assert.equal(files.length, 1);
      assert.deepEqual(warnings, [`Skipped (permission denied): ${locked}`]);
    } finally {
      fs.chmodSync(locked, 0o755);
    }
  });
});
