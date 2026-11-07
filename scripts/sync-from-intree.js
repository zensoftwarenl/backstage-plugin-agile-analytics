#!/usr/bin/env node
/*
 * Brings changes made to ZEN's in-tree Agile Analytics plugins (in the
 * zen-backstage repo) into this repo. See AGENTS.md for when and how.
 *
 * For every in-tree file it does a three-way merge with `git merge-file`:
 *   base   = the in-tree file at sync/state.json's lastSyncedCommit, renamed
 *   ours   = the file in this repo
 *   theirs = the in-tree file at the target commit, renamed
 * where "renamed" applies sync/rename-map.json and the deep-link rewrite. So
 * the public-only changes in this repo survive and upstream changes come in;
 * where both touched the same lines there are conflict markers to resolve.
 *
 *   node scripts/sync-from-intree.js --source ../zen-backstage [--to <ref>] [--dry-run]
 *   node scripts/sync-from-intree.js --source ../zen-backstage --delta
 *
 * --delta prints how this repo differs from the renamed in-tree code at
 * lastSyncedCommit: the intentional public delta, to review.
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const STATE_FILE = path.join(ROOT, 'sync/state.json');
const PACKAGES = [
  'agile-analytics',
  'agile-analytics-backend',
  'agile-analytics-common',
];
const DEEP_LINK_FILES = ['DeepLink.tsx', 'DeepLink.test.tsx', 'index.ts'];
// Kept by hand in this repo; upstream changes to them are only reported.
const PUBLIC_OWNED = /(^|\/)(package\.json|README\.md|CHANGELOG\.md)$/;
// In-tree only, never brought over.
const SKIPPED = ['plugins/agile-analytics/src/legacy.ts'];

function parseArgs() {
  const args = { to: 'HEAD', dryRun: false, delta: false };
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--source') args.source = argv[++i];
    else if (arg === '--to') args.to = argv[++i];
    else if (arg === '--dry-run') args.dryRun = true;
    else if (arg === '--delta') args.delta = true;
    else throw new Error(`Unknown argument ${arg}`);
  }
  if (!args.source) {
    throw new Error('Pass --source <path to a zen-backstage checkout>');
  }
  return args;
}

const git = (cwd, ...args) =>
  execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    maxBuffer: 1 << 28,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

function show(source, commit, file) {
  try {
    return git(source, 'show', `${commit}:${file}`);
  } catch {
    return undefined;
  }
}

/** Where an in-tree path lives in this repo, or undefined to leave it out. */
function targetPath(prefix, file) {
  const rel = file.slice(prefix.length + 1);
  const [pkg, ...rest] = rel.split('/');
  if (PACKAGES.includes(pkg)) return `plugins/${pkg}/${rest.join('/')}`;
  if (pkg === 'deep-link-react' && rest[0] === 'src') {
    const name = rest.slice(1).join('/');
    if (DEEP_LINK_FILES.includes(name)) {
      return `plugins/agile-analytics/src/deepLink/${name}`;
    }
  }
  return undefined;
}

const renameMap = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'sync/rename-map.json'), 'utf8'),
);

function rename(target, content) {
  let out = content;
  for (const rule of renameMap.rules) {
    if (rule.files && !rule.files.some(suffix => target.endsWith(suffix))) {
      continue;
    }
    out = rule.regex
      ? out.replace(new RegExp(rule.from, 'g'), rule.to)
      : out.split(rule.from).join(rule.to);
  }
  // The deep-link library is vendored into the frontend package
  if (out.includes('@internal/backstage-plugin-deep-link-react')) {
    const from = path.posix.dirname(target);
    let rel = path.posix.relative(from, 'plugins/agile-analytics/src/deepLink');
    if (!rel.startsWith('.')) rel = `./${rel}`;
    out = out.split('@internal/backstage-plugin-deep-link-react').join(rel);
  }
  return out;
}

function listFiles(source, commit, prefix) {
  return git(source, 'ls-tree', '-r', '--name-only', commit, '--', prefix)
    .split('\n')
    .filter(Boolean);
}

