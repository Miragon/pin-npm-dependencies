'use strict';

class ActionInputs {
  static fromEnv(env) {
    return new ActionInputs({
      files: (env['INPUT_FILES'] || '').trim(),
      rootPath: (env['INPUT_ROOT-PATH'] || '.').trim(),
      checkPeer: env['INPUT_CHECK-PEER-DEPENDENCIES'] === 'true',
      checkOptional: env['INPUT_CHECK-OPTIONAL-DEPENDENCIES'] !== 'false',
      workspace: env['GITHUB_WORKSPACE'] || process.cwd(),
    });
  }

  constructor({ files = '', rootPath = '.', checkPeer = false, checkOptional = true, workspace }) {
    this.files = files;
    this.rootPath = rootPath;
    this.checkPeer = checkPeer;
    this.checkOptional = checkOptional;
    this.workspace = workspace;
  }
}

module.exports = { ActionInputs };
