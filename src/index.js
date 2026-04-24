'use strict';
const fs = require('fs');
const path = require('path');
const { findPackageJsonFiles } = require('./find.js');
const { checkFile } = require('./check.js');

const filesInput = (process.env['INPUT_FILES'] || '').trim();
const rootPath = (process.env['INPUT_ROOT-PATH'] || '.').trim();
const checkPeer = process.env['INPUT_CHECK-PEER-DEPENDENCIES'] === 'true';
const checkOptional = process.env['INPUT_CHECK-OPTIONAL-DEPENDENCIES'] !== 'false';
const workspace = process.env['GITHUB_WORKSPACE'] || process.cwd();

let files;
if (filesInput) {
  files = filesInput.split(/\r?\n/).map(f => f.trim()).filter(Boolean).map(f => path.resolve(workspace, f));
} else {
  const resolvedRoot = path.resolve(workspace, rootPath);
  let stat;
  try { stat = fs.statSync(resolvedRoot); } catch {
    console.log(`::error::root-path does not exist: ${resolvedRoot}`);
    process.exit(1);
  }
  if (!stat.isDirectory()) {
    console.log(`::error::root-path must be a directory, got: ${resolvedRoot}`);
    process.exit(1);
  }
  files = findPackageJsonFiles(resolvedRoot);
}

if (files.length === 0) {
  console.log('::warning::No package.json files found.');
  process.exit(0);
}

let violations = 0;
for (const file of files) {
  const rel = path.relative(workspace, file);
  console.log(`Checking "${rel}" for pinned versions...`);
  let bad;
  try {
    bad = checkFile(file, { checkPeer, checkOptional });
  } catch (e) {
    console.log(`::error file=${rel}::Could not parse package.json: ${e.message}`);
    violations++;
    continue;
  }
  for (const { name, version } of bad) {
    const stripped = version.replace(/^[\^~>=<\s]+/, '').replace(/\s*\|\|.*$/, '').trim();
    const suggestion = stripped && stripped !== version
      ? `use exact version "${stripped}"`
      : 'pin to an exact version (e.g. "1.2.3")';
    console.log(`::error file=${rel}::${name}: "${version}" — ${suggestion}`);
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