function main() {
  const args = parseArgs();
  const source = path.resolve(args.source);
  const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  const prefix = state.sourcePrefix;
  const base = state.lastSyncedCommit;
  const to = git(source, 'rev-parse', args.to).trim();

  const files = new Set([
    ...listFiles(source, base, prefix),
    ...(args.delta ? [] : listFiles(source, to, prefix)),
  ]);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'aa-sync-'));
  const result = {
    merged: [],
    added: [],
    deleted: [],
    conflicts: [],
    publicOwned: [],
  };

  for (const file of [...files].sort()) {
    const target = targetPath(prefix, file);
    if (!target || SKIPPED.includes(target)) continue;
    const baseText = show(source, base, file);
    const ourPath = path.join(ROOT, target);
    const ours = fs.existsSync(ourPath)
      ? fs.readFileSync(ourPath, 'utf8')
      : undefined;

    if (args.delta) {
      if (PUBLIC_OWNED.test(target)) continue;
      const renamed = rename(target, baseText);
      if (renamed === ours) continue;
      fs.writeFileSync(path.join(tmp, 'base'), renamed);
      fs.writeFileSync(path.join(tmp, 'ours'), ours ?? '');
      try {
        execFileSync(
          'git',
          ['diff', '--no-index', '--no-color', '-U2', 'base', 'ours'],
          { cwd: tmp, encoding: 'utf8' },
        );
      } catch (e) {
        process.stdout.write(
          `\n### ${target}${ours === undefined ? ' (removed here)' : ''}\n`,
        );
        process.stdout.write(String(e.stdout).split('\n').slice(4).join('\n'));
      }
      continue;
    }

    const theirsRaw = show(source, to, file);
    if (baseText === theirsRaw) continue; // unchanged upstream

    if (PUBLIC_OWNED.test(target)) {
      result.publicOwned.push(target);
      continue;
    }
    const theirs =
      theirsRaw === undefined ? undefined : rename(target, theirsRaw);
    const baseRenamed =
      baseText === undefined ? undefined : rename(target, baseText);

    if (theirs === undefined) {
      // Deleted upstream: delete here too unless changed here
      if (ours !== undefined && ours === baseRenamed) {
        if (!args.dryRun) fs.unlinkSync(ourPath);
        result.deleted.push(target);
      } else if (ours !== undefined) {
        result.conflicts.push(`${target} (deleted upstream, changed here)`);
      }
      continue;
    }
    if (ours === undefined) {
      if (baseRenamed !== undefined) {
        result.conflicts.push(`${target} (changed upstream, removed here)`);
        continue;
      }
      if (!args.dryRun) {
        fs.mkdirSync(path.dirname(ourPath), { recursive: true });
        fs.writeFileSync(ourPath, theirs);
      }
      result.added.push(target);
      continue;
    }

    fs.writeFileSync(path.join(tmp, 'ours'), ours);
    fs.writeFileSync(path.join(tmp, 'base'), baseRenamed ?? '');
    fs.writeFileSync(path.join(tmp, 'theirs'), theirs);
    let clean = true;
    try {
      execFileSync('git', [
        'merge-file',
        '-L',
        'public',
        '-L',
        `in-tree ${base.slice(0, 8)}`,
        '-L',
        `in-tree ${to.slice(0, 8)}`,
        path.join(tmp, 'ours'),
        path.join(tmp, 'base'),
        path.join(tmp, 'theirs'),
      ]);
    } catch (e) {
      if (e.status < 0 || e.status > 127) throw e;
      clean = false;
    }
    if (!args.dryRun) {
      fs.writeFileSync(ourPath, fs.readFileSync(path.join(tmp, 'ours')));
    }
    (clean ? result.merged : result.conflicts).push(target);
  }
  fs.rmSync(tmp, { recursive: true, force: true });
  if (args.delta) return;

  const report = (title, list) =>
    list.length && console.log(`${title}:\n  ${list.join('\n  ')}`);
  console.log(`In-tree ${base.slice(0, 8)}..${to.slice(0, 8)}`);
  report('Merged', result.merged);
  report('Added', result.added);
  report('Deleted', result.deleted);
  report('CONFLICTS, resolve the markers', result.conflicts);
  report(
    'Changed upstream but kept by hand here, port by hand (dependencies, docs)',
    result.publicOwned,
  );
  if (
    !result.merged.length &&
    !result.added.length &&
    !result.deleted.length &&
    !result.conflicts.length &&
    !result.publicOwned.length
  ) {
    console.log('Nothing changed upstream.');
  }
  if (!args.dryRun && base !== to) {
    state.lastSyncedCommit = to;
    state.lastSyncedDate = git(source, 'show', '-s', '--format=%cs', to).trim();
    fs.writeFileSync(STATE_FILE, `${JSON.stringify(state, null, 2)}\n`);
  }
  if (result.conflicts.length) process.exitCode = 1;
}

main();
