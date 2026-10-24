'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { ActionInputs } = require('./inputs.js');

describe('ActionInputs', () => {
  it('applies defaults when no inputs are set', () => {
    const inputs = ActionInputs.fromEnv({ GITHUB_WORKSPACE: '/ws' });
    assert.deepEqual({ ...inputs }, { files: '', rootPath: '.', checkPeer: false, checkOptional: true, workspace: '/ws' });
  });

  it('reads and trims the action inputs', () => {
    const inputs = ActionInputs.fromEnv({
      'INPUT_FILES': ' a/package.json \n',
      'INPUT_ROOT-PATH': ' app ',
      'INPUT_CHECK-PEER-DEPENDENCIES': 'true',
      'INPUT_CHECK-OPTIONAL-DEPENDENCIES': 'false',
      GITHUB_WORKSPACE: '/ws',
    });
    assert.deepEqual({ ...inputs }, { files: 'a/package.json', rootPath: 'app', checkPeer: true, checkOptional: false, workspace: '/ws' });
  });
});
