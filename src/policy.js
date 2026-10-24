'use strict';

const EXACT_VERSION_EXAMPLE = 'pin to an exact version (e.g. "1.2.3")';
const COMMIT_SHA_EXAMPLE = 'pin to a commit SHA (e.g. "git+https://github.com/owner/repo.git#abc1234")';

function suggestExactVersion(version) {
  const stripped = version.replace(/^[\^~>=<\s]+/, '').replace(/\s*\|\|.*$/, '').trim();
  return stripped && stripped !== version ? `use exact version "${stripped}"` : EXACT_VERSION_EXAMPLE;
}

const suggestCommitSha = () => COMMIT_SHA_EXAMPLE;

const MUTABLE_GIT_BRANCH = /#(master|main|HEAD|develop|dev|next|trunk)\b/;
const GIT_SOURCE_WITHOUT_REF = /^(git\+https?:|git\+ssh:|git:\/\/|git@|github:|gitlab:|bitbucket:)[^#]*$/;

const RULES = [
  { pattern: /[\^~]/, reason: 'caret/tilde range', suggest: suggestExactVersion },
  { pattern: /^\s*[><]/, reason: 'comparison range', suggest: suggestExactVersion },
  { pattern: /^\s*\*$/, reason: 'wildcard *', suggest: suggestExactVersion },
  { pattern: /^\s*latest\s*$/, reason: 'floating "latest" tag', suggest: suggestExactVersion },
  { pattern: /\.\s*[xX*](?:\.|$)/, reason: 'x-range (e.g. 1.x)', suggest: suggestExactVersion },
  { pattern: /^\s*[xX]\b/, reason: 'standalone x-range', suggest: suggestExactVersion },
  { pattern: /\|\|/, reason: 'OR range', suggest: suggestExactVersion },
  { pattern: MUTABLE_GIT_BRANCH, reason: 'mutable git branch ref', suggest: suggestCommitSha },
  { pattern: GIT_SOURCE_WITHOUT_REF, reason: 'unpinned git source (no commit ref)', suggest: suggestCommitSha },
];

const PINNED = '';

class PinPolicy {
  #checkPeer;
  #checkOptional;

  constructor({ checkPeer = false, checkOptional = true } = {}) {
    this.#checkPeer = checkPeer;
    this.#checkOptional = checkOptional;
  }

  violationsIn(manifest) {
    return this.#dependencyEntries(manifest).flatMap(([name, rawVersion]) => {
      const version = String(rawVersion);
      const rule = this.#findViolatedRule(version);
      return rule ? [{ name, version, reason: rule.reason, suggestion: rule.suggest(version) }] : [];
    });
  }

  #dependencyEntries(manifest) {
    return [
      ...Object.entries(manifest.dependencies || {}),
      ...Object.entries(manifest.devDependencies || {}),
      ...(this.#checkPeer ? Object.entries(manifest.peerDependencies || {}) : []),
      ...(this.#checkOptional ? Object.entries(manifest.optionalDependencies || {}) : []),
    ];
  }

  #findViolatedRule(version) {
    const selector = this.#unwrapProtocol(version);
    return RULES.find(rule => rule.pattern.test(selector));
  }

  #unwrapProtocol(version) {
    if (/^patch:.+?#/.test(version)) return this.#unwrapProtocol(unwrapYarnPatch(version));
    if (version.startsWith('workspace:')) return unwrapWorkspaceRef(version);
    return version;
  }
}

function unwrapYarnPatch(version) {
  const patchedDescriptor = safeDecode(/^patch:(.+?)#/.exec(version)[1]);
  const selector = patchedDescriptor.slice(patchedDescriptor.lastIndexOf('@') + 1);
  return selector.replace(/^npm:/, '');
}

function unwrapWorkspaceRef(version) {
  const ref = version.slice('workspace:'.length).trim();
  return ref === '*' ? PINNED : ref;
}

function safeDecode(text) {
  try { return decodeURIComponent(text); } catch { return text; }
}

module.exports = { PinPolicy };
