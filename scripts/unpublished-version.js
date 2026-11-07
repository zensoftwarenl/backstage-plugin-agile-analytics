#!/usr/bin/env node
// Prints `version=X.Y.Z` when the packages' shared version is not on npm yet
// for at least one of them, and nothing otherwise. Used by the release
// workflow to decide whether to publish.
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const packages = fs
  .readdirSync(path.join(ROOT, 'plugins'))
  .map(dir => require(path.join(ROOT, 'plugins', dir, 'package.json')));

const versions = new Set(packages.map(p => p.version));
if (versions.size !== 1) {
  console.error(
    `The packages must share one version, found ${[...versions].join(', ')}`,
  );
  process.exit(1);
}
const [version] = versions;

const isPublished = name => {
  try {
    return (
      execFileSync('npm', ['view', `${name}@${version}`, 'version'], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim() === version
    );
  } catch {
    return false; // E404: the package or version doesn't exist yet
  }
};

const missing = packages.filter(p => !isPublished(p.name));
if (missing.length) {
  console.error(
    `Not on npm yet: ${missing.map(p => `${p.name}@${version}`).join(', ')}`,
  );
  console.log(`version=${version}`);
} else {
  console.error(`All packages are on npm at ${version}`);
}
