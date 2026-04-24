'use strict';
const fs = require('fs');

// Detects version strings that are not exact pinned semver.
// Catches: ^ ~ (caret/tilde), >= > < <= (comparisons), * (wildcard),
// latest (npm tag), 1.x / 1.X / 1.* (x-ranges), || (OR ranges).
// Does NOT flag: = prefix (exact in npm), hyphen ranges (1.0.0 - 2.0.0, rare).
const RANGE_RE = /[\^~]|^\s*[><]|^\s*\*$|^\s*latest\s*$|\.\s*[xX*](?:\.|$)|^\s*[xX]\b|\|\|/;

function checkFile(filePath, { checkPeer = false, checkOptional = true } = {}) {
  const pkg = JSON.parse(fs.readFileSync(filePath, 'utf8')); // throws on bad JSON
  const entries = [
    ...Object.entries(pkg.dependencies || {}),
    ...Object.entries(pkg.devDependencies || {}),
    ...(checkPeer ? Object.entries(pkg.peerDependencies || {}) : []),
    ...(checkOptional ? Object.entries(pkg.optionalDependencies || {}) : []),
  ];
  return entries
    .filter(([, v]) => RANGE_RE.test(String(v)))
    .map(([name, version]) => ({ name, version }));
}

module.exports = { checkFile };
