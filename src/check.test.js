'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { checkFile } = require('./check.js');

function writePkg(content) {
  const f = path.join(os.tmpdir(), `pkg-test-${Date.now()}-${Math.random()}.json`);
  fs.writeFileSync(f, JSON.stringify(content));
  return f;
}

function writePkgRaw(raw) {
  const f = path.join(os.tmpdir(), `pkg-test-${Date.now()}-${Math.random()}.json`);
  fs.writeFileSync(f, raw);
  return f;
}

describe('checkFile', () => {
  it('returns no violations for pinned deps', () => {
    const f = writePkg({ dependencies: { foo: '1.0.0' }, devDependencies: { bar: '2.3.4' } });
    assert.deepEqual(checkFile(f), []);
  });

  it('detects ^ caret ranges in dependencies', () => {
    const f = writePkg({ dependencies: { foo: '^1.0.0' } });
    assert.deepEqual(checkFile(f), [{ name: 'foo', version: '^1.0.0', reason: 'caret/tilde range' }]);
  });

  it('detects ~ tilde ranges in devDependencies', () => {
    const f = writePkg({ devDependencies: { bar: '~2.0.0' } });
    assert.deepEqual(checkFile(f), [{ name: 'bar', version: '~2.0.0', reason: 'caret/tilde range' }]);
  });

  it('skips peerDependencies by default', () => {
    const f = writePkg({ dependencies: { foo: '1.0.0' }, peerDependencies: { peer: '^3.0.0' } });
    assert.deepEqual(checkFile(f), []);
  });

  it('checks peerDependencies when checkPeer is true', () => {
    const f = writePkg({ peerDependencies: { peer: '^3.0.0' } });
    assert.deepEqual(checkFile(f, { checkPeer: true }), [{ name: 'peer', version: '^3.0.0', reason: 'caret/tilde range' }]);
  });

  it('handles missing dependency sections gracefully', () => {
    const f = writePkg({});
    assert.deepEqual(checkFile(f), []);
  });

  it('reports multiple violations', () => {
    const f = writePkg({ dependencies: { a: '^1.0.0', b: '~2.0.0', c: '3.0.0' } });
    const result = checkFile(f);
    assert.equal(result.length, 2);
    assert.ok(result.some(v => v.name === 'a'));
    assert.ok(result.some(v => v.name === 'b'));
  });

  // --- extended range detection ---

  it('throws on malformed JSON', () => {
    const f = writePkgRaw('{broken json');
    assert.throws(() => checkFile(f));
  });

  it('detects * wildcard', () => {
    const f = writePkg({ dependencies: { foo: '*' } });
    assert.deepEqual(checkFile(f), [{ name: 'foo', version: '*', reason: 'wildcard *' }]);
  });

  it('detects latest tag', () => {
    const f = writePkg({ dependencies: { foo: 'latest' } });
    assert.deepEqual(checkFile(f), [{ name: 'foo', version: 'latest', reason: 'floating "latest" tag' }]);
  });

  it('detects >= comparison ranges', () => {
    const f = writePkg({ dependencies: { foo: '>=1.0.0' } });
    assert.deepEqual(checkFile(f), [{ name: 'foo', version: '>=1.0.0', reason: 'comparison range' }]);
  });

  it('detects 1.x x-ranges', () => {
    const f = writePkg({ dependencies: { foo: '1.x' } });
    assert.deepEqual(checkFile(f), [{ name: 'foo', version: '1.x', reason: 'x-range (e.g. 1.x)' }]);
  });

  it('detects || OR ranges', () => {
    const f = writePkg({ dependencies: { foo: '1.0.0 || 2.0.0' } });
    assert.deepEqual(checkFile(f), [{ name: 'foo', version: '1.0.0 || 2.0.0', reason: 'OR range' }]);
  });

  it('does NOT flag prerelease tags containing x (no false positive)', () => {
    const f = writePkg({ dependencies: { foo: '1.0.0-fix', bar: '2.0.0-experimental' } });
    assert.deepEqual(checkFile(f), []);
  });

  it('checks optionalDependencies by default', () => {
    const f = writePkg({ optionalDependencies: { opt: '^1.0.0' } });
    assert.deepEqual(checkFile(f), [{ name: 'opt', version: '^1.0.0', reason: 'caret/tilde range' }]);
  });

  it('skips optionalDependencies when checkOptional is false', () => {
    const f = writePkg({ optionalDependencies: { opt: '^1.0.0' } });
    assert.deepEqual(checkFile(f, { checkOptional: false }), []);
  });

  // --- git URL / mutable branch ref detection ---

  it('detects github: shorthand with #master branch ref', () => {
    const f = writePkg({ dependencies: { foo: 'github:owner/repo#master' } });
    assert.deepEqual(checkFile(f), [{ name: 'foo', version: 'github:owner/repo#master', reason: 'mutable git branch ref' }]);
  });

  it('detects git+https URL with #main branch ref', () => {
    const f = writePkg({ dependencies: { foo: 'git+https://github.com/owner/repo.git#main' } });
    assert.deepEqual(checkFile(f), [{ name: 'foo', version: 'git+https://github.com/owner/repo.git#main', reason: 'mutable git branch ref' }]);
  });

  it('detects github: shorthand with #HEAD', () => {
    const f = writePkg({ dependencies: { foo: 'github:owner/repo#HEAD' } });
    assert.deepEqual(checkFile(f), [{ name: 'foo', version: 'github:owner/repo#HEAD', reason: 'mutable git branch ref' }]);
  });

  it('detects github: shorthand with no hash (defaults to default branch)', () => {
    const f = writePkg({ dependencies: { foo: 'github:owner/repo' } });
    assert.deepEqual(checkFile(f), [{ name: 'foo', version: 'github:owner/repo', reason: 'unpinned git source (no commit ref)' }]);
  });

  it('does NOT flag github: shorthand pinned to a commit SHA', () => {
    const f = writePkg({ dependencies: { foo: 'github:owner/repo#abc1234' } });
    assert.deepEqual(checkFile(f), []);
  });

  it('does NOT flag github: shorthand pinned to a version tag', () => {
    const f = writePkg({ dependencies: { foo: 'github:owner/repo#v1.2.3' } });
    assert.deepEqual(checkFile(f), []);
  });
});
