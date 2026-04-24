'use strict';
const path = require('path');
const { findPackageJsonFiles } = require('./find.js');
const { checkFile } = require('./check.js');

const filesInput = (process.env['INPUT_FILES'] || '').trim();
const rootPath = (process.env['INPUT_ROOT-PATH'] || '.').trim();
const checkPeer = process.env['INPUT_CHECK-PEER-DEPENDENCIES'] === 'true';
const workspace = process.env['GITHUB_WORKSPACE'] || process.cwd();

let files;
if (filesInput) {
  files = filesInput.split(/\r?\n/).map(f => f.trim()).filter(Boolean).map(f => path.resolve(workspace, f));
} else {
  files = findPackageJsonFiles(path.resolve(workspace, rootPath));
}

if (files.length === 0) {
  console.log('::warning::No package.json files found.');
  process.exit(0);
}

console.log(`Checking ${files.length} package.json file(s)...\n`);

let violations = 0;
for (const file of files) {
  const rel = path.relative(workspace, file);
  const bad = checkFile(file, { checkPeer });
  for (const { name, version } of bad) {
    const suggested = version.replace(/[\^~]/, '');
    console.log(`::error file=${rel}::${name}: "${version}" — use exact version "${suggested}"`);
    violations++;
  }
  if (!bad.length) {
    console.log(`  ✓ ${rel}`);
  }
}

if (violations > 0) {
  console.log(`\n${violations} unpinned version(s) found. Use exact versions (e.g. "1.2.3" not "^1.2.3").`);
  process.exit(1);
}

console.log(`\n✓ All dependencies across ${files.length} file(s) are pinned.`);
