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
});
