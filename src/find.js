'use strict';
const fs = require('fs');
const path = require('path');

const DEFAULT_SKIP = new Set(['node_modules', '.git', 'dist', 'build']);

function findPackageJsonFiles(rootDir, skip = DEFAULT_SKIP) {
  const results = [];
  function walk(dir) {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
    catch (e) {
      if (e.code === 'EACCES') console.log(`::warning::Skipped (permission denied): ${dir}`);
      return;
    }
    for (const e of entries) {
      if (e.isDirectory() && !skip.has(e.name)) walk(path.join(dir, e.name));
      else if (e.name === 'package.json') results.push(path.join(dir, e.name));
    }
  }
  walk(rootDir);
  return results;
}

module.exports = { findPackageJsonFiles };
