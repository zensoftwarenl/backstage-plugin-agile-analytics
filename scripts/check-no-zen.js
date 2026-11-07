#!/usr/bin/env node
// Fails when code that ships to customers mentions ZEN-internal names or
// GitLab, other than the documented gitlab.com/project-slug fallback.
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FORBIDDEN = /zensoftware|\bzen[-/]|\bpied ?piper|piperchat|gitlab/i;
const ALLOWED = [
  // The standard Backstage annotation, read as a fallback in entity.ts
  /gitlab\.com\/project-slug/i,
  // The packages' own npm scope
  /@zensoftwarenl\/backstage-plugin-agile-analytics/,
  // Parsing GitLab repository URLs, in tests
  /gitlab\.com[:/]acme\//,
  /GitHub or GitLab/,
];

const offences = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['node_modules', 'dist', 'dist-types'].includes(entry.name)) {
        walk(full);
      }
    } else if (/\.(ts|tsx|js)$/.test(entry.name)) {
      fs.readFileSync(full, 'utf8')
        .split('\n')
        .forEach((line, i) => {
          let rest = line;
          for (const allowed of ALLOWED) rest = rest.replace(allowed, '');
          if (FORBIDDEN.test(rest)) {
            offences.push(
              `${path.relative(ROOT, full)}:${i + 1}: ${line.trim()}`,
            );
          }
        });
    }
  }
}
for (const pkg of fs.readdirSync(path.join(ROOT, 'plugins'))) {
  for (const sub of ['src', 'dev']) {
    const dir = path.join(ROOT, 'plugins', pkg, sub);
    if (fs.existsSync(dir)) walk(dir);
  }
}
if (offences.length) {
  console.error(`ZEN-internal names in shipped code:\n${offences.join('\n')}`);
  process.exit(1);
}
console.log('No ZEN-internal names in plugins/*/src and dev.');
