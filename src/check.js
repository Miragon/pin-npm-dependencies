'use strict';
const fs = require('fs');

function checkFile(filePath, { checkPeer = false } = {}) {
  const pkg = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const entries = [
    ...Object.entries(pkg.dependencies || {}),
    ...Object.entries(pkg.devDependencies || {}),
    ...(checkPeer ? Object.entries(pkg.peerDependencies || {}) : []),
  ];
  return entries
    .filter(([, v]) => /[\^~]/.test(String(v)))
    .map(([name, version]) => ({ name, version }));
}

module.exports = { checkFile };
