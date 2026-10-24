'use strict';
const fs = require('fs');
const path = require('path');
const { ManifestLocator, InputError } = require('./locator.js');
const { PinPolicy } = require('./policy.js');

function run({ files: filesInput = '', rootPath = '.', checkPeer = false, checkOptional = true, workspace }) {
  let located;
  try {
    located = new ManifestLocator({ workspace, files: filesInput, rootPath }).locate();
  } catch (error) {
    if (error instanceof InputError) return { lines: [`::error::${error.message}`], exitCode: 1 };
    throw error;
  }
  const { files, warnings } = located;

  if (files.length === 0) {
    return { lines: ['::warning::No package.json files found.'], exitCode: 0 };
  }

  const lines = warnings.map(warning => `::warning::${warning}`);
  let violations = 0;
  for (const file of files) {
    const rel = path.relative(workspace, file);
    lines.push(`Checking "${rel}" for pinned versions...`);
    let bad;
    try {
      bad = new PinPolicy({ checkPeer, checkOptional }).violationsIn(JSON.parse(fs.readFileSync(file, 'utf8')));
    } catch (e) {
      lines.push(`::error file=${rel}::Could not parse package.json: ${e.message}`);
      violations++;
      continue;
    }
    for (const { name, version, reason, suggestion } of bad) {
      lines.push(`::error file=${rel}::${name}: "${version}" — ${reason}; ${suggestion}`);
      violations++;
    }
    if (!bad.length) {
      lines.push(`  ✓ ${rel}`);
    }
  }

  if (violations > 0) {
    lines.push(`\n${violations} unpinned version(s) found. Use exact versions (e.g. "1.2.3" not "^1.2.3").`);
    return { lines, exitCode: 1 };
  }

  lines.push(`\n✓ All dependencies across ${files.length} file(s) are pinned.`);
  return { lines, exitCode: 0 };
}

module.exports = { run };
