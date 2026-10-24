'use strict';
const fs = require('fs');
const path = require('path');
const { ManifestLocator, InputError } = require('./locator.js');
const { PinPolicy } = require('./policy.js');
const { PinReport } = require('./report.js');

class PinCheck {
  #inputs;
  #policy;

  constructor(inputs) {
    this.#inputs = inputs;
    this.#policy = new PinPolicy(inputs);
  }

  run() {
    let located;
    try {
      located = new ManifestLocator(this.#inputs).locate();
    } catch (error) {
      if (error instanceof InputError) return PinReport.failedInput(error.message);
      throw error;
    }
    const report = new PinReport();
    located.warnings.forEach(warning => report.addWarning(warning));
    located.files.forEach(file => this.#checkFile(file, report));
    return report;
  }

  #checkFile(file, report) {
    const relativePath = path.relative(this.#inputs.workspace, file);
    let manifest;
    try {
      manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (error) {
      return report.addUnreadableFile(relativePath, error.message);
    }
    report.addFile(relativePath, this.#policy.violationsIn(manifest));
  }
}

module.exports = { PinCheck };
