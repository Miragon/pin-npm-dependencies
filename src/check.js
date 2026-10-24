'use strict';
const fs = require('fs');

function suggestExactVersion(version) {
  const stripped = version.replace(/^[\^~>=<\s]+/, '').replace(/\s*\|\|.*$/, '').trim();
  return stripped && stripped !== version
    ? `use exact version "${stripped}"`
    : 'pin to an exact version (e.g. "1.2.3")';
}

function suggestCommitSha() {
  return 'pin to a commit SHA (e.g. "git+https://github.com/owner/repo.git#abc1234")';
}

const RULES = [
  { re: /[\^~]/, reason: 'caret/tilde range', suggest: suggestExactVersion },
  { re: /^\s*[><]/, reason: 'comparison range', suggest: suggestExactVersion },
  { re: /^\s*\*$/, reason: 'wildcard *', suggest: suggestExactVersion },
  { re: /^\s*latest\s*$/, reason: 'floating "latest" tag', suggest: suggestExactVersion },
  { re: /\.\s*[xX*](?:\.|$)/, reason: 'x-range (e.g. 1.x)', suggest: suggestExactVersion },
  { re: /^\s*[xX]\b/, reason: 'standalone x-range', suggest: suggestExactVersion },
  { re: /\|\|/, reason: 'OR range', suggest: suggestExactVersion },
  // git deps: mutable branch name after # (master, main, HEAD, common dev branches)
  { re: /#(master|main|HEAD|develop|dev|next|trunk)\b/, reason: 'mutable git branch ref', suggest: suggestCommitSha },
  // git deps: no # fragment at all — npm defaults to the default branch (mutable)
  { re: /^(git\+https?:|git\+ssh:|git:\/\/|git@|github:|gitlab:|bitbucket:)[^#]*$/, reason: 'unpinned git source (no commit ref)', suggest: suggestCommitSha },
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

function findViolatedRule(v) {
  const proto = PROTOCOLS.find(p => p.match(v));
  if (proto) return findViolatedRule(proto.resolve(v)); // classify the inner selector
  return RULES.find(r => r.re.test(v));                  // normal dependency
}

function checkFile(filePath, { checkPeer = false, checkOptional = true } = {}) {
  const pkg = JSON.parse(fs.readFileSync(filePath, 'utf8')); // throws on bad JSON
  const entries = [
    ...Object.entries(pkg.dependencies || {}),
    ...Object.entries(pkg.devDependencies || {}),
    ...(checkPeer ? Object.entries(pkg.peerDependencies || {}) : []),
    ...(checkOptional ? Object.entries(pkg.optionalDependencies || {}) : []),
  ];
  return entries.flatMap(([name, version]) => {
    const rule = findViolatedRule(String(version));
    return rule ? [{ name, version, reason: rule.reason, suggestion: rule.suggest(String(version)) }] : [];
  });
}

module.exports = { checkFile };
