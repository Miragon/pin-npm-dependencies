'use strict';
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { findPackageJsonFiles } = require('./find.js');

describe('findPackageJsonFiles', () => {
  let tmp;

  before(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'find-test-'));
    fs.writeFileSync(path.join(tmp, 'package.json'), '{}');
    fs.mkdirSync(path.join(tmp, 'packages/a'), { recursive: true });
    fs.writeFileSync(path.join(tmp, 'packages/a/package.json'), '{}');
    fs.mkdirSync(path.join(tmp, 'packages/b'), { recursive: true });
    fs.writeFileSync(path.join(tmp, 'packages/b/package.json'), '{}');
    fs.mkdirSync(path.join(tmp, 'node_modules/foo'), { recursive: true });
    fs.writeFileSync(path.join(tmp, 'node_modules/foo/package.json'), '{}');
  });

  after(() => fs.rmSync(tmp, { recursive: true }));

  it('finds all package.json files excluding node_modules by default', () => {
    const found = findPackageJsonFiles(tmp);
    assert.equal(found.length, 3);
    assert.ok(found.every(f => !f.includes('node_modules')));
  });

  it('respects a custom skip set', () => {
    const found = findPackageJsonFiles(tmp, new Set(['packages', 'node_modules']));
    assert.equal(found.length, 1);
    assert.ok(found[0].endsWith('package.json'));
    assert.ok(!found[0].includes('packages'));
  });

  it('returns empty array for a directory with no package.json', () => {
    const empty = fs.mkdtempSync(path.join(os.tmpdir(), 'empty-'));
    assert.deepEqual(findPackageJsonFiles(empty), []);
    fs.rmSync(empty, { recursive: true });
  });

  it('emits ::warning:: for permission-denied directories and continues', () => {
    // Create a restricted subdir on platforms that support chmod
    const restricted = fs.mkdtempSync(path.join(os.tmpdir(), 'restricted-'));
    const inner = path.join(restricted, 'locked');
    fs.mkdirSync(inner);
    fs.writeFileSync(path.join(restricted, 'package.json'), '{}');
    fs.chmodSync(inner, 0o000);

    const messages = [];
    const orig = console.log;
    console.log = (...args) => messages.push(args.join(' '));
    try {
      const found = findPackageJsonFiles(restricted);
      // Root package.json is still found
      assert.equal(found.length, 1);
      // A warning was emitted for the locked dir (skip on Windows/root where chmod doesn't apply)
      const warned = messages.some(m => m.includes('::warning::') && m.includes('locked'));
      if (process.platform !== 'win32' && process.getuid && process.getuid() !== 0) {
        assert.ok(warned, 'expected ::warning:: for permission-denied directory');
      }
    } finally {
      console.log = orig;
      fs.chmodSync(inner, 0o755);
      fs.rmSync(restricted, { recursive: true });
    }
  });
});
