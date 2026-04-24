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

describe('checkFile', () => {
  it('returns no violations for pinned deps', () => {
    const f = writePkg({ dependencies: { foo: '1.0.0' }, devDependencies: { bar: '2.3.4' } });
    assert.deepEqual(checkFile(f), []);
  });

  it('detects ^ caret ranges in dependencies', () => {
    const f = writePkg({ dependencies: { foo: '^1.0.0' } });
    assert.deepEqual(checkFile(f), [{ name: 'foo', version: '^1.0.0' }]);
  });

  it('detects ~ tilde ranges in devDependencies', () => {
    const f = writePkg({ devDependencies: { bar: '~2.0.0' } });
    assert.deepEqual(checkFile(f), [{ name: 'bar', version: '~2.0.0' }]);
  });

  it('skips peerDependencies by default', () => {
    const f = writePkg({ dependencies: { foo: '1.0.0' }, peerDependencies: { peer: '^3.0.0' } });
    assert.deepEqual(checkFile(f), []);
  });

  it('checks peerDependencies when checkPeer is true', () => {
    const f = writePkg({ peerDependencies: { peer: '^3.0.0' } });
    assert.deepEqual(checkFile(f, { checkPeer: true }), [{ name: 'peer', version: '^3.0.0' }]);
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
});
