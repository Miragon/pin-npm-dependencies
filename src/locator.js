'use strict';
const fs = require('fs');
const path = require('path');

const SKIPPED_DIRECTORIES = new Set(['node_modules', '.git', 'dist', 'build']);

class InputError extends Error {}

class ManifestLocator {
  #workspace;
  #explicitFiles;
  #rootPath;
  #warnings = [];

  constructor({ workspace, files = '', rootPath = '.' }) {
    this.#workspace = workspace;
    this.#explicitFiles = files;
    this.#rootPath = rootPath;
  }

  locate() {
    const files = this.#explicitFiles ? this.#resolveExplicitFiles() : this.#scanRoot();
    return { files, warnings: this.#warnings };
  }

  #resolveExplicitFiles() {
    return this.#explicitFiles
      .split(/\r?\n/)
      .map(file => file.trim())
      .filter(Boolean)
      .map(file => path.resolve(this.#workspace, file));
  }

  #scanRoot() {
    const root = path.resolve(this.#workspace, this.#rootPath);
    this.#assertDirectory(root);
    return this.#walk(root);
  }

  #assertDirectory(root) {
    let stat;
    try { stat = fs.statSync(root); } catch {
      throw new InputError(`root-path does not exist: ${root}`);
    }
    if (!stat.isDirectory()) throw new InputError(`root-path must be a directory, got: ${root}`);
  }

  #walk(dir) {
    return this.#readDirectory(dir).flatMap(entry => {
      const entryPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return SKIPPED_DIRECTORIES.has(entry.name) ? [] : this.#walk(entryPath);
      return entry.name === 'package.json' ? [entryPath] : [];
    });
  }

  #readDirectory(dir) {
    try {
      return fs.readdirSync(dir, { withFileTypes: true });
    } catch (error) {
      if (error.code === 'EACCES') this.#warnings.push(`Skipped (permission denied): ${dir}`);
      return [];
    }
  }
}

module.exports = { ManifestLocator, InputError };
