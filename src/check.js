'use strict';
const fs = require('fs');

const RULES = [
  { re: /[\^~]/,                                                                   reason: 'caret/tilde range' },
  { re: /^\s*[><]/,                                                                reason: 'comparison range' },
  { re: /^\s*\*$/,                                                                 reason: 'wildcard *' },
  { re: /^\s*latest\s*$/,                                                          reason: 'floating "latest" tag' },
  { re: /\.\s*[xX*](?:\.|$)/,                                                     reason: 'x-range (e.g. 1.x)' },
  { re: /^\s*[xX]\b/,                                                             reason: 'standalone x-range' },
  { re: /\|\|/,                                                                    reason: 'OR range' },
  // git deps: mutable branch name after # (master, main, HEAD, common dev branches)
  { re: /#(master|main|HEAD|develop|dev|next|trunk)\b/,                           reason: 'mutable git branch ref' },
  // git deps: no # fragment at all — npm defaults to the default branch (mutable)
  { re: /^(git\+https?:|git\+ssh:|git:\/\/|git@|github:|gitlab:|bitbucket:)[^#]*$/, reason: 'unpinned git source (no commit ref)' },
];

function getViolationReason(v) {
  const rule = RULES.find(r => r.re.test(v));
  return rule ? rule.reason : null;
}

function checkFile(filePath, { checkPeer = false, checkOptional = true } = {}) {
  const pkg = JSON.parse(fs.readFileSync(filePath, 'utf8')); // throws on bad JSON
  const entries = [
    ...Object.entries(pkg.dependencies || {}),
    ...Object.entries(pkg.devDependencies || {}),
    ...(checkPeer ? Object.entries(pkg.peerDependencies || {}) : []),
    ...(checkOptional ? Object.entries(pkg.optionalDependencies || {}) : []),
  ];
  return entries
    .filter(([, v]) => getViolationReason(String(v)) !== null)
    .map(([name, version]) => ({ name, version, reason: getViolationReason(String(version)) }));
}

module.exports = { checkFile };
