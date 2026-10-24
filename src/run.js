'use strict';
const fs = require('fs');
const path = require('path');
const { findPackageJsonFiles } = require('./find.js');
const { checkManifest } = require('./check.js');

function resolveFiles({ files, rootPath, workspace }) {
  if (files) {
    return { files: files.split(/\r?\n/).map(f => f.trim()).filter(Boolean).map(f => path.resolve(workspace, f)) };
  }
  const resolvedRoot = path.resolve(workspace, rootPath);
  let stat;
  try { stat = fs.statSync(resolvedRoot); } catch {
    return { error: `::error::root-path does not exist: ${resolvedRoot}` };
  }
  if (!stat.isDirectory()) {
    return { error: `::error::root-path must be a directory, got: ${resolvedRoot}` };
  }
  return { files: findPackageJsonFiles(resolvedRoot) };
}

function run({ files: filesInput = '', rootPath = '.', checkPeer = false, checkOptional = true, workspace }) {
  const { files, error } = resolveFiles({ files: filesInput, rootPath, workspace });
  if (error) return { lines: [error], exitCode: 1 };

  if (files.length === 0) {
    return { lines: ['::warning::No package.json files found.'], exitCode: 0 };
  }

  const lines = [];
  let violations = 0;
  for (const file of files) {
    const rel = path.relative(workspace, file);
    lines.push(`Checking "${rel}" for pinned versions...`);
    let bad;
    try {
      bad = checkManifest(JSON.parse(fs.readFileSync(file, 'utf8')), { checkPeer, checkOptional });
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
