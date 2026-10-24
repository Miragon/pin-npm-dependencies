'use strict';

class PinReport {
  #lines = [];
  #violationCount = 0;
  #fileCount = 0;
  #inputError = null;

  static failedInput(message) {
    const report = new PinReport();
    report.#inputError = message;
    return report;
  }

  addWarning(message) {
    this.#lines.push(`::warning::${message}`);
  }

  addFile(relativePath, violations) {
    this.#startFile(relativePath);
    for (const { name, version, reason, suggestion } of violations) {
      this.#lines.push(`::error file=${relativePath}::${name}: "${version}" — ${reason}; ${suggestion}`);
    }
    this.#violationCount += violations.length;
    if (!violations.length) this.#lines.push(`  ✓ ${relativePath}`);
  }

  addUnreadableFile(relativePath, message) {
    this.#startFile(relativePath);
    this.#lines.push(`::error file=${relativePath}::Could not parse package.json: ${message}`);
    this.#violationCount++;
  }

  get exitCode() {
    return this.#inputError || this.#violationCount > 0 ? 1 : 0;
  }

  toLines() {
    if (this.#inputError) return [`::error::${this.#inputError}`];
    if (this.#fileCount === 0) return [...this.#lines, '::warning::No package.json files found.'];
    return [...this.#lines, this.#summary()];
  }

  #startFile(relativePath) {
    this.#fileCount++;
    this.#lines.push(`Checking "${relativePath}" for pinned versions...`);
  }

  #summary() {
    if (this.#violationCount === 0) return `\n✓ All dependencies across ${this.#fileCount} file(s) are pinned.`;
    return `\n${this.#violationCount} unpinned version(s) found. Use exact versions (e.g. "1.2.3" not "^1.2.3").`;
  }
}

module.exports = { PinReport };
