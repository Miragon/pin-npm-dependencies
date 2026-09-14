'use strict';
const fs = require('fs');

const RULES = [
  { re: /[\^~]/, reason: 'caret/tilde range' },
  { re: /^\s*[><]/, reason: 'comparison range' },
  { re: /^\s*\*$/, reason: 'wildcard *' },
  { re: /^\s*latest\s*$/, reason: 'floating "latest" tag' },
  { re: /\.\s*[xX*](?:\.|$)/, reason: 'x-range (e.g. 1.x)' },
  { re: /^\s*[xX]\b/, reason: 'standalone x-range' },
  { re: /\|\|/, reason: 'OR range' },
  // git deps: mutable branch name after # (master, main, HEAD, common dev branches)
  { re: /#(master|main|HEAD|develop|dev|next|trunk)\b/, reason: 'mutable git branch ref' },
  // git deps: no # fragment at all — npm defaults to the default branch (mutable)
  { re: /^(git\+https?:|git\+ssh:|git:\/\/|git@|github:|gitlab:|bitbucket:)[^#]*$/, reason: 'unpinned git source (no commit ref)' },
];

function safeDecode(s) {
  try { return decodeURIComponent(s); } catch { return s; }
}

// Deterministic Yarn protocol descriptors. Each resolver unwraps a descriptor to the
// inner version selector that should be classified; the first whose `match` hits wins.
// Extend by adding entries (e.g. file:, npm: alias).
const PROTOCOLS = [
  {
    // patch:<inner>#<patch-file> — validate the inner (patched) version, ignore the
    // #patch-file fragment (which legitimately holds '~', e.g. '#~/.yarn/patches' / '#~builtin')
    match: v => /^patch:.+?#/.test(v),
    resolve: v => {
      const inner = safeDecode(/^patch:(.+?)#/.exec(v)[1]); // some-package@npm:1.2.3
      const sel = inner.slice(inner.lastIndexOf('@') + 1);  // npm:1.2.3
      return sel.replace(/^npm:/, '');                      // 1.2.3
    },
  },
  {
    // workspace:<ref> — an exact ref or '*' is deterministic (Yarn rewrites it to the
    // exact version on publish); ranges (^ ~ …) fall through to RULES and are rejected
    match: v => /^workspace:/.test(v),
    resolve: v => {
      const ref = v.slice('workspace:'.length).trim();
      return ref === '*' ? '' : ref; // '' classifies as pinned (no rule matches)
    },
  },
];

function getViolationReason(v) {
  const proto = PROTOCOLS.find(p => p.match(v));
  if (proto) return getViolationReason(proto.resolve(v)); // classify the inner selector
  const rule = RULES.find(r => r.re.test(v));             // normal dependency
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
