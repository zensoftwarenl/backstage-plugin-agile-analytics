#!/usr/bin/env node
// Prints the CHANGELOG section of a version of the frontend package, which
// carries the same entries as the others, for the GitHub release.
const fs = require('fs');
const path = require('path');

const version = process.argv[2];
const changelog = fs.readFileSync(
  path.resolve(__dirname, '../plugins/agile-analytics/CHANGELOG.md'),
  'utf8',
);
const lines = changelog.split('\n');
const start = lines.findIndex(line => line.trim() === `## ${version}`);
if (start < 0) {
  console.log(`Release ${version}.`);
  process.exit(0);
}
const end = lines.findIndex((line, i) => i > start && /^## /.test(line));
const notes = lines
  .slice(start + 1, end < 0 ? undefined : end)
  .join('\n')
  .trim();
console.log(`${notes}

Packages:
- @zensoftwarenl/backstage-plugin-agile-analytics@${version}
- @zensoftwarenl/backstage-plugin-agile-analytics-backend@${version}
- @zensoftwarenl/backstage-plugin-agile-analytics-common@${version}`);
