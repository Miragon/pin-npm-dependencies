'use strict';
const { run } = require('./run.js');

const { lines, exitCode } = run({
  files: (process.env['INPUT_FILES'] || '').trim(),
  rootPath: (process.env['INPUT_ROOT-PATH'] || '.').trim(),
  checkPeer: process.env['INPUT_CHECK-PEER-DEPENDENCIES'] === 'true',
  checkOptional: process.env['INPUT_CHECK-OPTIONAL-DEPENDENCIES'] !== 'false',
  workspace: process.env['GITHUB_WORKSPACE'] || process.cwd(),
});

for (const line of lines) console.log(line);
process.exit(exitCode);
