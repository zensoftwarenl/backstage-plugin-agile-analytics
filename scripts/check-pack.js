#!/usr/bin/env node
// Runs `npm pack --dry-run` for each package and fails if a tarball holds
// anything but the built output, its config schema and the docs.
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ALLOWED = [
  /^package\.json$/,
  /^README\.md$/,
  /^CHANGELOG\.md$/,
  /^LICENSE$/,
  /^config\.d\.ts$/,
  /^config\.schema\.json$/,
  /^dist\//,
];

let failed = false;
for (const pkg of fs.readdirSync(path.join(ROOT, 'plugins'))) {
  const cwd = path.join(ROOT, 'plugins', pkg);
  const [report] = JSON.parse(
    execFileSync('npm', ['pack', '--dry-run', '--json'], {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }),
  );
  const files = report.files.map(f => f.path);
  const unexpected = files.filter(f => !ALLOWED.some(re => re.test(f)));
  const missing = [
    'package.json',
    'README.md',
    'LICENSE',
    'dist/index.d.ts',
  ].filter(f => !files.includes(f));
  const leaked = files.filter(f =>
    /\.(test|stories)\.|setupTests|\/dev\//.test(f),
  );
  console.log(
    `${report.name}@${report.version}: ${files.length} files, ${report.size} bytes`,
  );
  for (const [label, list] of [
    ['unexpected', unexpected],
    ['missing', missing],
    ['tests or dev code', leaked],
  ]) {
    if (list.length) {
      failed = true;
      console.error(`  ${label}: ${list.join(', ')}`);
    }
  }
}
process.exit(failed ? 1 : 0);
