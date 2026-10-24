'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { checkManifest } = require('./check.js');

function checkManifestReasons(pkg, options) {
  return checkManifest(pkg, options).map(({ suggestion, ...violation }) => violation);
}

describe('checkManifest', () => {
  it('returns no violations for pinned deps', () => {
    const pkg = { dependencies: { foo: '1.0.0' }, devDependencies: { bar: '2.3.4' } };
    assert.deepEqual(checkManifest(pkg), []);
  });

  it('detects ^ caret ranges in dependencies', () => {
    const pkg = { dependencies: { foo: '^1.0.0' } };
    assert.deepEqual(checkManifestReasons(pkg), [{ name: 'foo', version: '^1.0.0', reason: 'caret/tilde range' }]);
  });

  it('detects ~ tilde ranges in devDependencies', () => {
    const pkg = { devDependencies: { bar: '~2.0.0' } };
    assert.deepEqual(checkManifestReasons(pkg), [{ name: 'bar', version: '~2.0.0', reason: 'caret/tilde range' }]);
  });

  it('skips peerDependencies by default', () => {
    const pkg = { dependencies: { foo: '1.0.0' }, peerDependencies: { peer: '^3.0.0' } };
    assert.deepEqual(checkManifest(pkg), []);
  });

  it('checks peerDependencies when checkPeer is true', () => {
    const pkg = { peerDependencies: { peer: '^3.0.0' } };
    assert.deepEqual(checkManifestReasons(pkg, { checkPeer: true }), [{ name: 'peer', version: '^3.0.0', reason: 'caret/tilde range' }]);
  });

  it('handles missing dependency sections gracefully', () => {
    const pkg = {};
    assert.deepEqual(checkManifest(pkg), []);
  });

  it('reports multiple violations', () => {
    const pkg = { dependencies: { a: '^1.0.0', b: '~2.0.0', c: '3.0.0' } };
    const result = checkManifest(pkg);
    assert.equal(result.length, 2);
    assert.ok(result.some(v => v.name === 'a'));
    assert.ok(result.some(v => v.name === 'b'));
  });

  // --- extended range detection ---

  it('detects * wildcard', () => {
    const pkg = { dependencies: { foo: '*' } };
    assert.deepEqual(checkManifestReasons(pkg), [{ name: 'foo', version: '*', reason: 'wildcard *' }]);
  });

  it('detects latest tag', () => {
    const pkg = { dependencies: { foo: 'latest' } };
    assert.deepEqual(checkManifestReasons(pkg), [{ name: 'foo', version: 'latest', reason: 'floating "latest" tag' }]);
  });

  it('detects >= comparison ranges', () => {
    const pkg = { dependencies: { foo: '>=1.0.0' } };
    assert.deepEqual(checkManifestReasons(pkg), [{ name: 'foo', version: '>=1.0.0', reason: 'comparison range' }]);
  });

  it('detects 1.x x-ranges', () => {
    const pkg = { dependencies: { foo: '1.x' } };
    assert.deepEqual(checkManifestReasons(pkg), [{ name: 'foo', version: '1.x', reason: 'x-range (e.g. 1.x)' }]);
  });

  it('detects || OR ranges', () => {
    const pkg = { dependencies: { foo: '1.0.0 || 2.0.0' } };
    assert.deepEqual(checkManifestReasons(pkg), [{ name: 'foo', version: '1.0.0 || 2.0.0', reason: 'OR range' }]);
  });

  it('does NOT flag prerelease tags containing x (no false positive)', () => {
    const pkg = { dependencies: { foo: '1.0.0-fix', bar: '2.0.0-experimental' } };
    assert.deepEqual(checkManifest(pkg), []);
  });

  it('checks optionalDependencies by default', () => {
    const pkg = { optionalDependencies: { opt: '^1.0.0' } };
    assert.deepEqual(checkManifestReasons(pkg), [{ name: 'opt', version: '^1.0.0', reason: 'caret/tilde range' }]);
  });

  it('skips optionalDependencies when checkOptional is false', () => {
    const pkg = { optionalDependencies: { opt: '^1.0.0' } };
    assert.deepEqual(checkManifest(pkg, { checkOptional: false }), []);
  });

  // --- git URL / mutable branch ref detection ---

  it('detects github: shorthand with #master branch ref', () => {
    const pkg = { dependencies: { foo: 'github:owner/repo#master' } };
    assert.deepEqual(checkManifestReasons(pkg), [{ name: 'foo', version: 'github:owner/repo#master', reason: 'mutable git branch ref' }]);
  });

  it('detects git+https URL with #main branch ref', () => {
    const pkg = { dependencies: { foo: 'git+https://github.com/owner/repo.git#main' } };
    assert.deepEqual(checkManifestReasons(pkg), [{ name: 'foo', version: 'git+https://github.com/owner/repo.git#main', reason: 'mutable git branch ref' }]);
  });

  it('detects github: shorthand with #HEAD', () => {
    const pkg = { dependencies: { foo: 'github:owner/repo#HEAD' } };
    assert.deepEqual(checkManifestReasons(pkg), [{ name: 'foo', version: 'github:owner/repo#HEAD', reason: 'mutable git branch ref' }]);
  });

  it('detects github: shorthand with no hash (defaults to default branch)', () => {
    const pkg = { dependencies: { foo: 'github:owner/repo' } };
    assert.deepEqual(checkManifestReasons(pkg), [{ name: 'foo', version: 'github:owner/repo', reason: 'unpinned git source (no commit ref)' }]);
  });

  it('does NOT flag github: shorthand pinned to a commit SHA', () => {
    const pkg = { dependencies: { foo: 'github:owner/repo#abc1234' } };
    assert.deepEqual(checkManifest(pkg), []);
  });

  it('does NOT flag github: shorthand pinned to a version tag', () => {
    const pkg = { dependencies: { foo: 'github:owner/repo#v1.2.3' } };
    assert.deepEqual(checkManifest(pkg), []);
  });

  // --- Yarn patch: protocol descriptors ---

  it('does NOT flag patch: descriptor with an exact inner version', () => {
    const v = 'patch:some-package@npm%3A1.2.3#~/.yarn/patches/some-package-npm-1.2.3-abcdef1234.patch';
    const pkg = { dependencies: { 'some-package': v } };
    assert.deepEqual(checkManifest(pkg), []);
  });

  it('does NOT flag patch: descriptor with a scoped inner package name', () => {
    const v = 'patch:@scope/pkg@npm%3A1.2.3#~/.yarn/patches/scope-pkg-npm-1.2.3-abcdef.patch';
    const pkg = { dependencies: { '@scope/pkg': v } };
    assert.deepEqual(checkManifest(pkg), []);
  });

  it('does NOT flag patch: descriptor using the #~builtin form', () => {
    const v = 'patch:fsevents@npm%3A2.3.2#~builtin<compat/fsevents>';
    const pkg = { dependencies: { fsevents: v } };
    assert.deepEqual(checkManifest(pkg), []);
  });

  it('does NOT flag patch: descriptor with an already-decoded inner version', () => {
    const v = 'patch:some-package@npm:1.2.3#~/.yarn/patches/some-package.patch';
    const pkg = { dependencies: { 'some-package': v } };
    assert.deepEqual(checkManifest(pkg), []);
  });

  it('detects patch: descriptor whose inner version is a caret range', () => {
    const v = 'patch:some-package@npm%3A^1.2.3#~/.yarn/patches/some-package.patch';
    const pkg = { dependencies: { 'some-package': v } };
    assert.deepEqual(checkManifestReasons(pkg), [{ name: 'some-package', version: v, reason: 'caret/tilde range' }]);
  });

  // --- Yarn workspace: protocol descriptors ---

  it('does NOT flag workspace: descriptor with an exact reference', () => {
    const pkg = { dependencies: { pkg: 'workspace:1.2.3' } };
    assert.deepEqual(checkManifest(pkg), []);
  });

  it('does NOT flag workspace:* wildcard reference', () => {
    const pkg = { dependencies: { pkg: 'workspace:*' } };
    assert.deepEqual(checkManifest(pkg), []);
  });

  it('detects workspace: descriptor with a caret range', () => {
    const pkg = { dependencies: { pkg: 'workspace:^1.2.3' } };
    assert.deepEqual(checkManifestReasons(pkg), [{ name: 'pkg', version: 'workspace:^1.2.3', reason: 'caret/tilde range' }]);
  });

  it('detects workspace: descriptor with a tilde range', () => {
    const pkg = { dependencies: { pkg: 'workspace:~1.0.0' } };
    assert.deepEqual(checkManifestReasons(pkg), [{ name: 'pkg', version: 'workspace:~1.0.0', reason: 'caret/tilde range' }]);
  });

  // --- fix suggestions ---

  it('suggests the exact version stripped of its range operator', () => {
    const pkg = { dependencies: { foo: '^1.2.3', bar: '>=2.0.0 || 3.0.0' } };
    assert.deepEqual(checkManifest(pkg).map(v => v.suggestion), ['use exact version "1.2.3"', 'use exact version "2.0.0"']);
  });

  it('suggests a generic exact version when nothing can be stripped', () => {
    const pkg = { dependencies: { foo: 'latest' } };
    assert.equal(checkManifest(pkg)[0].suggestion, 'pin to an exact version (e.g. "1.2.3")');
  });

  it('suggests a commit SHA for git sources', () => {
    const pkg = { dependencies: { foo: 'github:owner/repo#main', bar: 'github:owner/repo' } };
    const suggestions = checkManifest(pkg).map(v => v.suggestion);
    assert.ok(suggestions.every(s => s.startsWith('pin to a commit SHA')));
  });
});
